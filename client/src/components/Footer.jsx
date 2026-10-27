// Simple footer.
export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="section-wrap flex flex-col items-center justify-between gap-2 py-8 text-sm text-slate-500 sm:flex-row">
        <p className="font-display font-bold text-ink">PulseFit</p>
        <p>&copy; {new Date().getFullYear()} PulseFit Studio. All rights reserved.</p>
        <p>Made for Assignment 3</p>
      </div>
    </footer>
  )
}
