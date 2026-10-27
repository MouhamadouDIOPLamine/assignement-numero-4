// =====================================================================
// api.js - un seul endroit pour parler au backend.
// - En local : VITE_API_URL est vide -> on appelle "/api/..." et le proxy
//   Vite envoie vers http://localhost:4000.
// - En prod : VITE_API_URL = l'URL Railway -> on appelle l'URL complete.
// credentials:'include' envoie/recoit le cookie de session a chaque appel.
// =====================================================================
const BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Erreur ${res.status}`)
  }
  return data
}

export const api = {
  // Cours (donnees produit)
  getClasses: () => request('/api/classes'),

  // Abonnements achetables (semaine 4)
  getPlans: () => request('/api/plans'),

  // Paiement : demarre une session Stripe Checkout, renvoie { url, orderId }.
  createCheckout: (planId) =>
    request('/api/checkout', { method: 'POST', body: JSON.stringify({ planId }) }),

  // Consulter une commande (utilise par la page de succes).
  getOrder: (id) => request(`/api/orders/${id}`),

  // Authentification
  me: () => request('/api/auth/me'),
  signup: (email, password) =>
    request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
}
