import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { trainers } from '../data/trainers.js'
import ClassCard from './ClassCard.jsx'

function euro(cents, currency = 'eur') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format((cents || 0) / 100)
}

export default function MainContent({ onOpenAuth }) {
  const { user } = useAuth()
  // ----- DONNEES depuis l'API (au lieu des donnees en dur) -----
  const [classes, setClasses] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'

  useEffect(() => {
    api
      .getClasses()
      .then((data) => {
        setClasses(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  // ----- ABONNEMENTS depuis l'API (semaine 4) -----
  const [plans, setPlans] = useState([])
  const [buyingId, setBuyingId] = useState(null) // id de l'offre en cours d'achat

  useEffect(() => {
    api.getPlans().then(setPlans).catch(() => setPlans([]))
  }, [])

  // Clic sur "Buy now" : il faut etre connecte, puis on demande au serveur
  // de creer la session Stripe et on redirige vers la page de paiement.
  async function handleBuy(plan) {
    if (!user) {
      onOpenAuth() // pas connecte -> on ouvre la modale de connexion
      return
    }
    try {
      setBuyingId(plan.id)
      const { url } = await api.createCheckout(plan.id)
      window.location.href = url // redirection vers Stripe Checkout
    } catch (err) {
      alert(err.message || 'Impossible de demarrer le paiement')
      setBuyingId(null)
    }
  }

  // ----- FILTER state (useState) -----
  const [activeCategory, setActiveCategory] = useState('All')

  // ----- STEPPER state (useState) -----
  // Un nombre par id de cours. Le parent le possede : chaque Stepper reste controle.
  const [spots, setSpots] = useState({})
  const setSpotsFor = (id, value) =>
    setSpots((prev) => ({ ...prev, [id]: value }))

  // Categories calculees a partir des donnees recues.
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(classes.map((c) => c.category)))],
    [classes],
  )

  // Liste derivee - recalculee a chaque rendu depuis l'etat + les donnees.
  const visibleClasses =
    activeCategory === 'All'
      ? classes
      : classes.filter((c) => c.category === activeCategory)

  const totalSpots = Object.values(spots).reduce((sum, n) => sum + n, 0)

  return (
    <>
      {/* ======================= SCHEDULE (main grid + filter) ======================= */}
      <section id="schedule" className="section-wrap py-12 md:py-16">
        <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">
          Weekly Class Schedule
        </h2>
        <p className="mx-auto mt-2 max-w-prose text-center text-slate-500">
          Filter by category, then reserve your spots.
        </p>

        {status === 'loading' && (
          <p className="mt-8 text-center text-slate-500">Chargement des cours...</p>
        )}
        {status === 'error' && (
          <p className="mt-8 text-center font-semibold text-red-600">
            Impossible de charger les cours. Le serveur est-il demarre ?
          </p>
        )}

        {status === 'ready' && (
          <>
            {/* Filter buttons - drive the useState above */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={
                    'rounded-full px-4 py-2 text-sm font-semibold transition ' +
                    (activeCategory === cat
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                  }
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Mobile-first responsive grid: 1 col -> sm:2 -> lg:3 */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleClasses.map((item) => (
                <ClassCard
                  key={item.id}
                  item={item}
                  spots={spots[item.id] || 0}
                  onSpotsChange={(value) => setSpotsFor(item.id, value)}
                />
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              Showing <span className="font-semibold text-ink">{visibleClasses.length}</span>{' '}
              classes · <span className="font-semibold text-ink">{totalSpots}</span> spots selected
            </p>
          </>
        )}
      </section>

      {/* ======================= TRAINERS ======================= */}
      <section id="trainers" className="bg-slate-50 py-12 md:py-16">
        <div className="section-wrap">
          <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">
            Meet Our Trainers
          </h2>
          <p className="mx-auto mt-2 max-w-prose text-center text-slate-500">
            Certified coaches who tailor every session to you.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trainers.map((t) => (
              <article
                key={t.id}
                className="overflow-hidden rounded-2xl bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
              >
                <img src={t.photo} alt={`Portrait of ${t.name}`} className="h-56 w-full object-cover" />
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold">{t.name}</h3>
                  <p className="font-semibold text-primary">{t.role}</p>
                  <p className="mt-2 text-slate-500">{t.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= PRICING ======================= */}
      <section id="pricing" className="section-wrap py-12 md:py-16">
        <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">
          Membership Plans
        </h2>
        <p className="mx-auto mt-2 max-w-prose text-center text-slate-500">
          No contracts. Cancel anytime.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={
                'flex flex-col rounded-2xl border bg-white p-8 shadow-md ' +
                (plan.featured
                  ? 'border-primary shadow-xl lg:-translate-y-2'
                  : 'border-slate-200')
              }
            >
              {plan.featured && (
                <span className="mb-3 self-start rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold">{plan.name}</h3>
              <p className="mt-1 text-slate-500">
                <span className="font-display text-4xl font-extrabold text-ink">
                  {euro(plan.price_cents, plan.currency)}
                </span>
                /{plan.interval === 'month' ? 'mo' : plan.interval}
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {(plan.features || []).map((f) => (
                  <li key={f} className="relative pl-6 text-slate-500">
                    <span className="absolute left-0 font-bold text-primary">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleBuy(plan)}
                disabled={buyingId === plan.id}
                className={
                  (plan.featured ? 'btn' : 'btn-outline') +
                  ' mt-auto pt-3 text-center disabled:opacity-60'
                }
              >
                {buyingId === plan.id ? 'Redirection...' : `Buy ${plan.name}`}
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* ======================= CONTACT ======================= */}
      <section id="contact" className="bg-slate-50 py-12 md:py-16">
        <div className="section-wrap text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Start Today</h2>
          <p className="mx-auto mt-2 max-w-prose text-slate-500">
            Book a free intro session - we'll reply within one day.
          </p>
          <a href="mailto:hello@pulsefit.example" className="btn mt-6">
            Email us: hello@pulsefit.example
          </a>
        </div>
      </section>
    </>
  )
}
