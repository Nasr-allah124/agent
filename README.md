# Agent Daisy Consulting

Application FastAPI (backend) + React (frontend) + PostgreSQL, conteneurisée avec Docker.

## Prérequis

- Docker Desktop installé et lancé (https://www.docker.com/products/docker-desktop)
- Git

## Installation

1. Cloner le repo :
```bash
git clone <url-du-repo>
cd agent_daisy_consulting
```

2. Créer les fichiers `.env` à partir des exemples fournis :
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Remplir les valeurs dans `backend/.env` :
   - `GOOGLE_API_KEY` : clé API Gemini (demander au responsable du projet si besoin)
   - `SECRET_KEY` : n'importe quelle chaîne aléatoire (ex: générée avec `openssl rand -hex 32`)
   - Les autres variables SMTP sont optionnelles si tu ne testes pas l'envoi d'emails

4. Vérifier les valeurs dans `.env` (racine) :
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` : peuvent rester tels quels ou être personnalisés

## Lancer le projet

```bash
docker-compose up --build
```

Premier lancement plus long (build des images). Les lancements suivants seront plus rapides :
```bash
docker-compose up
```

## Accès

- Frontend : http://localhost:8080
- Backend (API) : http://localhost:8020
- Backend healthcheck : http://localhost:8020 → doit retourner `{"status": "API en ligne"}`
- PostgreSQL (via un client comme pgAdmin/DBeaver) : `localhost:5433`

## Point d'attention

- Si tu as déjà un PostgreSQL local installé sur ton PC utilisant le port `5432`, aucun conflit ici : le PostgreSQL du projet Docker utilise le port `5433` côté machine hôte (mappé en interne sur `5432` dans le réseau Docker).
- Les migrations de base de données (Alembic) s'appliquent automatiquement au démarrage du conteneur backend.
- Le dossier `chroma_data_cv` (vecteurs des CV) est vide au premier lancement : il faudra réimporter les CV via l'interface pour les retrouver dans la recherche.

## Arrêter les conteneurs

```bash
docker-compose down
```

Pour tout arrêter **et supprimer les volumes** (efface la base de données et les vecteurs CV) :
```bash
docker-compose down -v
```

## Structure du projet

```
agent_daisy_consulting/
├── backend/          # API FastAPI
├── frontend/          # Application React
├── docker-compose.yml # Orchestration des 3 conteneurs (db, backend, frontend)
└── .env               # Variables d'environnement (non versionné)
```