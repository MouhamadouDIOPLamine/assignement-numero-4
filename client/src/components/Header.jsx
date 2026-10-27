import { useAuth } from '../context/AuthContext.jsx'

const links = [
  { href: '#schedule', label: 'Schedule' },
  { href: '#trainers', label: 'Trainers' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#contact', label: 'Contact' },
]

// Sticky header + nav. Layout uses Flexbox (flex utilities).
// A droite : "Sign in" si deconnecte, ou l'email + "Sign out" si connecte.
export default function Header({ onOpenAuth }) {
  const { user, loading, logout } = useAuth()

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav
        aria-label="Main navigation"
        className="section-wrap flex flex-wrap items-center justify-between gap-3 py-3"
      >
        <a href="#top" className="flex items-center gap-2 font-display text-xl font-extrabold text-ink">
          <img src="/favicon.svg" alt="" width="32" height="32" />
          PulseFit
        </a>

        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="border-b-2 border-transparent py-1 font-semibold text-slate-500 transition hover:border-primary hover:text-primary"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Zone authentification */}
        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <span className="hidden text-sm text-slate-500 sm:inline">{user.email}</span>
              <button type="button" onClick={logout} className="btn-outline px-4 py-1.5 text-sm">
                Sign out
              </button>
            </>
          ) : (
            <button type="button" onClick={onOpenAuth} className="btn px-4 py-1.5 text-sm">
              Sign in
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
