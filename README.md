# PulseFit - Assignment 4 (paiements reels avec Stripe Checkout)

Site d'un studio de fitness **PulseFit**. Ce depot est la suite de l'Assignment 3
(backend + base + auth + mise en ligne) auquel on ajoute des **paiements reels**
via **Stripe Checkout en mode test** :

- un **backend reel** (Node.js + Express)
- une **base de donnees Postgres** (Neon)
- une **vraie authentification** (inscription / connexion / sessions)
- une **API JSON** qui lit les donnees depuis la base
- des **paiements Stripe Checkout** : commande en base, webhook signe, page de succes
- un **deploiement public** (backend sur Render, frontend sur Vercel)

> Pas de TypeScript. Donnees non plus codees en dur : elles viennent de la base.
> Nouveautes de la semaine 4 detaillees tout en bas (section "Semaine 4").

---

## 1. Structure des dossiers

```
assignement-numero-3/
|- client/                 # le front React + Vite + Tailwind
|  |- src/
|  |  |- components/       # Header, Hero, MainContent, ClassCard, Stepper, Footer, AuthModal
|  |  |- context/
|  |  |  |- AuthContext.jsx   # etat global "qui est connecte" (useState + useEffect)
|  |  |- lib/
|  |  |  |- api.js            # un seul endroit pour appeler le backend (fetch)
|  |  |- data/             # trainers / plans (contenu vitrine, reste en statique)
|  |  |- App.jsx           # compose les composants + ouvre la modale d'auth
|  |  |- main.jsx
|  |- vite.config.js       # proxy /api -> http://localhost:4000 en local
|  |- .env.example         # VITE_API_URL (vide en local)
|
|- server/                 # le backend Express
|  |- index.js             # point d'entree : CORS + sessions + routes
|  |- db.js                # pool de connexions Postgres (lit DATABASE_URL)
|  |- schema.sql           # structure des tables (users, classes)
|  |- seed.js              # cree les tables + insere les cours de depart
|  |- routes/
|  |  |- auth.js           # /signup /login /logout /me
|  |  |- classes.js        # GET /api/classes (JSON)
|  |- middleware/
|  |  |- requireAuth.js     # protege une route si besoin (401 si non connecte)
|  |- .env.example         # DATABASE_URL, SESSION_SECRET, CLIENT_ORIGIN...
|
|- .gitignore              # ignore node_modules, dist ET les .env (secrets)
|- README.md
```

Le front et le back sont **deux applications separees** (deux `package.json`,
deux `npm install`). En local, Vite redirige tout appel `/api` vers le serveur
Express grace a un proxy, donc on travaille comme si tout etait sur la meme
adresse.

---

## 2. Le schema de la base, explique simplement

Il y a **trois tables** :

1. **`users`** - les comptes.
   - `id` : identifiant unique (numero auto-incremente).
   - `email` : l'email, unique (deux comptes ne peuvent pas avoir le meme).
   - `password_hash` : le mot de passe **jamais en clair**. On stocke seulement
     son empreinte bcrypt (impossible de retrouver le mot de passe a partir de
     ca).
   - `created_at` : date de creation.

2. **`classes`** - les cours affiches dans la grille (les "items" produit).
   - `id`, `name`, `category`, `day`, `time`, `trainer`, `duration`.
   - Ce sont exactement les memes donnees qu'en Assignment 2, mais elles vivent
     maintenant dans la base au lieu d'etre codees en dur dans le JavaScript.

3. **`session`** - les sessions de connexion.
   - Creee automatiquement par la librairie `connect-pg-simple`.
   - Elle garde, cote serveur, quel navigateur est connecte a quel compte.
   - Comme elle est **dans la base** (et pas seulement en memoire), la connexion
     survit a un refresh de page **et** a un redemarrage du serveur.

En une phrase : *un utilisateur a un email et un mot de passe hache ; les cours
sont des lignes dans une table ; une table de sessions relie un navigateur a un
utilisateur connecte.*

Le fichier `server/schema.sql` contient ces tables. `server/seed.js` les cree
puis remplit la table `classes`.

---

## 3. Comment marche l'authentification (le fil complet)

