# Logique backend (mise a jour)

Ce document decrit la logique backend actuellement en place, avec les evolutions recentes (auth complete avec refresh token, endpoints graphiques, isolation par utilisateur sur CV/factures/conversations).

## 1) Architecture generale

Le backend est une API FastAPI composee de 5 domaines exposes:
- Authentification: `/api/auth`
- CV et recherche RH: `/cv`
- Factures et analyse: `/factures`
- Conversations metier: `/conversations`
- Graphiques epingles: `/graphiques`

Point d'entree: `main.py`
- creation de l'app FastAPI
- activation CORS pour front local
- enregistrement des routeurs

## 2) Routeurs montes

Dans `main.py`, les routeurs suivants sont montes:
- `cv_router`
- `factures_router`
- `conversations_router`
- `graphiques_router`
- `auth_router`

Route de sante:
- `GET /` -> `{ "status": "API en ligne" }`

## 3) Configuration et pre-requis

`core/config.py` charge les variables d'environnement:
- `DATABASE_URL`
- `SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_DAYS`
- SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`)
- `FRONTEND_URL`

`core/llm.py` exige `GOOGLE_API_KEY` au demarrage.

## 4) Persistances utilisees

Le backend est hybride:

1. SQLAlchemy + PostgreSQL (auth)
- `core/database.py`
- modeles: `User`, `RefreshToken` dans `modules/auth/models.py`
- migrations Alembic (ex: creation users)

2. SQLite local conversations
- `core/conversations_db.py`
- tables: `conversations`, `messages`
- `user_id` est stocke dans `conversations` pour isoler les donnees

3. SQLite local factures
- `modules/factures/db.py`
- table `factures` avec `user_id`
- contrainte `UNIQUE(user_id, numero)`

4. SQLite local graphiques
- `core/graphiques_db.py`
- table `graphiques_epingles` avec `user_id`

5. ChromaDB (vector store CV)
- `core/vector_store.py`
- collection `cv_collection_api`
- metadonnees de chunks incluent `user_id` et infos fichier

## 5) Securite

`core/security.py` fournit:
- hash/verify de mot de passe avec `bcrypt`
- JWT access token (HS256)
- middleware de dependance `get_current_user_id` via `HTTPBearer`
- refresh token brut genere de facon aleatoire
- hash SHA-256 des refresh tokens stockes en base
- generation de code 6 chiffres pour verification/reinitialisation

`core/rate_limit.py` applique un rate-limit en memoire (process local) sur des routes sensibles.

## 6) Module Auth (`/api/auth`)

Fichiers:
- `modules/auth/routes.py`
- `modules/auth/service.py`
- `modules/auth/schemas.py`
- `modules/auth/models.py`

Endpoints:
- `POST /api/auth/signup`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-code`
- `POST /api/auth/login` -> renvoie `access_token` + `refresh_token`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Logique importante:
- verification email avant autorisation de login
- oubli mot de passe: message neutre pour eviter l'enumeration de comptes
- reset mot de passe: revoque toutes les sessions refresh actives
- refresh token rotation: l'ancien token est revoque et un nouveau couple est emis

## 7) Module CV (`/cv`)

Fichiers principaux:
- `modules/cv/routes.py`
- `modules/cv/chunking.py`
- `modules/cv/scoring.py`
- `core/retriever.py`
- `core/vector_store.py`

Endpoints:
- `POST /cv/upload` (PDF et DOCX)
- `GET /cv/candidats`
- `GET /cv/documents`
- `DELETE /cv/documents/{nom_fichier}`
- `POST /cv/rechercher`

Logique:
- upload -> extraction/segmentation LLM -> ajout chunks dans Chroma
- chaque chunk est tagge avec `user_id`, `nom_fichier`, `taille_octets`, `date_import`
- retrieval et scoring filtres par `user_id`
- gestionnaire conversation enregistre sous le service `cv`

## 8) Module Factures (`/factures`)

Fichiers principaux:
- `modules/factures/routes.py`
- `modules/factures/extraction.py`
- `modules/factures/db.py`
- `modules/factures/agent.py`
- `modules/factures/schemas.py`

Endpoints:
- `POST /factures/upload`
- `GET /factures/`
- `DELETE /factures/{facture_id}`
- `DELETE /factures/par-fichier/{nom_fichier}`

Logique:
- import multi-fichiers PDF/CSV/Excel
- extraction et normalisation via LLM + pandas
- calcul TTC et stockage en SQLite avec isolation `user_id`
- questions en langage naturel transformees en SQL `SELECT` uniquement
- execution SQL isolee par utilisateur
- reformulation textuelle et option de specification graphique

## 9) Module Conversations (`/conversations`)

Fichiers:
- `core/conversations.py`
- `core/conversations_db.py`

Role:
- couche commune de chat pour les services `cv` et `facture`
- registre de gestionnaires: `service -> fonction(question, resume, user_id)`

Endpoints:
- `POST /conversations`
- `GET /conversations?service=...`
- `GET /conversations/{conversation_id}`
- `DELETE /conversations/{conversation_id}`
- `POST /conversations/{conversation_id}/message`

Comportement:
- toutes les operations sont bornees a l'utilisateur courant
- persistance des messages + resume memoire
- renommage automatique de la conversation au premier message

## 10) Module Graphiques (`/graphiques`)

Fichiers:
- `core/graphiques.py`
- `core/graphiques_db.py`

Endpoints:
- `POST /graphiques`
- `GET /graphiques?service=...`
- `DELETE /graphiques/{graphique_id}`

Role:
- epingler/lister/supprimer des graphiques par service
- isolation par `user_id`

## 11) LLM, prompts et RAG

`core/llm.py` expose:
- modele de chat Gemini
- embeddings document
- embeddings query
- sortie structuree Pydantic via `get_model_structure`

Utilisation:
- CV: chunking, scoring, reponses RAG, resume d'historique
- Factures: generation SQL structuree, reformulation, proposition de graphique

## 12) Flux metiers de bout en bout

1. Auth
- Signup -> verification email -> login -> tokens -> endpoints proteges
- refresh token pour renouveler la session
- logout/revocation pour invalider la session

2. CV
- upload document -> chunks vectorises -> recherche et scoring -> chat contextualise via conversations

3. Factures
- upload/normalisation -> stockage facture -> questions analytiques SQL -> reponse + graphique eventuel

4. Conversations
- creation d'une conversation par service -> echanges persistants -> resume memoire pour questions de suivi

## 13) Attention integration frontend

- Le frontend utilise `VITE_API_URL=http://localhost:8020`.
- Certains composants frontend auth utilisent encore une URL API hardcodee (`http://localhost:8020`) au lieu d'unifier via variable d'environnement.

## 14) Points techniques a surveiller

- Architecture de persistence mixte (PostgreSQL + SQLite + Chroma) a formaliser pour la prod.
- Le rate limit actuel est en memoire locale (non partage entre workers).
- Des imports dupliques subsistent dans `core/security.py` et `modules/auth/models.py` (dette technique legere).
