// =====================================================================
// db.js - un seul pool de connexions Postgres, partage par tout le serveur.
// On lit l'URL depuis la variable d'environnement DATABASE_URL (jamais en dur).
// =====================================================================
import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL manquante : copiez server/.env.example vers server/.env')
}

// Neon exige le SSL. On l'active pour toute connexion distante.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

// Petit raccourci pour lancer une requete : query('SELECT ...', [params])
export const query = (text, params) => pool.query(text, params)
