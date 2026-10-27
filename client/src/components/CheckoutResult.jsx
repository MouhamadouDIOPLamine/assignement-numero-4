// =====================================================================
// CheckoutResult - la "page de succes" affichee au retour de Stripe.
// Stripe renvoie l'utilisateur vers /?checkout=success&order=ID (ou cancel).
//
// Le webhook qui marque la commande 'paid' peut arriver un court instant
// APRES la redirection. On interroge donc /api/orders/:id plusieurs fois
// (useEffect + setTimeout) jusqu'a voir le statut 'paid'.
// =====================================================================
import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'

function euro(cents, currency = 'eur') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(
    (cents || 0) / 100,
  )
}

export default function CheckoutResult({ orderId, cancelled, onClose }) {
  const [data, setData] = useState(null)
  // 'checking' = on interroge le serveur ; 'paid' = confirme ; 'pending' = pas
  // encore confirme apres plusieurs essais ; 'cancelled' = paiement annule.
  const [state, setState] = useState(cancelled ? 'cancelled' : 'checking')
  const [tries, setTries] = useState(0)

  useEffect(() => {
    if (cancelled) return
    let active = true
    let count = 0

    async function poll() {
      try {
        const res = await api.getOrder(orderId)
        if (!active) return
        setData(res)
        if (res.order.status === 'paid') {
          setState('paid')
          return // c'est bon, on arrete d'interroger
        }
      } catch {
        // on ignore et on reessaie
      }
      count += 1
      if (!active) return
      setTries(count)
      if (count < 6) {
        setTimeout(poll, 1500) // le webhook arrive parfois apres la redirection
      } else {
        setState('pending')
      }
    }

    poll()
    return () => {
      active = false
    }
  }, [orderId, cancelled])

  const order = data?.order
  const items = data?.items || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {state === 'cancelled' && (
          <>
            <div className="mb-3 text-5xl">⚠️</div>
            <h2 className="font-display text-2xl font-bold">Paiement annule</h2>
            <p className="mt-2 text-slate-500">
              Aucun montant n'a ete debite. Vous pouvez reessayer quand vous voulez.
            </p>
          </>
        )}

        {state === 'checking' && (
          <>
            <div className="mb-3 text-5xl">⏳</div>
            <h2 className="font-display text-2xl font-bold">Confirmation en cours...</h2>
            <p className="mt-2 text-slate-500">
              Nous verifions aupres de Stripe que le paiement est bien confirme.
              {tries > 0 && ` (essai ${tries})`}
            </p>
          </>
        )}

        {state === 'paid' && (
          <>
            <div className="mb-3 text-5xl">✅</div>
            <h2 className="font-display text-2xl font-bold text-emerald-600">
              Paiement confirme !
            </h2>
            <p className="mt-2 text-slate-500">
              Merci. Votre commande est enregistree comme <strong>payee</strong>.
            </p>
          </>
        )}

        {state === 'pending' && (
          <>
            <div className="mb-3 text-5xl">🕐</div>
            <h2 className="font-display text-2xl font-bold">Presque la...</h2>
            <p className="mt-2 text-slate-500">
              Le paiement est en cours de confirmation. Rechargez la page dans
              un instant pour voir le statut mis a jour.
            </p>
          </>
        )}

        {order && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Commande</span>
              <span className="font-semibold">#{order.id}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-slate-500">Statut</span>
              <span
                className={
                  'font-semibold ' +
                  (order.status === 'paid' ? 'text-emerald-600' : 'text-amber-600')
                }
              >
                {order.status === 'paid' ? 'Payee' : 'En attente'}
              </span>
            </div>
            {items.map((it, i) => (
              <div key={i} className="mt-1 flex justify-between">
                <span className="text-slate-500">{it.name}</span>
                <span className="font-semibold">
                  {euro(it.unit_price_cents, order.currency)}
                </span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-500">Total</span>
              <span className="font-bold">
                {euro(order.amount_total_cents, order.currency)}
              </span>
            </div>
          </div>
        )}

        <button type="button" onClick={onClose} className="btn mt-6 w-full">
          Retour au site
        </button>
      </div>
    </div>
  )
}
