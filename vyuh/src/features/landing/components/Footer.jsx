/**
 * Ink coda footer — wordmark, one line of description, copyright, three text
 * links. No buttons, no newsletter, no social icons.
 */
export function Footer() {
  return (
    <footer className="border-t border-hairline-on-ink bg-cinema-ink px-5 pb-8 pt-14 text-cinema-paper sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-4xl font-[520] leading-none tracking-tight text-cinema-paper" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
              Vyuh
            </p>
            <p className="mt-2 font-mono text-[0.625rem] uppercase tracking-widest text-cinema-paper/50">
              by MediXO
            </p>
            <p className="mt-6 max-w-[42ch] text-sm leading-relaxed text-cinema-paper/62">
              The arrangement of practice — a deliberate-sequencing platform for
              students preparing for the country’s hardest entrance examinations.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex gap-8 font-mono text-[0.6875rem] uppercase tracking-widest text-cinema-paper/60">
              <li><a className="underline-offset-4 transition-colors hover:text-cinema-paper hover:underline" href="/about">About</a></li>
              <li><a className="underline-offset-4 transition-colors hover:text-cinema-paper hover:underline" href="/privacy">Privacy</a></li>
              <li><a className="underline-offset-4 transition-colors hover:text-cinema-paper hover:underline" href="/accessibility">Accessibility</a></li>
            </ul>
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-hairline-on-ink pt-6 font-mono text-[0.5625rem] uppercase tracking-widest text-cinema-paper/38 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 MediXO Learning Solutions Pvt. Ltd.</span>
          <span>Vyuh · by MediXO · All rights reserved</span>
        </div>
      </div>
    </footer>
  )
}
