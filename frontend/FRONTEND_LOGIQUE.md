# Logique frontend

Ce document explique le fonctionnement du frontend React (Vite), son routing, sa gestion de session, et ses integrations API avec le backend.

## 1) Vue d'ensemble

Le frontend est une SPA React avec:
- React Router pour la navigation
- Context API pour l'authentification
- i18n (fr/en)
- deux espaces metier proteges: CV et Factures

Point d'entree:
- `src/main.jsx`
- charge i18n
- monte `BrowserRouter`
- enveloppe l'app avec `AuthProvider`

## 2) Configuration environnement

Fichier env:
- `frontend/.env`: `VITE_API_URL=http://localhost:8020`

Consommation:
- `src/lib/api.jsx` utilise `import.meta.env.VITE_API_URL` (avec fallback localhost:8020)
- `src/api/http.js` et `src/auth/components/AuthContext.jsx` utilisent encore une base hardcodee localhost:8020

## 3) Routing applicatif

Dans `src/App.jsx`:
- `/` -> `HomeRoute`
- `/connexion` -> `AuthPage`
- `/verify-email` -> `VerifyEmailPage`
- `/forgot-password` -> `ForgotPasswordPage`
- `/reset-password` -> `ResetPasswordPage`
- `/workspace/invoice` -> `InvoiceWorkspace` (protege)
- `/workspace/resume` -> `ResumeWorkspace` (protege)

`HomeRoute`:
- si utilisateur connecte: affiche `DashboardPage`
- sinon: affiche `Landing`

`ProtectedRoute`:
- attend la fin du chargement auth
- redirige vers `/connexion` si non connecte

## 4) Authentification cote frontend

`src/auth/components/AuthContext.jsx` gere:
- `user`
- `loading`
- `login(email, password)`
- `logout()`

Flux auth principal:
1. au chargement, lecture de `access_token` depuis localStorage
2. si token present, appel `GET /api/auth/me`
3. login -> `POST /api/auth/login`
4. stockage local du token
5. logout -> suppression des tokens et user local

## 5) Service auth et token refresh

`src/services/authService.jsx` expose:
- `signup`
- `login`
- `logout`
- `forgotPassword`
- `resetPassword`

`src/lib/api.jsx` et `src/api/http.js` implementent:
- gestion centralisee des appels fetch
- ajout du bearer token
- tentative de refresh automatique sur `401` via `POST /api/auth/refresh`
- redirection vers `/connexion` si refresh echoue

## 6) Couche API par domaine

### 6.1 Conversations (`src/api/conversationsApi.js`)
- creer conversation
- lister conversations
- ouvrir conversation
- supprimer conversation
- envoyer message

Endpoints backend utilises:
- `/conversations`
- `/conversations/{id}`
- `/conversations/{id}/message`

### 6.2 CV (`src/api/cvApi.js`)
- upload CV
- lister candidats
- rechercher CV
- lister documents
- supprimer document

Endpoints backend utilises:
- `/cv/upload`
- `/cv/candidats`
- `/cv/rechercher`
- `/cv/documents`
- `/cv/documents/{nom_fichier}`

### 6.3 Factures (`src/api/factureApi.js`)
- upload factures
- lister factures
- supprimer facture
- supprimer factures par fichier

Endpoints backend utilises:
- `/factures/upload`
- `/factures/`
- `/factures/{id}`
- `/factures/par-fichier/{nom_fichier}`

### 6.4 Graphiques (`src/api/graphiquesApi.js`)
- epingler graphique
- lister graphiques epingles
- supprimer graphique epingle

Endpoints backend utilises:
- `/graphiques`
- `/graphiques/{id}`

## 7) Pages et UX

### 7.1 Landing et dashboard
- `Landing` assemble les sections marketing
- `DashboardPage` propose les deux agents (Resume et Invoice)

### 7.2 Parcours auth
- `AuthPage`: ecran login/signup
- `VerifyEmailPage`: saisie code 6 chiffres
- `ForgotPasswordPage`: demande de code reset
- `ResetPasswordPage`: code + nouveau mot de passe

### 7.3 Workspace Factures (`InvoiceWorkspace`)
Fonctions principales:
- drag and drop d'upload
- regroupement des factures par fichier
- statistiques derivees (totaux, clients uniques, etc.)
- chat conversationnel via `/conversations`
- rendu markdown des reponses
- affichage et epinglage de graphiques
- export CSV local
- suppression de fichiers importes

Persistance locale UI:
- conversation active stockee en localStorage (`conversation_active_facture`)

### 7.4 Workspace CV (`ResumeWorkspace`)
Fonctions principales:
- upload CV
- bibliotheque de documents
- liste candidats
- recherche/tri/selection
- chat conversationnel via `/conversations`
- comparaison de profils (question assistee)
- suppression de documents
- export CSV local
- courbe de tendance d'import via Recharts

Persistance locale UI:
- conversation active stockee en localStorage (`conversation_active_cv`)

## 8) Internationalisation

`src/i18n/config.js`:
- langues `fr` et `en`
- langue initiale lue depuis `localStorage` (`docmind-lang`), sinon `fr`
- composants utilisent `useTranslation`

## 9) Style et design system

Le frontend utilise:
- classes utilitaires type Tailwind
- theming clair/sombre (toggle)
- icones Lucide
- composants UI reutilisables (confirm dialog, toast, navigation, etc.)

## 10) Points techniques a surveiller

- Base URL API non totalement unifiee: coexistence de `VITE_API_URL` et de constantes hardcodees `http://localhost:8020`.
- Deux clients HTTP existent (`src/lib/api.jsx` et `src/api/http.js`), avec logique similaire de refresh token.
- `src/App.jsx` contient deux routes `/verify-email` (doublon sans impact majeur, mais a nettoyer).

## 11) Resume fonctionnel

Le frontend orchestre:
- une authentification complete (verification email, reset password, refresh token)
- deux experiences metier (CV et Factures)
- un chat contextualise persistant par service
- des visualisations et exports a partir des donnees backend

L'ensemble est deja branche avec le backend actuel via les endpoints de `auth`, `cv`, `factures`, `conversations` et `graphiques`.
