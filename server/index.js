// =====================================================================
// index.js - le point d'entree du serveur Express.
// Il branche : CORS (avec cookies), les sessions Postgres, et les routes API.
// =====================================================================
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import { pool } from './db.js'
import authRoutes from './routes/auth.js'
import classesRoutes from './routes/classes.js'
import plansRoutes from './routes/plans.js'
import checkoutRoutes from './routes/checkout.js'
import webhookRoutes from './routes/webhook.js'
import ordersRoutes from './routes/orders.js'

const app = express()
const isProd = process.env.NODE_ENV === 'production'
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

// Derriere le proxy de Railway, il faut faire confiance au proxy
// pour que les cookies "secure" fonctionnent.
app.set('trust proxy', 1)

// On autorise SEULEMENT le front connu, et on accepte les cookies (credentials).
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }))

// IMPORTANT : le webhook Stripe doit recevoir le corps BRUT (Buffer) pour que
// la verification de signature fonctionne. On le monte donc AVANT express.json(),
// sinon le JSON serait deja parse et la signature invalide.
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRoutes)

// Toutes les autres routes recoivent du JSON classique.
app.use(express.json())

// Sessions stockees dans Postgres (table "session") -> elles survivent
// au refresh de la page ET au redemarrage du serveur.
const PgStore = connectPgSimple(session)
app.use(
  session({
    store: new PgStore({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || 'dev-secret-a-changer',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
      sameSite: 'lax',   // ← 'lax' partout, car le proxy Vercel rend tout same-site
      secure: isProd,    // ← reste true en prod (HTTPS obligatoire)
    },
  }),
)

// Petite route de sante pour verifier que le serveur tourne.
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// Les routes metier.
app.use('/api/auth', authRoutes)
app.use('/api/classes', classesRoutes)
app.use('/api/plans', plansRoutes)       // catalogue des abonnements
app.use('/api/checkout', checkoutRoutes) // demarre un paiement Stripe
app.use('/api/orders', ordersRoutes)     // consulter une commande (page succes)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Serveur PulseFit demarre sur le port ${PORT}`)
})
