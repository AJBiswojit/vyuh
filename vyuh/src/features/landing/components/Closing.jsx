import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ClosingLattice } from './ClosingLattice.jsx'

/**
 * The coda — closing paper panel, no CTA. The shared canvas dissolves the
 * lattice into ink-on-paper particles over this panel as it scrubs in.
 */
export function Closing({ motion, reduced, isMobile, resolvedTheme }) {
  const sectionRef = useRef(null)

  useEffect(() => {
    if (reduced) return undefined
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.to(motion.current, {
        dissolve: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 88%',
          end: 'center 32%',
          scrub: 0.7,
        },
      })
      gsap.fromTo(
        '.closing-line',
        { yPercent: 118, autoAlpha: 0 },
        {
          yPercent: 0,
          autoAlpha: 1,
          ease: 'power3.out',
          duration: 1.1,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 62%', once: true },
        },
      )
    }, sectionRef)
    return () => ctx.revert()
  }, [motion, reduced])

  return (
    <section
      ref={sectionRef}
      data-lattice-gate="closing"
      aria-label="Learn, ascend"
      className="relative flex min-h-[88svh] flex-col items-center justify-center overflow-hidden bg-[var(--lg-surface)] px-5 py-28 text-center text-[var(--lg-text)]"
    >
      <ClosingLattice motion={motion} reduced={reduced} isMobile={isMobile} resolvedTheme={resolvedTheme} />
      <p className="section-eyebrow relative z-[2] justify-center text-[var(--lg-text-60)]">Coda</p>
      <h2
        className="relative z-[2] mt-6 font-display font-[500] text-[var(--lg-text)]"
        style={{
          fontSize: 'clamp(3rem, 10.5vw, 9rem)',
          lineHeight: 0.94,
          letterSpacing: '-0.045em',
          fontVariationSettings: "'SOFT' 0, 'WONK' 1, 'wght' 500",
        }}
      >
        {/* GSAP fromTo owns the initial hidden state (yPercent 118 / autoAlpha 0);
            do not also inline a translate here — GSAP parses a CSS transform into its
            own `y` component and the two would stack, leaving the line clipped forever. */}
        <span className="line-mask">
          <span className="closing-line line-inner">Learn,</span>
        </span>
        <span className="line-mask">
          <span className="closing-line line-inner">
            <em className="font-[430] italic text-[var(--color-ember)]">ascend.</em>
          </span>
        </span>
      </h2>
      <p className="relative z-[2] mt-8 font-mono text-[0.625rem] uppercase tracking-widest text-[var(--lg-text-60)]">
        Arrange · Attempt · Understand · Rebuild
      </p>
    </section>
  )
}
