// =====================================================================
// routes/webhook.js - le seul endroit autorise a marquer une commande 'paid'.
// POST /api/webhook  (appele par Stripe, PAS par le navigateur)
//
// Stripe envoie un evenement signe une fois le paiement reellement termine.
// On VERIFIE la signature (constructEvent) avec STRIPE_WEBHOOK_SECRET :
// c'est ce qui garantit que l'appel vient bien de Stripe et pas d'un pirate.
//
// IMPORTANT : cette route recoit le corps BRUT (Buffer), pas du JSON parse.
// Le montage se fait donc AVANT express.json() dans index.js.
// =====================================================================
import { Router } from 'express'
import { stripe } from '../stripe.js'
import { query } from '../db.js'

const router = Router()
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

router.post('/', async (req, res) => {
  let event
  try {
    const signature = req.headers['stripe-signature']
    // req.body est un Buffer (corps brut) grace a express.raw dans index.js.
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret)
  } catch (err) {
    console.error('Signature webhook invalide :', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // On ne reagit qu'au paiement termine avec succes.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const orderId = Number(session.metadata?.orderId)
    if (orderId) {
      // C'est LA seule requete qui passe une commande a 'paid'.
      await query(
        `UPDATE orders
            SET status = 'paid', paid_at = now()
          WHERE id = $1 AND status <> 'paid'`,
        [orderId],
      )
      console.log(`Commande ${orderId} marquee PAID (via webhook Stripe).`)
    }
  }

  // On repond 200 vite : sinon Stripe re-essaie l'envoi.
  res.json({ received: true })
})

export default router
