import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * The pinned overture — about 200vh of scroll, ink throughout. The canvas does
 * the moving; this layer holds the type. Headline lines rise out of masks once
 * the loader hands off (~1.3s), while scroll scrubs rotation, tilt and dolly.
 */
export function Hero({ motion, reduced }) {
  const sectionRef = useRef(null)
  const noteRef = useRef(null)

  useEffect(() => {
    if (reduced) return undefined
    gsap.registerPlugin(ScrollTrigger)
    const section = sectionRef.current
    const ctx = gsap.context(() => {
      // Reveal — time-based, two masked lines + supporting sentence.
      const tl = gsap.timeline({ delay: 1.25, defaults: { ease: 'power3.out' } })
      tl.to('.hero-line-inner', { y: 0, duration: 1.05, stagger: 0.14 }, 0)
        .to('.hero-support', { autoAlpha: 1, y: 0, duration: 0.9 }, 0.55)
        .to('.hero-eyebrow', { autoAlpha: 1, duration: 0.7 }, 0.35)
        .to('.hero-cue', { autoAlpha: 1, duration: 0.7 }, 0.8)

      // Scrub — lattice rotates, camera dollies, ~200vh of pinned scroll.
      // The note is painted from this same trigger: one scroll authority,
      // so the caption can never drift from the wheel it narrates.
      const paintNote = (p) => {
        const el = noteRef.current
        if (!el) return
        const fadeIn = THREElessSmooth(Math.min(Math.max((p - 0.14) / 0.22, 0), 1))
        const fadeOut = 1 - THREElessSmooth(Math.min(Math.max((p - 0.88) / 0.1, 0), 1))
        const alpha = Math.max(0, fadeIn * fadeOut)
        el.style.opacity = String(alpha)
        el.style.visibility = alpha <= 0.02 ? 'hidden' : 'visible'
        el.style.transform = `translateY(${(1 - fadeIn) * 14}px)`
      }
      const THREElessSmooth = (t) => t * t * (3 - 2 * t)
      gsap.to(motion.current, {
        hero: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=200%',
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          onUpdate: (self) => paintNote(self.progress),
          onRefresh: (self) => paintNote(self.progress),
        },
      })
    }, section)
    return () => ctx.revert()
  }, [motion, reduced])

  return (
    <section
      ref={sectionRef}
      id="top"
      data-lattice-gate="hero"
      aria-label="Vyuh — the arrangement of practice"
      className="relative flex h-[100svh] flex-col justify-end overflow-hidden bg-cinema-ink pb-14 text-cinema-paper sm:pb-16"
    >
      {/* Ink wash so the type holds contrast against the lattice dust. */}
      {/* Desktop: left-to-right wash, lattice sits right of the type. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[6] hidden sm:block"
        style={{ background: 'linear-gradient(100deg, rgb(var(--vyuh-cinema-ink-rgb) / 0.94) 0%, rgb(var(--vyuh-cinema-ink-rgb) / 0.72) 34%, rgb(var(--vyuh-cinema-ink-rgb) / 0.08) 62%, rgb(var(--vyuh-cinema-ink-rgb) / 0) 78%)' }}
      />
      {/* Mobile: vertical wash, heaviest under the type block. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[6] sm:hidden"
        style={{ background: 'linear-gradient(180deg, rgb(var(--vyuh-cinema-ink-rgb) / 0.3) 0%, rgb(var(--vyuh-cinema-ink-rgb) / 0.12) 26%, rgb(var(--vyuh-cinema-ink-rgb) / 0.42) 48%, rgb(var(--vyuh-cinema-ink-rgb) / 0.9) 66%, rgb(var(--vyuh-cinema-ink-rgb) / 0.97) 100%)' }}
      />
      <div className="relative z-[6] px-5 sm:px-8">
        <p className="hero-eyebrow font-mono text-[0.625rem] uppercase tracking-widest text-cinema-paper/70" style={reduced ? undefined : { opacity: 0, visibility: 'hidden' }}>
          The arrangement of practice
        </p>
        <h1
          className="mt-5 font-display font-[520] text-cinema-paper"
          style={{
            fontSize: 'clamp(3.4rem, 9.6vw, 8.25rem)',
            lineHeight: 0.94,
            letterSpacing: '-0.042em',
            fontVariationSettings: "'SOFT' 0, 'WONK' 1, 'wght' 520",
          }}
        >
          <span className="line-mask">
            <span className="hero-line-inner line-inner" style={reduced ? undefined : { transform: 'translateY(112%)' }}>
              Mastery is
            </span>
          </span>
          <span className="line-mask">
            <span className="hero-line-inner line-inner" style={reduced ? undefined : { transform: 'translateY(112%)' }}>
              an <em className="font-[430] italic">arrangement.</em>
            </span>
          </span>
        </h1>
        <p
          className="hero-support mt-7 max-w-[34ch] text-base leading-relaxed text-cinema-paper/80"
          style={reduced ? undefined : { opacity: 0, transform: 'translateY(14px)', visibility: 'hidden' }}
        >
          Practice arranged with intent — every answer explained, every mistake
          mapped, the week rebuilt before it begins.
        </p>
      </div>

      <div
        aria-hidden="true"
        ref={noteRef}
        className="pointer-events-none absolute bottom-24 left-0 right-0 z-[6] mx-auto hidden w-max items-center gap-4 sm:flex"
        style={{ opacity: 0, visibility: 'hidden' }}
      >
        <span className="h-px w-10 bg-cinema-paper/25" />
        <span className="font-mono text-[0.5625rem] uppercase tracking-widest text-cinema-paper/55">
          Every ring answered — the arrangement holds
        </span>
        <span className="h-px w-10 bg-cinema-paper/25" />
      </div>

      <div
        aria-hidden="true"
        className="hero-cue pointer-events-none absolute bottom-6 right-5 z-[6] flex items-center gap-3 sm:right-8"
        style={reduced ? undefined : { opacity: 0, visibility: 'hidden' }}
      >
        <span className="font-mono text-[0.625rem] uppercase tracking-widest text-cinema-paper/55">Scroll</span>
        <span className="scroll-cue relative h-14 w-px overflow-hidden bg-cinema-paper/15" />
      </div>
    </section>
  )
}
