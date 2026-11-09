import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

/**
 * The coda footer — logo lockup, one line of purpose, the section-free
 * links. Sign in / Start live here (and in the navbar); nowhere else does
 * the page ask to be used.
 */
export function Footer() {
  return (
    <footer className="border-t border-[var(--lg-hairline)] bg-[var(--lg-surface)] px-5 pb-8 pt-14 text-[var(--lg-text)] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <a href="#top" aria-label="Vyuh by MediXO — back to the top" className="group inline-flex items-center gap-3 no-underline">
              <img src="/logo/Vyuh_medixo.svg" alt="" width="44" height="44" className="logo-img h-11 w-11" />
              <span className="leading-none">
                <span className="block font-display text-4xl font-[520] tracking-tight text-[var(--lg-text)] transition-opacity group-hover:opacity-80" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>Vyuh</span>
                <span className="mt-1.5 block font-mono text-[0.5625rem] uppercase leading-none tracking-[0.28em] text-[var(--lg-text-55)]">by MediXO</span>
              </span>
            </a>
            <p className="mt-6 max-w-[42ch] text-sm leading-relaxed text-[var(--lg-text-62)]">
              The arrangement of practice — a deliberate-sequencing platform for
              students preparing for the country’s hardest entrance examinations.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-6 sm:items-end">
            <ul className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-[0.6875rem] uppercase tracking-widest text-[var(--lg-text-62)]">
              <li><Link className="underline-offset-4 transition-colors hover:text-[var(--lg-text)] hover:underline" to="/about">About</Link></li>
              <li><Link className="underline-offset-4 transition-colors hover:text-[var(--lg-text)] hover:underline" to="/privacy">Privacy</Link></li>
              <li><Link className="underline-offset-4 transition-colors hover:text-[var(--lg-text)] hover:underline" to="/accessibility">Accessibility</Link></li>
            </ul>
            <div className="flex items-center gap-5">
              <Link to="/login" className="vyuh-nav-link inline-flex font-mono text-[0.6875rem] uppercase tracking-[0.18em] no-underline">Sign in</Link>
              <Link to="/login" className="vyuh-start-link no-underline">Start<ArrowUpRight size={13} strokeWidth={2} aria-hidden="true" /></Link>
            </div>
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--lg-hairline)] pt-6 font-mono text-[0.5625rem] uppercase tracking-widest text-[var(--lg-text-55)] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 MediXO Learning Solutions Pvt. Ltd.</span>
          <span>Vyuh · by MediXO · All rights reserved</span>
        </div>
      </div>
    </footer>
  )
}
