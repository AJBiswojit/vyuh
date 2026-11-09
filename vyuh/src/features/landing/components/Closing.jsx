import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * The coda — closing paper panel, no CTA. The shared canvas dissolves the
 * lattice into ink-on-paper particles over this panel as it scrubs in.
 */
export function Closing({ motion, reduced }) {
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
      aria-label="Formation, precisely"
      className="relative flex min-h-[88svh] flex-col items-center justify-center overflow-hidden bg-cinema-paper px-5 py-28 text-center text-cinema-ink"
    >
      <p className="section-eyebrow justify-center text-cinema-grey">Coda</p>
      <h2
        className="mt-6 font-display font-[500] text-cinema-ink"
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
          <span className="closing-line line-inner">Formation,</span>
        </span>
        <span className="line-mask">
          <span className="closing-line line-inner">
            <em className="font-[430] italic">precisely.</em>
          </span>
        </span>
      </h2>
      <p className="mt-8 font-mono text-[0.625rem] uppercase tracking-widest text-cinema-grey">
        Arrange · Attempt · Understand · Rebuild
      </p>
    </section>
  )
}
