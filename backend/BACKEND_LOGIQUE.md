# Logique complete du backend

Ce document explique comment le backend fonctionne, depuis le demarrage de l'API jusqu'aux traitements metier (authentification, CV, factures, conversations).

## 1) Vue d'ensemble

Le backend est une API FastAPI monolithique avec 4 grandes briques :
- Authentification et gestion utilisateurs (`/api/auth`)
- Traitement CV et recherche RH (`/cv`)
- Traitement factures et questions analytiques (`/factures`)
- Moteur de conversations multi-services (`/conversations`)

L'entree principale est `main.py` :
- cree l'application FastAPI
- active CORS pour le front local
- branche les routeurs des modules

## 2) Point d'entree HTTP

Routes enregistrees dans `main.py` :
- `cv_router` -> routes `/cv`
- `factures_router` -> routes `/factures`
- `conversations_router` -> routes `/conversations`
- `auth_router` -> routes `/api/auth`
- route de sante: `GET /` -> `{ "status": "API en ligne" }`

## 3) Configuration et environnement

`core/config.py` charge `.env` et expose :
- `DATABASE_URL` pour SQLAlchemy (PostgreSQL vise)
- `SECRET_KEY`, durees de tokens
- SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`)
- `FRONTEND_URL`

`core/llm.py` lit aussi `GOOGLE_API_KEY` et leve une erreur au demarrage si absente.

## 4) Couches de persistance

Le backend utilise plusieurs stockages selon les besoins :

1. Base relationnelle (SQLAlchemy + Alembic)
- `core/database.py` cree `engine`, `SessionLocal`, `Base`, et la dependance `get_db()`.
- Modele principal actuel: `modules/auth/models.py` (table `users`).
- Migration initiale: `alembic/versions/58eb8793d659_create_users_table.py`.

2. SQLite local pour les conversations
- `core/conversations_db.py`
- Tables: `conversations`, `messages`
- Sert de memoire persistante de chat (par service: `cv` ou `facture`).

3. SQLite local pour les factures
- `modules/factures/db.py`
- Table: `factures` (insertion, lecture, suppression).

4. Chroma vector store pour les CV
- `core/vector_store.py`
- Collection `cv_collection_api`, persistance dans `./chroma_data_cv`.

## 5) Securite et authentification

`core/security.py` fournit :
- hash mot de passe via `bcrypt`
- verification mot de passe
- creation JWT access token (algo HS256)
- decode JWT
- dependency FastAPI `get_current_user_id` avec `HTTPBearer`
- generation code de verification email (6 chiffres)

`core/email.py` envoie un email HTML de verification via SMTP + STARTTLS.

## 6) Module Auth (`/api/auth`)

Fichiers :
- `modules/auth/routes.py`
- `modules/auth/service.py`
- `modules/auth/schemas.py`
- `modules/auth/models.py`

Flux principal :
1. `POST /api/auth/signup`
- verifie unicite email
- hash le mot de passe
- cree un code de verification (15 min)
- enregistre l'utilisateur en base
- envoie l'email de verification

2. `POST /api/auth/verify-email`
- valide email + code + expiration
- active `is_verified`

3. `POST /api/auth/resend-code`
- regenere un code et renvoie l'email

4. `POST /api/auth/login`
- verifie credentials
- refuse si compte non verifie
- renvoie un `access_token` JWT

5. `GET /api/auth/me`
- exige Bearer token
- renvoie le profil utilisateur

## 7) Module CV (`/cv`)

Fichiers :
- `modules/cv/routes.py`
- `modules/cv/chunking.py`
- `modules/cv/scoring.py`
- `core/retriever.py`
- `core/vector_store.py`
- `core/llm.py`

### 7.1 Ingestion CV
`POST /cv/upload` :
- accepte un PDF
- lit le texte via `PyPDFLoader`
- demande au LLM de structurer en sections + nom candidat
- transforme en chunks `Document`
- ajoute les chunks dans Chroma

`GET /cv/candidats` :
- lit les metadonnees Chroma
- renvoie la liste unique des candidats

### 7.2 Recherche et scoring
`POST /cv/rechercher` :
- recupere les passages les plus proches (retriever semantique)
- envoie contexte + critere au LLM
- recoit un JSON structure par candidat (score, correspondance, justification)
- trie les candidats par score desc

### 7.3 Chat contextuel CV
Le module enregistre un gestionnaire dans le moteur de conversations :
- `enregistrer_gestionnaire("cv", _gestionnaire_cv)`
- ce gestionnaire utilise un RAG chain + resume de conversation
- renvoie: reponse textuelle + resume mis a jour

## 8) Module Factures (`/factures`)

Fichiers :
- `modules/factures/routes.py`
- `modules/factures/extraction.py`
- `modules/factures/db.py`
- `modules/factures/agent.py`
- `modules/factures/schemas.py`

### 8.1 Import et normalisation
`POST /factures/upload` (multi-fichiers) :
- accepte PDF/CSV/Excel
- PDF: extraction LLM des champs de facture
- CSV/Excel: detection des colonnes via LLM puis normalisation pandas
- calcule `montant_ttc`
- ajoute metadonnees d'import (`nom_fichier`, `taille_octets`, `date_import`)
- sauvegarde en SQLite avec gestion des doublons (numero unique)

`GET /factures/` :
- liste toutes les factures stockees

`DELETE /factures/{facture_id}` :
- supprime une facture par id

`DELETE /factures/par-fichier/{nom_fichier}` :
- supprime toutes les factures d'un fichier

### 8.2 Questions analytiques sur factures
Dans `modules/factures/agent.py` :
- le LLM genere une requete SQL structuree via schema Pydantic (`RequeteSQL`)
- validation stricte: `SELECT` uniquement, mots dangereux refuses
- execution SQLite
- reformulation en langage naturel
- tentative de generation d'une specification graphique (`bar`, `line`, `pie`) si pertinent

Le gestionnaire facture est branche dans le moteur de conversations :
- `enregistrer_gestionnaire("facture", _gestionnaire_facture)`

## 9) Moteur Conversations (`/conversations`)

Fichiers :
- `core/conversations.py`
- `core/conversations_db.py`

Objectif : offrir une interface unique de chat, independante du service.

Concept cle : registre de gestionnaires
- Chaque domaine enregistre une fonction: `fonction(question, resume)`
- Le routeur conversations appelle le bon gestionnaire selon `service`

Endpoints :
- `POST /conversations` : cree une conversation (`service` requis)
- `GET /conversations?service=...` : liste les conversations d'un service
- `GET /conversations/{id}` : recupere conversation + messages
- `DELETE /conversations/{id}` : supprime la conversation
- `POST /conversations/{id}/message` :
  - lit le resume memoire actuel
  - appelle le gestionnaire (`cv` ou `facture`)
  - enregistre message user + assistant
  - met a jour le resume
  - renomme automatiquement la conversation au 1er message

## 10) Composants LLM et RAG

`core/llm.py` fournit 3 objets caches :
- chat model Gemini
- embeddings document (`retrieval_document`)
- embeddings query (`retrieval_query`)

`core/retriever.py` :
- calcule embedding de la question
- fait `similarity_search_by_vector` dans Chroma
- formate les chunks pour les prompts

Prompts importants :
- CV chunking (structuration sections)
- CV scoring (JSON par candidat)
- CV RAG conversationnel
- Facture SQL generation structuree
- Resume conversation (CV et factures)

## 11) Dependances principales

D'apres `requirements.txt` :
- API: `fastapi`, `uvicorn`
- Validation: `pydantic`
- LLM/RAG: `langchain`, `langchain-google-genai`, `langchain-community`, `langchain-chroma`, `chromadb`, `pypdf`, `tenacity`
- Data: `sqlalchemy`, `psycopg2-binary`, `alembic`, `pandas`
- Auth: `python-jose`, `passlib[bcrypt]` (le code utilise aussi directement `bcrypt`)
- Utilitaires: `python-dotenv`, `python-multipart`

## 12) Flux de bout en bout (resume)

### 12.1 Auth
Front -> `/api/auth/signup` -> service auth -> DB users + SMTP -> verification -> login -> JWT -> endpoints proteges.

### 12.2 CV
Upload PDF -> chunking LLM -> stockage vectoriel Chroma -> recherche/scoring RAG -> reponse classee.

### 12.3 Factures
Upload PDF/CSV/Excel -> extraction/normalisation -> SQLite factures -> questions en langage naturel -> SQL SELECT gere par LLM -> reponse texte (+ graphique optionnel).

### 12.4 Conversations
Creation conversation (service) -> message utilisateur -> gestionnaire metier -> persistance des messages et du resume -> historique reutilisable pour les questions de suivi.

## 13) Points d'attention techniques

- `core/llm.py` impose `GOOGLE_API_KEY`; sans cle, l'API ne demarre pas.
- `core/security.py` contient des imports dupliques (`jwt`, `SECRET_KEY`) sans impact fonctionnel mais a nettoyer.
- `modules/factures/routes.py` appelle `creer_table()` a l'import; utile mais a surveiller en environnement multi-workers.
- `core/graphiques.py` / `core/graphiques_db.py` existent mais ne sont pas branches dans `main.py` actuellement.
- Le module auth est SQLAlchemy/PostgreSQL, alors que conversations et factures utilisent SQLite local: architecture hybride assumee mais a expliciter en production.

## 14) Recommandation d'organisation future

Pour faire evoluer le backend proprement :
- centraliser toutes les persistances dans une couche `repositories`
- harmoniser les bases (tout PostgreSQL ou separation formalisee)
- ajouter tests unitaires des services (`auth`, `factures.agent`, `cv.scoring`)
- ajouter logging structure et tracing des appels LLM
- ajouter gestion d'erreurs metier normalisee (codes et payloads homogenes)
