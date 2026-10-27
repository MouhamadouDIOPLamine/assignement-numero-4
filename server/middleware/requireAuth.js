// =====================================================================
// requireAuth - middleware qui protege une route.
// Si aucun utilisateur n'est en session, on renvoie 401 au lieu des donnees.
// =====================================================================
export function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Non authentifie' })
  }
  next()
}
