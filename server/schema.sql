-- =====================================================================
-- schema.sql - la structure de la base de donnees PulseFit.
-- Semaine 3 : users (comptes) + classes (cours).
-- Semaine 4 : plans (produits achetables) + orders + order_items (paiements).
-- La table des sessions est creee automatiquement par connect-pg-simple.
-- =====================================================================

-- Table des comptes utilisateurs.
-- On ne stocke JAMAIS le mot de passe en clair : seulement son hash bcrypt.
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des cours : ce sont les donnees "produit" affichees dans la grille.
-- (Elles etaient codees en dur en semaine 2, maintenant elles vivent ici.)
CREATE TABLE IF NOT EXISTS classes (
  id        SERIAL PRIMARY KEY,
  name      TEXT NOT NULL,
  category  TEXT NOT NULL,
  day       TEXT NOT NULL,
  time      TEXT NOT NULL,
  trainer   TEXT NOT NULL,
  duration  INTEGER NOT NULL
);

-- =====================================================================
-- SEMAINE 4 - PAIEMENTS
-- =====================================================================

-- plans = le CATALOGUE des abonnements achetables (les "produits").
-- Le prix est stocke ici, EN CENTIMES (Stripe raisonne en centimes),
-- et c'est la SEULE source de verite pour le prix : jamais le navigateur.
CREATE TABLE IF NOT EXISTS plans (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  price_cents INTEGER NOT NULL,        -- ex: 2900 = 29,00 EUR
  currency    TEXT NOT NULL DEFAULT 'eur',
  interval    TEXT NOT NULL DEFAULT 'month',
  features    JSONB NOT NULL DEFAULT '[]',
  featured    BOOLEAN NOT NULL DEFAULT false
);

-- orders = UNE ligne par achat (une "commande").
-- status : 'pending' a la creation -> 'paid' UNIQUEMENT via le webhook Stripe.
CREATE TABLE IF NOT EXISTS orders (
  id                 SERIAL PRIMARY KEY,
  user_id            INTEGER NOT NULL REFERENCES users(id),
  status             TEXT NOT NULL DEFAULT 'pending',   -- pending | paid
  amount_total_cents INTEGER NOT NULL,
  currency           TEXT NOT NULL DEFAULT 'eur',
  stripe_session_id  TEXT UNIQUE,                        -- id de la session Stripe Checkout
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at            TIMESTAMPTZ
);

-- order_items = CE QUI a ete achete, et A QUEL PRIX (fige au moment de l'achat).
-- (C'est la table "orderItems" demandee ; en SQL on ecrit order_items.)
CREATE TABLE IF NOT EXISTS order_items (
  id               SERIAL PRIMARY KEY,
  order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  plan_id          INTEGER NOT NULL REFERENCES plans(id),
  name             TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  quantity         INTEGER NOT NULL DEFAULT 1
);
