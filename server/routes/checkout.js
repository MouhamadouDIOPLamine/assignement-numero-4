// =====================================================================
// routes/checkout.js - demarre un paiement Stripe Checkout.
// POST /api/checkout  (protege : requireAuth)
//
// Regles importantes de l'enonce :
//  - il faut etre CONNECTE (requireAuth) : chaque commande est liee a un user.
//  - le prix est lu dans la BASE (jamais celui envoye par le navigateur).
//  - on cree d'abord la commande (status 'pending'), PUIS la session Stripe.
//  - la commande ne passe 'paid' QUE via le webhook (voir routes/webhook.js).
// =====================================================================
import { Router } from 'express'
import { query } from '../db.js'
import { stripe } from '../stripe.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

router.post('/', requireAuth, async (req, res) => {
  const planId = Number(req.body?.planId)
  if (!planId) {
    return res.status(400).json({ error: 'planId requis' })
  }

  try {
    // 1) Prix REEL depuis la base - on ne fait jamais confiance au navigateur.
    const { rows } = await query(
      'SELECT id, name, price_cents, currency FROM plans WHERE id = $1',
      [planId],
    )
    const plan = rows[0]
    if (!plan) {
      return res.status(404).json({ error: 'Offre introuvable' })
    }

    // 2) On cree la commande en base, au statut 'pending'.
    const orderRes = await query(
      `INSERT INTO orders (user_id, status, amount_total_cents, currency)
       VALUES ($1, 'pending', $2, $3)
       RETURNING id`,
      [req.session.userId, plan.price_cents, plan.currency],
    )
    const orderId = orderRes.rows[0].id

    // Ce qui a ete achete + a quel prix (fige au moment de l'achat).
    await query(
      `INSERT INTO order_items (order_id, plan_id, name, unit_price_cents, quantity)
       VALUES ($1, $2, $3, $4, 1)`,
      [orderId, plan.id, plan.name, plan.price_cents],
    )

    // 3) On ouvre une session Stripe Checkout (page de paiement hebergee).
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: plan.currency,
            unit_amount: plan.price_cents, // prix de la BASE, en centimes
            product_data: { name: `Abonnement PulseFit ${plan.name}` },
          },
        },
      ],
      client_reference_id: String(req.session.userId),
      metadata: { orderId: String(orderId) }, // retrouve par le webhook
      success_url: `${CLIENT_ORIGIN}/?checkout=success&order=${orderId}`,
      cancel_url: `${CLIENT_ORIGIN}/?checkout=cancel&order=${orderId}`,
    })

    // On memorise l'id de la session Stripe sur la commande.
    await query('UPDATE orders SET stripe_session_id = $1 WHERE id = $2', [
      session.id,
      orderId,
    ])

    // Le front n'a plus qu'a rediriger l'utilisateur vers cette URL.
    res.json({ url: session.url, orderId })
  } catch (err) {
    console.error('checkout a echoue :', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
