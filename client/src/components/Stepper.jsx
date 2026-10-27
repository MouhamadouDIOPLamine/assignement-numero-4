// ===================================================================
// Stepper - a small CONTROLLED component (same pattern as QuantityStepper).
//
// "Controlled" means it owns NO state of its own: the current value comes in
// through the `value` prop, and every change is reported back to the parent
// through the `onChange` callback. The parent is the single source of truth.
// ===================================================================
export default function Stepper({ value, onChange, min = 0, max = 10, label }) {
  const decrement = () => onChange(Math.max(min, value - 1))
  const increment = () => onChange(Math.min(max, value + 1))

  return (
    <div className="flex items-center justify-between gap-3">
      {label && <span className="text-sm text-slate-500">{label}</span>}
      <div className="flex items-center overflow-hidden rounded-full border border-slate-300">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          aria-label="Decrease"
          className="px-3 py-1 text-lg font-bold text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <span className="w-8 text-center font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          aria-label="Increase"
          className="px-3 py-1 text-lg font-bold text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  )
}