1. **Inscription** (`POST /api/auth/signup`) : on verifie que l'email est libre,
   on hache le mot de passe avec bcrypt, on cree la ligne dans `users`, puis on
   ouvre une session (`req.session.userId = user.id`).
2. **Connexion** (`POST /api/auth/login`) : on retrouve l'utilisateur par email,
   on compare le mot de passe fourni au hash avec `bcrypt.compare`. Si c'est bon,
   on ouvre la session.
3. **La session** : Express depose un cookie signe (`connect.sid`) dans le
   navigateur. Ce cookie ne contient qu'un identifiant ; les vraies donnees de
   session sont dans la table `session` en base. A chaque requete, le navigateur
   renvoie le cookie et le serveur sait qui est connecte.
4. **Survivre au refresh** : au chargement, le front appelle
   `GET /api/auth/me`. Le cookie est encore la -> le serveur repond avec
   l'utilisateur -> l'interface s'affiche en mode "connecte" meme apres un F5.
5. **Deconnexion** (`POST /api/auth/logout`) : on detruit la session et on
   efface le cookie.
6. **Cote React** : `AuthContext.jsx` garde l'utilisateur dans un `useState` et
   appelle `/me` dans un `useEffect` au demarrage. Le `Header` affiche
   **"Sign in"** si deconnecte, ou **l'email + "Sign out"** si connecte.

Point important sur les cookies : tous les appels `fetch` utilisent
`credentials: 'include'` (voir `client/src/lib/api.js`) pour envoyer/recevoir le
cookie. En production le front (Vercel) et le back (Railway) sont sur des
domaines differents, donc le cookie est configure en `sameSite: 'none'` +
`secure: true` (voir `server/index.js`).

---

## 4. Les routes de l'API

| Methode | Route                | Role                                       |
|---------|----------------------|--------------------------------------------|
| GET     | `/api/health`        | verifier que le serveur tourne             |
| GET     | `/api/classes`       | renvoie tous les cours en JSON (depuis la base) |
| POST    | `/api/auth/signup`   | creer un compte + ouvrir la session        |
| POST    | `/api/auth/login`    | se connecter                               |
| POST    | `/api/auth/logout`   | se deconnecter                             |
| GET     | `/api/auth/me`       | savoir qui est connecte (ou `null`)        |

---

## 5. Lancer le projet en local (Windows / PowerShell)

> Prerequis : Node.js >= 18 (`node -v`). Si PowerShell bloque `npm` avec
> *"npm.ps1 cannot be loaded ... not digitally signed"*, lancez une fois :
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`
> (ou utilisez `npm.cmd` a la place de `npm`).

### a) Creer la base Neon (voir section 6) et configurer le serveur

```powershell
cd server
copy .env.example .env
# ouvrez .env et collez votre DATABASE_URL Neon + un SESSION_SECRET au hasard
npm install
npm run seed      # cree les tables et insere les 8 cours
npm run dev       # demarre l'API sur http://localhost:4000
```

Verifiez : ouvrez http://localhost:4000/api/classes -> vous devez voir du JSON.

### b) Lancer le front (dans un SECOND terminal)

```powershell
cd client
npm install
npm run dev       # http://localhost:5173
```

Le proxy Vite envoie `/api/...` vers le serveur. Testez : inscrivez-vous,
rafraichissez la page (F5) -> vous restez connecte.

---

## 6. Creer la base Postgres gratuite (Neon)

1. Creez un compte sur https://neon.tech et un nouveau projet.
2. Copiez la **connection string** (bouton "Connect"), elle ressemble a :
   `postgresql://user:pass@ep-xxxx.aws.neon.tech/neondb?sslmode=require`
3. Collez-la dans `server/.env` sous `DATABASE_URL=`.
4. Generez un secret de session, par ex. :
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   et collez-le sous `SESSION_SECRET=`.
5. Lancez `npm run seed` depuis `server/` : les tables sont creees et remplies.

---

## 7. Mise en ligne (Railway + Vercel)

### Backend sur Railway

