// =====================================================================
// routes/classes.js - l'API des cours.
// GET /api/classes -> renvoie tous les cours de la base au format JSON.
// =====================================================================
import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, name, category, day, time, trainer, duration FROM classes ORDER BY id',
    )
    res.json(rows)
  } catch (err) {
    console.error('GET /api/classes a echoue :', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
