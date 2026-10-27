import { useState } from 'react'
import { AuthProvider } from './context/AuthContext.jsx'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import MainContent from './components/MainContent.jsx'
import Footer from './components/Footer.jsx'
import AuthModal from './components/AuthModal.jsx'
import CheckoutResult from './components/CheckoutResult.jsx'

// Au retour de Stripe, l'URL ressemble a /?checkout=success&order=12.
// On lit ces parametres une seule fois au demarrage.
function readCheckoutFromUrl() {
  const p = new URLSearchParams(window.location.search)
  const checkout = p.get('checkout')
  if (!checkout) return null
  return { status: checkout, orderId: Number(p.get('order')) }
}

// App compose les composants et gere l'ouverture de la modale d'auth.
// Tout est enveloppe dans <AuthProvider> pour partager l'etat de connexion.
export default function App() {
  const [authOpen, setAuthOpen] = useState(false)
  const [checkout, setCheckout] = useState(readCheckoutFromUrl)

  // Ferme la page de succes et nettoie l'URL (enleve ?checkout=...).
  const closeCheckout = () => {
    window.history.replaceState({}, '', window.location.pathname)
    setCheckout(null)
  }

  return (
    <AuthProvider>
      <div className="min-h-screen overflow-x-hidden bg-white font-sans text-ink">
        <Header onOpenAuth={() => setAuthOpen(true)} />
        <main id="top">
          <Hero />
          <MainContent onOpenAuth={() => setAuthOpen(true)} />
        </main>
        <Footer />
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
        {checkout && (
          <CheckoutResult
            orderId={checkout.orderId}
            cancelled={checkout.status === 'cancel'}
            onClose={closeCheckout}
          />
        )}
      </div>
    </AuthProvider>
  )
}
