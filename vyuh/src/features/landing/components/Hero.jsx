import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { LatticeScene } from './LatticeScene.jsx'

/**
 * The pinned overture — about 200vh of scroll. The formation does the moving;
 * this layer holds the type, and the lattice canvas lives INSIDE this section
 * (absolute, overflow hidden) so it can never drift over the rest of the
 * page. ScrollTrigger's onLeave / onEnterBack (inside LatticeScene) hides the
 * canvas after the pin releases; an IntersectionObserver pauses its render loop
 * while the hero is off-screen.
 */
export function Hero({ motion, reduced, isMobile, resolvedTheme }) {
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
      className="relative flex h-[100svh] flex-col justify-end overflow-hidden bg-[var(--lg-surface)] pb-14 text-[var(--lg-text)] sm:pb-16"
    >
      {/* The lattice — absolute inside the pinned, clipped hero. */}
      <LatticeScene motion={motion} reduced={reduced} isMobile={isMobile} resolvedTheme={resolvedTheme} />
      {/* Theme-wash so the type holds contrast against the lattice dust. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2] hidden sm:block"
        style={{ background: 'var(--lg-wash-hero-desktop)' }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2] sm:hidden"
        style={{ background: 'var(--lg-wash-hero-mobile)' }}
      />
      <div className="relative z-[6] px-5 sm:px-8">
        <p className="hero-eyebrow font-mono text-[0.625rem] uppercase tracking-widest text-[var(--lg-text-70)]" style={reduced ? undefined : { opacity: 0, visibility: 'hidden' }}>
          The arrangement of practice
        </p>
        <h1
          className="mt-5 font-display font-[520] text-[var(--lg-text)]"
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
              an <em className="font-[430] italic text-[var(--color-ember)]">arrangement.</em>
            </span>
          </span>
        </h1>
        <p
          className="hero-support mt-7 max-w-[34ch] text-base leading-relaxed text-[var(--lg-text-80)]"
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
        <span className="h-px w-10 bg-[var(--lg-text-25)]" />
        <span className="font-mono text-[0.5625rem] uppercase tracking-widest text-[var(--lg-text-55)]">
          Every ring answered — the arrangement holds
        </span>
        <span className="h-px w-10 bg-[var(--lg-text-25)]" />
      </div>

      <div
        aria-hidden="true"
        className="hero-cue pointer-events-none absolute bottom-6 right-5 z-[6] flex items-center gap-3 sm:right-8"
        style={reduced ? undefined : { opacity: 0, visibility: 'hidden' }}
      >
        <span className="font-mono text-[0.625rem] uppercase tracking-widest text-[var(--lg-text-55)]">Scroll</span>
        <span className="scroll-cue relative h-14 w-px overflow-hidden bg-[var(--lg-text-15)]" />
      </div>
    </section>
  )
}
