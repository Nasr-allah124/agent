Archive — Description complète du projet
=========================================

Résumé
------
"Archive" est une application web (frontend React + backend FastAPI) qui fournit une interface de type "tiroir d'archives" pour classer, indexer, rechercher et interroger des documents (initialement CVs, puis factures). L'interface s'appuie sur un agent IA côté backend pour analyser le contenu des PDF, extraire des sections/compétences, construire un index vectoriel et répondre aux requêtes en langage naturel.

Objectifs
---------
- Automatiser le classement et l'indexation de CVs (et plus tard d'autres documents).
- Permettre une recherche par critères (compétences, expérience, mots-clés).
- Offrir une interface conversationnelle (chat) pour interroger l'archive et comparer candidats.
- Conserver une ergonomie "archive physique" (cartes, tampons, tiroirs) avec un design system cohérent.

Principales fonctionnalités
---------------------------
- Upload de PDF (classement automatique en fiches indexées).
- Indexation / vectorisation des documents (persistée via Chroma ou SQLite intermédiate).
- Listing des dossiers (nom des candidats) et consultation détaillée (`DossierCard`).
- Recherche par critère textualisé (API `rechercherCritere`).
- Chat conversationnel pour interroger l'archive (API `envoyerMessageChat`, `resetChat`).
- Module factures : placeholder visuel (à venir : extraction de factures, OCR, mapping de champs).

Architecture technique
----------------------
- Frontend : React + Vite + Tailwind CSS (v4). Structure principale dans `frontend/src`.
  - Pages : `ServiceSelector.jsx`, `CvPage.jsx`, `FacturePage.jsx`.
  - Composants : `Header.jsx`, `DossierCard.jsx`, `Logo.jsx`, etc.
  - API client : `src/api/cvApi.js` centralise les appels vers FastAPI.
- Backend : FastAPI (dossier `backend/`), expose endpoints pour upload, listing, recherche et chat.
  - Stockage vectoriel : Chroma (dossier `chroma_data_cv/` avec fichier SQLite), géré via `core/vector_store.py`.
  - Logique LLM / agent : `core/llm.py`, retriever : `core/retriever.py`.

Design system (à respecter)
---------------------------
Couleurs et variables définies dans `src/index.css` via `@theme` :
- ledger (fond sombre), ledgerline, parchment (cartes), parchmentline, ink (texte), brass (accent), stamp (tampon rouge), moss (texte discret).
Polices : `font-display` (Fraunces), `font-body` (Inter), `font-mono` (IBM Plex Mono).
Règles UI importantes : cartes inclinées, bordures `parchmentline`, boutons arrondis en `font-mono` majuscules tracking-widest.

Fichiers et structure clé
-------------------------
- frontend/
  - src/
    - pages/
      - ServiceSelector.jsx  (landing / choix de service)
      - CvPage.jsx           (page principale module CV : upload, recherche, chat)
      - FacturePage.jsx      (placeholder module factures)
    - components/
      - Header.jsx
      - DossierCard.jsx
      - Logo.jsx
    - api/
      - cvApi.js             (uploadCv, listerCandidats, rechercherCritere, envoyerMessageChat, resetChat)
    - index.css             (design tokens, thème)
- backend/
  - main.py                 (FastAPI app, points d'entrée HTTP)
  - requirements.txt        (dépendances Python)
  - core/
    - llm.py                (intégration LLM, fonctions d'appel au modèle)
    - retriever.py          (logique de récupération des passages pertinents)
    - vector_store.py       (wrapper Chroma / stockage vectoriel)
    - embeddings.py         (gestion des embeddings si séparée)
  - api/
    - routes_cv.py          (endpoints upload, listing, recherche, chat)
    - routes_health.py      (healthchecks / readiness)
  - services/
    - ingestion.py         (pipeline d'ingestion et découpage des PDF)
    - parsing.py           (extraction de texte / métadonnées)
  - db/
    - chroma_data_cv/      (répertoire Chroma / sqlite utilisé pour vecteurs)
  - utils/
    - files.py             (gestion des fichiers temporaires / stockage)
    - logging.py           (config logging)
  - tests/                  (tests backend, à créer)

Cette structure est indicative : selon l'évolution du projet certains modules peuvent être scindés ou renommés, mais elle reflète les responsabilités principales (API, core LLM/retriever, ingestion, vector store, utilitaires).

APIs exposées (principales)
---------------------------
- `POST /upload_cv` → upload d'un PDF, retourne métadonnées du candidat et nb_chunks.
- `GET /candidats` → liste des candidats indexés.
- `POST /rechercher` → recherche par critère, retourne candidats pertinents + contexte.
- `POST /chat` → envoie une question au chat (agent), retourne réponse textuelle.
- `POST /reset_chat` → réinitialise le contexte de conversation.
(les routes réelles se trouvent dans `backend/main.py` ou modules correspondants)

Comment démarrer (dev)
----------------------
1. Frontend
   - se placer dans `frontend/`
   - installer dépendances :
     ```bash
     npm install
     ```
   - lancer dev server :
     ```bash
     npm run dev
     ```
2. Backend
   - se placer dans `backend/`
   - créer un environnement Python (venv/conda) avec Python 3.10+
   - installer dépendances :
     ```bash
     pip install -r requirements.txt
     ```
   - lancer l'API :
     ```bash
     uvicorn main:app --reload --port 8000
     ```
3. Assurer que le frontend appelle le backend sur le bon endpoint (`/api` ou `http://localhost:8000`).

Notes de développement
----------------------
- Ne pas modifier les tokens du design system dans `src/index.css` sans accord — le visual doit rester cohérent.
- Le composant `CvPage.jsx` contient la logique métier (upload, recherche, chat). Les modifications visuelles sont tolérées si la logique d'appel reste inchangée.
- Header : contient désormais un mini-nav pour sélectionner rapidement le module (CV/Factures) ; la navigation est gérée par `App.jsx` via `useState` (pas de react-router pour l'instant).
- Tests : aucun test automatisé présent — prévoir d'ajouter des tests unitaires pour `core` et des tests d'intégration pour les endpoints API.

Sécurité & confidentialité
-------------------------
- Les CV contiennent des données personnelles — attention au stockage, anonymisation et durée de conservation.
- Défendre l'accès au backend par authentification (à ajouter) si l'application devient accessible publiquement.

Priorités futures / Roadmap
---------------------------
1. Finaliser le module Factures : OCR, extraction de champs, mapping comptable.
2. Améliorer l'agent : réponses plus structurées, explications, scoring des candidats.
3. Ajouter persistance des sessions conversations et historique utilisateur.
4. Tests et CI/CD (lint, test, build deployment).
5. Authentification / RBAC pour accès aux données sensibles.

Contributeurs
-------------
- Team interne Daisy Consulting (développeurs frontend, backend, data engineers).

Contact
-------
Pour questions techniques ou accès : l'équipe technique Daisy Consulting.

---
Fichier généré automatiquement par l'assistant. Mettre à jour ce document si l'architecture ou les endpoints changent.