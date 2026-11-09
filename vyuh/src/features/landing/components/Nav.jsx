/**
 * Fixed wordmark and section index. mix-blend-difference inverts against both
 * papers, so one colour (paper) works on ink and on paper. No buttons — two
 * things only: the wordmark and the numbered index of sections.
 */
export function Nav({ onJump }) {
  const handle = (event) => {
    const href = event.currentTarget.getAttribute('href')
    if (href?.startsWith('#')) {
      event.preventDefault()
      onJump(href)
    }
  }
  const index = [
    ['01', 'Idea', '#idea'],
    ['02', 'Method', '#method'],
    ['03', 'Loop', '#loop'],
    ['04', 'Principles', '#principles'],
  ]
  return (
    <header className="fixed inset-x-0 top-0 z-[6] mix-blend-difference">
      <nav aria-label="Section index" className="flex items-baseline justify-between px-5 py-4 sm:px-8 sm:py-5">
        <a
          href="#top"
          onClick={handle}
          className="font-display text-2xl font-[520] leading-none tracking-tight text-cinema-paper no-underline"
          style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}
        >
          Vyuh
        </a>
        <ol className="hidden items-baseline gap-6 font-mono text-[0.625rem] uppercase tracking-widest text-cinema-paper sm:flex">
          {index.map(([num, label, href]) => (
            <li key={num}>
              <a
                href={href}
                onClick={handle}
                className="group inline-flex items-baseline gap-1.5 no-underline"
              >
                <span className="opacity-50 transition-opacity duration-300 group-hover:opacity-100">{num}</span>
                <span className="underline-offset-4 transition-[text-decoration-color] duration-300 group-hover:underline group-hover:decoration-2">
                  {label}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </header>
  )
}
