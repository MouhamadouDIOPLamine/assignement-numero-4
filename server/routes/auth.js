// =====================================================================
// routes/auth.js - inscription, connexion, deconnexion, "qui suis-je".
// Les mots de passe sont haches avec bcrypt. L'etat connecte est garde
// cote serveur dans la session (cookie signe), donc il survit au refresh.
// =====================================================================
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db.js'

const router = Router()

// Petite validation partagee par signup et login.
function readCredentials(req) {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  return { email, password }
}

// --- INSCRIPTION : POST /api/auth/signup ---
router.post('/signup', async (req, res) => {
  const { email, password } = readCredentials(req)
  if (!email || password.length < 6) {
    return res.status(400).json({ error: 'Email valide et mot de passe (6+ caracteres) requis' })
  }
  try {
    const exists = await query('SELECT 1 FROM users WHERE email = $1', [email])
    if (exists.rowCount > 0) {
      return res.status(409).json({ error: 'Cet email est deja utilise' })
    }
    const passwordHash = await bcrypt.hash(password, 10)
    const { rows } = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, passwordHash],
    )
    const user = rows[0]
    req.session.userId = user.id // ouvre la session
    res.status(201).json({ user: { id: user.id, email: user.email } })
  } catch (err) {
    console.error('signup a echoue :', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// --- CONNEXION : POST /api/auth/login ---
router.post('/login', async (req, res) => {
  const { email, password } = readCredentials(req)
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' })
  }
  try {
    const { rows } = await query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email],
    )
    const user = rows[0]
    // Message identique si l'email n'existe pas ou si le mot de passe est faux.
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Identifiants invalides' })
    }
    req.session.userId = user.id
    res.json({ user: { id: user.id, email: user.email } })
  } catch (err) {
    console.error('login a echoue :', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// --- DECONNEXION : POST /api/auth/logout ---
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid')
    res.json({ ok: true })
  })
})

// --- QUI SUIS-JE : GET /api/auth/me ---
// Appele au chargement du front pour savoir si on est deja connecte.
router.get('/me', async (req, res) => {
  if (!req.session?.userId) {
    return res.json({ user: null })
  }
  try {
    const { rows } = await query('SELECT id, email FROM users WHERE id = $1', [req.session.userId])
    res.json({ user: rows[0] || null })
  } catch (err) {
    console.error('me a echoue :', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
