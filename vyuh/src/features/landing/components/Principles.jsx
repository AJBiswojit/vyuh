import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const PRINCIPLES = [
  {
    index: 'I',
    title: 'Confidence',
    body: 'Practise until the unfamiliar stops being foreign — exam pressure, rehearsed until it feels ordinary.',
    foot: 'FULL-LENGTH SIMULATIONS · WEEKLY',
  },
  {
    index: 'II',
    title: 'Mistake patterns',
    body: 'Your errors have signatures. Vyuh reads them — misread stems, rushed arithmetic, weak links — and routes your next hour accordingly.',
    foot: 'ERROR FORENSICS · PER STUDENT',
  },
  {
    index: 'III',
    title: 'Works offline',
    body: 'The hall does not wait for the network. Responses are held on the device and synced quietly when the connection returns.',
    foot: 'LOCAL-FIRST · AUTO-SYNC',
  },
]

/**
 * Stacked cards — paper section, id="principles", nav 04. Each card is sticky;
 * as the next card arrives, the one beneath scales down and dims, so the stack
 * reads like a rationed deck. CSS sticky does the pinning (Lenis-safe);
 * ScrollTrigger scrubs the scale and dim.
 */
export function Principles({ reduced }) {
  const rootRef = useRef(null)

  useEffect(() => {
    if (reduced) return undefined
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.principle-card')
      for (let i = 0; i < cards.length - 1; i++) {
        gsap.to(cards[i], {
          scale: 0.9,
          opacity: 0.38,
          ease: 'none',
          scrollTrigger: {
            trigger: cards[i + 1],
            start: 'top 92%',
            end: 'top 26%',
            scrub: true,
          },
        })
      }
    }, rootRef)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section
      ref={rootRef}
      id="principles"
      className="relative bg-cinema-paper px-5 pb-24 pt-24 text-cinema-ink sm:px-8 sm:pt-32"
      aria-label="Principles"
    >
      <div className="mx-auto max-w-6xl">
        <p className="section-eyebrow text-cinema-grey">04 — Principles</p>
        <h2 className="mt-4 max-w-3xl font-display text-[clamp(2rem,4.6vw,3.6rem)] font-[480] leading-[0.98] tracking-tight text-cinema-ink">
          Held quietly,
          <br />
          in every sitting.
        </h2>
        <div className="mt-14 flex flex-col gap-6 sm:mt-20">
          {PRINCIPLES.map((principle, i) => (
            <article
              key={principle.index}
              className="principle-card sticky origin-top rounded-sm border border-hairline-on-paper bg-cinema-paper p-6 shadow-[0_-1px_0_0_rgb(var(--vyuh-cinema-ink-rgb)/0.06)] sm:p-10"
              style={{ top: `${6 + i * 1.75}rem`, zIndex: i + 1 }}
            >
              <div className="flex items-baseline justify-between gap-6 border-b border-hairline-on-paper pb-5">
                <h3 className="font-display text-[clamp(1.7rem,3.4vw,2.9rem)] font-[480] leading-none tracking-tight text-cinema-ink">
                  {principle.title}
                </h3>
                <span className="font-mono text-[0.625rem] uppercase tracking-widest text-cinema-grey">
                  Principle {principle.index}
                </span>
              </div>
              <div className="mt-6 grid gap-6 md:grid-cols-[1.6fr_1fr] md:items-end">
                <p className="max-w-[46ch] text-base leading-relaxed text-cinema-ink/85">{principle.body}</p>
                <p className="font-mono text-[0.625rem] leading-relaxed tracking-widest text-cinema-grey md:text-right">
                  {principle.foot}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
