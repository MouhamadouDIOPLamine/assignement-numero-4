// =====================================================================
// AuthContext - l'etat "qui est connecte" partage par toute l'application.
// On utilise useState (l'utilisateur courant) + useEffect (verifier au
// chargement si une session existe deja grace a l'appel /api/auth/me).
// =====================================================================
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // null = deconnecte
  const [loading, setLoading] = useState(true) // true tant qu'on verifie

  // Au premier rendu : on demande au serveur si on a deja une session.
  // C'est ce qui fait que l'etat connecte survit au refresh de la page.
  useEffect(() => {
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { user } = await api.login(email, password)
    setUser(user)
  }

  const signup = async (email, password) => {
    const { user } = await api.signup(email, password)
    setUser(user)
  }

  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Petit hook pratique : const { user, login, logout } = useAuth()
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit etre utilise dans <AuthProvider>')
  return ctx
}
