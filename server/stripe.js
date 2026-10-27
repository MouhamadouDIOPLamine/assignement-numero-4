// =====================================================================
// stripe.js - un seul client Stripe, partage par tout le serveur.
// La cle secrete vient de l'environnement (STRIPE_SECRET_KEY), jamais en dur.
// En mode TEST, elle commence par "sk_test_...".
// =====================================================================
import Stripe from 'stripe'
import 'dotenv/config'

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('ATTENTION : STRIPE_SECRET_KEY manquante dans server/.env')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_absente')
