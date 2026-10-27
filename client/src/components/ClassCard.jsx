import Stepper from './Stepper.jsx'

// One card in the main grid. It is "dumb": it receives the class item plus the
// current spots value and the onChange handler, and renders the reused Stepper.
export default function ClassCard({ item, spots, onSpotsChange }) {
  return (
    <article className="flex flex-col rounded-2xl border-l-4 border-primary bg-white p-5 shadow-md">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-2xl font-bold">{item.time}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-accent">
          {item.day}
        </span>
      </div>
      <h3 className="mt-1 font-semibold">{item.name}</h3>
      <p className="text-sm text-slate-500">
        {item.category} · {item.duration} min
      </p>
      <p className="mt-1 text-sm text-slate-500">with {item.trainer}</p>

      {/* Reused controlled component, one per item */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <Stepper
          label="Spots"
          value={spots}
          onChange={onSpotsChange}
          min={0}
          max={6}
        />
      </div>
    </article>
  )
}
