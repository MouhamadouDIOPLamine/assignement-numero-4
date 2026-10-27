// =====================================================================
// routes/orders.js - consulter une commande (pour la page de succes).
// GET /api/orders/:id  (protege : requireAuth)
//
// La page de succes interroge cette route quelques fois d'affilee : le
// webhook peut arriver un court instant APRES la redirection, donc le
// statut peut encore etre 'pending' juste apres le paiement.
// On verifie aussi que la commande appartient bien a l'utilisateur connecte.
// =====================================================================
import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.get('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id)
  if (!id) {
    return res.status(400).json({ error: 'id invalide' })
  }
  try {
    const { rows } = await query(
      `SELECT id, status, amount_total_cents, currency, created_at, paid_at
         FROM orders
        WHERE id = $1 AND user_id = $2`,
      [id, req.session.userId],
    )
    const order = rows[0]
    if (!order) {
      return res.status(404).json({ error: 'Commande introuvable' })
    }
    const items = await query(
      `SELECT name, unit_price_cents, quantity
         FROM order_items
        WHERE order_id = $1`,
      [id],
    )
    res.json({ order, items: items.rows })
  } catch (err) {
    console.error('GET /api/orders/:id a echoue :', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
