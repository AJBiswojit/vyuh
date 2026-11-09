import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion.js'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery.js'
import { useTheme } from '@/shared/hooks/useTheme.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

import { Nav } from '../components/Nav.jsx'
import { Loader } from '../components/Loader.jsx'
import { Hero } from '../components/Hero.jsx'
import { Statement } from '../components/Statement.jsx'
import { Pillars } from '../components/Pillars.jsx'
import { Principles } from '../components/Principles.jsx'
import { Loop } from '../components/Loop.jsx'
import { Stats } from '../components/Stats.jsx'
import { Closing } from '../components/Closing.jsx'
import { Footer } from '../components/Footer.jsx'
import '../landing.css'

/**
 * Vyuh by MediXO — the arrangement of practice.
 *
 * Two canvases carry the 3D story, each absolute inside its own section and
 * paused off-screen: the hero's lattice (LatticeScene — assembly, implosion,
 * chakravyuh, ripple) and the coda's (ClosingLattice — the wheel scattering
 * over the closing panel). The method panels are a CSS3D scene of live paper
 * documents. ScrollTrigger writes plain numbers into one shared mutable
 * `motion` object; every imperative loop reads it. One GSAP ticker, one
 * reduced-motion switch, zero CTAs in the body — the navbar and footer hold
 * the only links.
 */
export function LandingPage() {
  // The hook appends the institute name; the spec fixes the exact title.
  useEffect(() => { document.title = 'Vyuh by MediXO' }, [])
  const reduced = usePrefersReducedMotion()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { resolved: resolvedTheme } = useTheme()
  const scopeRef = useRef(null)
  const lenisRef = useRef(null)
  const motion = useRef({
    assemble: reduced ? 1 : 0, // loader choreography 0 → 1
    hero: 0, // hero pin progress 0 → 1 (rotation, tilt, dolly, lattice fade)
    dissolve: 0, // closing 0 → 1 (particles scatter, ink-on-paper)
    pillars: 0, // pillar progress in panel units 0 → 3 (object rotation)
  })

  // Lenis ↔ GSAP: one clock for everything. Skipped entirely for reduced motion.
  useEffect(() => {
    if (reduced) return undefined
    gsap.registerPlugin(ScrollTrigger)
    const lenis = new Lenis({ autoRaf: false, duration: 1.15, smoothWheel: true })
    lenisRef.current = lenis
    // Dev-only handle so E2E/capture tooling can jump instantly under Lenis.
    if (import.meta.env.DEV) window.__lenis = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisRef.current = null
      if (import.meta.env.DEV) delete window.__lenis
    }
  }, [reduced])

  // Late layout shifts (fonts, the logo SVG) invalidate every trigger below —
  // refresh once both have settled so pins land where content actually is.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const refresh = () => ScrollTrigger.refresh()
    let cancelled = false
    if (document.fonts?.ready) document.fonts.ready.then(() => { if (!cancelled) refresh() })
    const logo = new Image()
    logo.src = '/logo/Vyuh_medixo.svg'
    if (logo.complete) refresh()
    else logo.addEventListener('load', refresh, { once: true })
    window.addEventListener('load', refresh)
    return () => { cancelled = true; window.removeEventListener('load', refresh) }
  }, [])

  const scrollTo = (target) => {
    const el = document.querySelector(target)
    if (!el) return
    if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: 0, duration: 1.4 })
    else el.scrollIntoView({ behavior: 'auto', block: 'start' })
  }

  return (
    <div ref={scopeRef} className="vyuh-landing relative bg-[var(--lg-surface)] text-[var(--lg-text)] antialiased">
      <Nav onJump={scrollTo} />
      {!reduced ? <Loader motion={motion} /> : null}
      <main id="main">
        <Hero motion={motion} reduced={reduced} isMobile={isMobile} resolvedTheme={resolvedTheme} />
        <Statement reduced={reduced} />
        <Pillars motion={motion} reduced={reduced} isMobile={isMobile} />
        <Principles reduced={reduced} />
        <Loop reduced={reduced} />
        <Stats reduced={reduced} />
        <Closing motion={motion} reduced={reduced} isMobile={isMobile} resolvedTheme={resolvedTheme} />
      </main>
      <Footer />
      <div aria-hidden="true" className="landing-grain" />
    </div>
  )
}