1. Poussez le projet sur GitHub (voir section 8).
2. Sur https://railway.app : *New Project -> Deploy from GitHub repo*.
3. **Root Directory** = `server`. Start command = `npm start`.
4. Dans *Variables*, ajoutez :
   - `DATABASE_URL` (la meme que Neon)
   - `SESSION_SECRET`
   - `NODE_ENV` = `production`
   - `CLIENT_ORIGIN` = l'URL Vercel du front (ex: `https://pulsefit.vercel.app`)
5. Railway fournit `PORT` tout seul. Notez l'URL publique du backend.
6. Lancez le seed une fois sur la base de prod (soit via `railway run npm run seed`,
   soit en relancant `npm run seed` en local, puisque c'est la meme base Neon).

### Frontend sur Vercel

1. Sur https://vercel.com : *Add New -> Project* -> importez le repo.
2. **Root Directory** = `client`. Framework detecte = Vite.
3. Variable d'environnement : `VITE_API_URL` = l'URL Railway du backend.
4. Deployez. Vous obtenez l'URL publique du site complet.

> Important : apres avoir l'URL Vercel, remettez-la dans `CLIENT_ORIGIN` cote
> Railway (sinon les cookies de session seront bloques par CORS).

---

## 8. Git : petits commits reels

Exemple de suite de commits utilisee pour ce travail :

```bash
git add server/package.json server/db.js server/schema.sql
git commit -m "server: scaffold express + connexion postgres"

git add server/seed.js
git commit -m "server: seed script pour la table classes"

git add server/routes/classes.js server/index.js
git commit -m "api: route GET /api/classes (JSON depuis la base)"

git add server/routes/auth.js server/middleware/requireAuth.js
git commit -m "auth: signup/login/logout/me avec sessions postgres"

git add client/src/lib/api.js client/src/context/AuthContext.jsx
git commit -m "client: couche api + contexte d'authentification"

git add client/src/components/AuthModal.jsx client/src/components/Header.jsx client/src/App.jsx
git commit -m "ui: modale connexion + etat Sign in/Sign out"

git add client/src/components/MainContent.jsx client/vite.config.js
git commit -m "client: grille alimentee par l'API au lieu des donnees en dur"
```

---

## 9. Secrets : `.env` exclu de git

- Les vrais secrets (`DATABASE_URL`, `SESSION_SECRET`) vivent dans
  `server/.env`, qui est **dans `.gitignore`** -> jamais commite.
- Seuls les `*.env.example` (sans vraie valeur) sont versionnes.
- Pour verifier qu'aucun `.env` n'est suivi par git :
  ```bash
  git status --ignored
  git ls-files | findstr .env    # ne doit renvoyer que les .env.example
  ```

---

## A savoir expliquer a l'evaluation

- **useState** : etat local d'un composant (ex: le filtre de categorie, la
  quantite du Stepper, le formulaire de connexion).
- **Composant controle** : le `Stepper` ne garde aucun etat ; il recoit `value`
  et previent le parent via `onChange`. Le parent est la seule source de verite.
- **useEffect** : effet au chargement (recuperer les cours via l'API, verifier
  la session avec `/me`).
- **Schema de la base** : `users` (email + hash), `classes` (les cours),
  `session` (connexions). Expliquable en une phrase (voir section 2).
- **Auth / sessions** : mot de passe hache avec bcrypt, session stockee en
  Postgres, cookie signe renvoye a chaque requete -> survit au refresh.

---

# Semaine 4 — Paiements reels avec Stripe Checkout (mode TEST)

L'argent est faux, mais tout le reste est reel : une vraie session Stripe
Checkout, un vrai webhook qui confirme le paiement, une vraie commande en base.

## 1. Nouvelles tables (schema.sql)

- `plans` — le **catalogue** des abonnements achetables. Le **prix y est stocke
  en centimes** et c'est la **seule source de verite** : on ne fait jamais
  confiance a un prix envoye par le navigateur.
- `orders` — **une ligne par achat**. `status` vaut `pending` a la creation et
  ne passe `paid` **que** via le webhook Stripe.
