import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const STATS = [
  { value: 84000, decimals: 0, suffix: '', label: 'Practice responses arranged over the last twelve months' },
  { value: 92, decimals: 0, suffix: '%', label: 'Median accuracy lift across full-length sittings by week six' },
  { value: 3.1, decimals: 1, suffix: ' days', label: 'Median time from a mapped mistake pattern to a patched one' },
]

/**
 * Numbers on ink, in JetBrains Mono, counted up once on enter. Every value is
 * a placeholder — clearly marked, to be replaced only with audited data.
 */
export function Stats({ reduced }) {
  const rootRef = useRef(null)

  useEffect(() => {
    if (reduced) return undefined
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.stat-figure').forEach((el) => {
        const target = Number(el.dataset.value)
        const decimals = Number(el.dataset.decimals)
        const state = { v: 0 }
        gsap.to(state, {
          v: target,
          duration: 1.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 82%', once: true },
          onUpdate: () => {
            el.dataset.rendered = decimals > 0
              ? state.v.toFixed(decimals)
              : Math.round(state.v).toLocaleString('en-IN')
            el.firstElementChild.textContent = el.dataset.rendered
          },
        })
      })
    }, rootRef)
    return () => ctx.revert()
  }, [reduced])

  const staticFigure = (stat) =>
    stat.decimals > 0 ? stat.value.toFixed(stat.decimals) : stat.value.toLocaleString('en-IN')

  return (
    <section
      ref={rootRef}
      aria-label="Numbers — placeholders until audited"
      className="border-t border-hairline-on-ink bg-cinema-ink px-5 py-20 text-cinema-paper sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="section-eyebrow text-cinema-paper/50">Numbers</p>
          <p className="font-mono text-[0.625rem] uppercase tracking-widest text-cinema-paper/40">
            All figures are placeholders<span className="text-ember">*</span>
          </p>
        </div>
        <dl className="mt-12 grid gap-12 sm:grid-cols-3 sm:gap-10">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col border-t border-hairline-on-ink pt-6">
              <dd
                className="stat-figure order-1 font-mono text-5xl font-[560] tabular-nums leading-none tracking-tight text-cinema-paper sm:text-6xl"
                data-value={stat.value}
                data-decimals={stat.decimals}
              >
                <span>{reduced ? staticFigure(stat) : '0'}</span>
                {stat.suffix ? <span className="text-[0.55em] text-cinema-paper/55">{stat.suffix}</span> : null}
              </dd>
              <dt className="order-2 mt-4 max-w-[36ch] text-sm leading-snug text-cinema-paper/62">
                {stat.label}
                <span className="text-ember">*</span>
              </dt>
            </div>
          ))}
        </dl>
        <p className="mt-12 font-mono text-[0.5625rem] uppercase leading-relaxed tracking-widest text-cinema-paper/38">
          * Placeholder values for layout evaluation — not measured, not audited; replace before public launch.
        </p>
      </div>
    </section>
  )
}
