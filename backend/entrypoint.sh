#!/bin/sh
set -e

echo "Attente de la base de données..."
until python -c "
import psycopg2, os
psycopg2.connect(os.environ['DATABASE_URL'])
" 2>/dev/null; do
  sleep 1
done

echo "Application des migrations Alembic..."
alembic upgrade head

echo "Lancement du serveur..."
exec uvicorn main:app --host 0.0.0.0 --port 8020