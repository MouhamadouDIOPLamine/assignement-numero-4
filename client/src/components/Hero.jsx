// Hero section - big headline + call to action. Mobile-first layout.
export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src="/hero.svg"
        alt=""
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="section-wrap flex flex-col items-start gap-5 py-20 text-white md:py-28">
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          Boutique fitness studio
        </span>
        <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-tight sm:text-5xl">
          Train with intention. Feel the pulse.
        </h1>
        <p className="max-w-xl text-white/80">
          Small-group classes, certified coaches and flexible memberships -
          everything you need to build a routine that sticks.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="#schedule" className="btn">See the schedule</a>
          <a href="#pricing" className="btn-outline border-white text-white hover:bg-white hover:text-ink">
            View memberships
          </a>
        </div>
      </div>
    </section>
  )
}
