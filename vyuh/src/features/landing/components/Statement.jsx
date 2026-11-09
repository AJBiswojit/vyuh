import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const LINE = [
  'Most students do not lack effort.',
  'They lack an arrangement — a deliberate sequence of what to practise, when to revisit it, and how honestly to score it.',
  'Vyuh is that arrangement: real patterns, full explanations, mistakes mapped in the open.',
]

/**
 * The scrubbed conviction — paper section, id="idea", nav 01. Every word of the
 * paragraph moves from faint grey to ink as the reader scrolls through it.
 */
export function Statement({ reduced }) {
  const rootRef = useRef(null)
  const words = useMemo(() => LINE.flatMap((sentence) => sentence.split(' ')), [])

  useEffect(() => {
    if (reduced) return undefined
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      // Words ink-in via opacity (theme-agnostic — inherits --lg-text).
      gsap.fromTo(
        '.statement-word',
        { opacity: 0.24 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.055,
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 72%',
            end: 'bottom 58%',
            scrub: 0.8,
          },
        },
      )
      gsap.fromTo(
        '.statement-mark',
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: rootRef.current, start: 'top 60%', end: 'bottom 62%', scrub: true },
        },
      )
    }, rootRef)
    return () => ctx.revert()
  }, [reduced])

  let i = 0
  return (
    <section
      ref={rootRef}
      id="idea"
      className="bg-[var(--lg-surface)] px-5 py-28 text-[var(--lg-text)] sm:px-8 sm:py-36"
      aria-label="The idea behind Vyuh"
    >
      <div className="mx-auto max-w-6xl">
        <p className="section-eyebrow text-[var(--lg-text-60)]">01 — Idea</p>
        <p className="mt-10 max-w-5xl font-display text-[clamp(1.9rem,4.6vw,3.9rem)] font-[430] leading-[1.12] tracking-tight">
          {LINE.map((sentence, si) => (
            <span key={si} className="statement-sentence">
              {sentence.split(' ').map((word) => (
                <span
                  key={`${si}-${i++}`}
                  className="statement-word"
                  style={reduced ? undefined : undefined}
                >
                  {word}{' '}
                </span>
              ))}
              {si < LINE.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
        <div className="mt-14 flex items-center gap-4">
          <span
            aria-hidden="true"
            className="statement-mark block h-px w-40 origin-left bg-[var(--lg-text)]"
            style={reduced ? undefined : { transform: 'scaleX(0)' }}
          />
          <span className="font-mono text-[0.625rem] uppercase tracking-widest text-[var(--lg-text-60)]">
            The arrangement, not the effort
          </span>
        </div>
      </div>
    </section>
  )
}