- `order_items` — **ce qui a ete achete, et a quel prix** (prix fige au moment
  de l'achat). C'est la table "orderItems" demandee ; en SQL on l'ecrit
  `order_items`.

Pour pousser le schema + remplir les offres :
```powershell
cd server
npm install        # installe aussi la librairie "stripe"
npm run seed       # cree les nouvelles tables et insere les 3 abonnements
```

## 2. Cle Stripe (mode TEST) dans server/.env

1. Creez un compte gratuit sur https://stripe.com et verifiez que le Dashboard
   est bien en **Test mode** (interrupteur en haut a droite).
2. Dans *Developers > API keys*, copiez la **Secret key** (`sk_test_...`).
3. Dans `server/.env` :
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...   (voir etape 3)
   ```

## 3. Tester en local avec la Stripe CLI

Le webhook est le **seul** a pouvoir marquer une commande `paid`. En local, la
Stripe CLI relaie les evenements vers votre serveur :

```powershell
# 1) terminal A : le serveur
cd server ; npm run dev

# 2) terminal B : la Stripe CLI (installez-la une fois, puis "stripe login")
stripe listen --forward-to localhost:4000/api/webhook
```
La commande `stripe listen` affiche un secret `whsec_...` : collez-le dans
`STRIPE_WEBHOOK_SECRET` (server/.env) puis relancez le serveur.

Payez avec la **carte de test** : `4242 4242 4242 4242`, date future, CVC au
hasard. La commande passe alors `pending` -> `paid`.

## 4. Le parcours complet (a savoir expliquer)

1. **Bouton "Buy"** (`MainContent.jsx`) : si l'utilisateur n'est pas connecte,
   on ouvre la modale de connexion. Sinon on appelle `POST /api/checkout`.
2. **`POST /api/checkout`** (`routes/checkout.js`, protege par `requireAuth`) :
   - lit le **prix reel dans la base** (`plans`),
   - cree la commande (`orders` + `order_items`) au statut `pending`,
   - cree la **session Stripe Checkout** et renvoie son `url`.
3. Le front **redirige** vers la page de paiement hebergee par Stripe.
4. **`POST /api/webhook`** (`routes/webhook.js`) : Stripe rappelle le serveur
   une fois le paiement termine. On **verifie la signature** (preuve que l'appel
   vient de Stripe), puis sur `checkout.session.completed` on passe la commande
   a `paid`. **C'est le seul endroit qui marque une commande payee.**
5. Stripe renvoie l'utilisateur vers `/?checkout=success&order=ID`. La page de
   succes (`CheckoutResult.jsx`) interroge **`GET /api/orders/:id`** plusieurs
   fois (le webhook peut arriver juste apres la redirection) et affiche le
   statut `Payee`.

Point de securite cle : **le prix vient de la base, jamais du navigateur**, et
**seul le webhook signe** peut marquer une commande payee.

## 5. Mettre le webhook correct cote serveur

Le webhook recoit le **corps brut** (Buffer) pour verifier la signature. Dans
`index.js`, il est donc monte **avant** `express.json()` avec
`express.raw({ type: 'application/json' })` — sinon la signature serait invalide.

## 6. En production (Vercel + Render)

1. Sur **Render**, ajoutez `STRIPE_SECRET_KEY` (toujours `sk_test_...` pour la
   demo).
2. Dans le Dashboard Stripe (Test mode) : *Developers > Webhooks > Add endpoint*
   -> URL = `https://VOTRE-BACKEND.onrender.com/api/webhook`, evenement
   `checkout.session.completed`. Stripe donne un `whsec_...` : collez-le dans
   `STRIPE_WEBHOOK_SECRET` sur Render.
3. `CLIENT_ORIGIN` doit deja pointer sur l'URL Vercel (les `success_url` /
   `cancel_url` en dependent).

## 7. A montrer a l'evaluation

- Une transaction complete (fausse monnaie) : clic **Buy** -> carte
  `4242 4242 4242 4242` -> retour sur la page de succes avec le statut **Payee**.
- La table `orders` (une ligne par achat, `status` = `paid`), et `order_items`.
- Expliquer : prix lu en base, commande `pending` creee avant Stripe, webhook
  signe seul autorise a marquer `paid`, page de succes qui attend le webhook.
