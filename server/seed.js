// =====================================================================
// seed.js - cree les tables (via schema.sql) puis insere les donnees de depart.
// A lancer une seule fois apres avoir configure la base : npm run seed
// =====================================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool, query } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Les memes cours que la version codee en dur de la semaine 2.
const classes = [
  { name: 'Sunrise HIIT',  category: 'HIIT',     day: 'Mon', time: '07:00', trainer: 'Maya Okoro',  duration: 45 },
  { name: 'Power Yoga',    category: 'Yoga',     day: 'Tue', time: '09:30', trainer: 'Leo Martins', duration: 60 },
  { name: 'Express Core',  category: 'HIIT',     day: 'Wed', time: '12:15', trainer: 'Maya Okoro',  duration: 30 },
  { name: 'Strength 101',  category: 'Strength', day: 'Thu', time: '17:30', trainer: 'Sara Lind',   duration: 50 },
  { name: 'Spin & Burn',   category: 'Cardio',   day: 'Fri', time: '18:45', trainer: 'Maya Okoro',  duration: 45 },
  { name: 'Mobility Flow', category: 'Yoga',     day: 'Sat', time: '10:00', trainer: 'Leo Martins', duration: 40 },
  { name: 'Deadlift Lab',  category: 'Strength', day: 'Sat', time: '11:30', trainer: 'Sara Lind',   duration: 55 },
  { name: 'Tabata Rush',   category: 'Cardio',   day: 'Sun', time: '09:00', trainer: 'Maya Okoro',  duration: 30 },
]

// Les abonnements achetables (semaine 4). Le prix est EN CENTIMES.
// C'est la source de verite du prix (le navigateur ne decide jamais du prix).
const plans = [
  { id: 1, name: 'Starter', price_cents: 2900, featured: false,
    features: ['4 classes per month', 'Access to open gym', 'Mobile app check-in'] },
  { id: 2, name: 'Pro',     price_cents: 5900, featured: true,
    features: ['Unlimited classes', '1 personal session / month', 'Guest passes included'] },
  { id: 3, name: 'Elite',   price_cents: 9900, featured: false,
    features: ['Everything in Pro', 'Weekly personal training', 'Nutrition coaching'] },
]

async function seed() {
  console.log('> Creation des tables (schema.sql)...')
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8')
  await query(schema)

  console.log('> Vidage et remplissage de la table classes...')
  await query('TRUNCATE classes RESTART IDENTITY')
  for (const c of classes) {
    await query(
      'INSERT INTO classes (name, category, day, time, trainer, duration) VALUES ($1, $2, $3, $4, $5, $6)',
      [c.name, c.category, c.day, c.time, c.trainer, c.duration],
    )
  }

  const { rows } = await query('SELECT COUNT(*)::int AS n FROM classes')
  console.log(`> Termine : ${rows[0].n} cours inseres.`)

  console.log('> Remplissage de la table plans (abonnements achetables)...')
  // ON CONFLICT : on garde des ids stables et on rafraichit juste le prix/les
  // features, sans toucher aux commandes (orders) deja enregistrees.
  for (const p of plans) {
    await query(
      `INSERT INTO plans (id, name, price_cents, currency, interval, features, featured)
       VALUES ($1, $2, $3, 'eur', 'month', $4, $5)
       ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             price_cents = EXCLUDED.price_cents,
             features = EXCLUDED.features,
             featured = EXCLUDED.featured`,
      [p.id, p.name, p.price_cents, JSON.stringify(p.features), p.featured],
    )
  }
  // On recale la sequence d'ids apres les insertions avec id explicite.
  await query(
    `SELECT setval(pg_get_serial_sequence('plans','id'), (SELECT MAX(id) FROM plans))`,
  )
  const planCount = await query('SELECT COUNT(*)::int AS n FROM plans')
  console.log(`> Termine : ${planCount.rows[0].n} abonnements inseres.`)

  await pool.end()
}

seed().catch((err) => {
  console.error('Echec du seed :', err)
  process.exit(1)
})
