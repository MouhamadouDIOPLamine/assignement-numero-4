// =====================================================================
// routes/plans.js - le catalogue des abonnements achetables.
// GET /api/plans -> renvoie les offres (prix inclus) depuis la base.
// Le front affiche ces donnees ; le prix facture vient TOUJOURS de la base.
// =====================================================================
import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name, price_cents, currency, interval, features, featured
         FROM plans
        ORDER BY price_cents`,
    )
    res.json(rows)
  } catch (err) {
    console.error('GET /api/plans a echoue :', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
