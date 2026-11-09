import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion.js'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

import { LatticeScene } from '../components/LatticeScene.jsx'
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
 * A single fixed canvas (LatticeScene) carries the whole 3D story behind the
 * document: an assembly of ~2,000 instanced nodes that snaps into a triple
 * chevron on load, rotates and dollies through the pinned hero, folds away as
 * the statement washes in, spins four pillar objects in place, and finally
 * dissolves into particles on the closing paper panel.
 *
 * Scroll position never mounts or unmounts scenes — ScrollTrigger writes plain
 * numbers into one shared mutable `motion` object and the canvas imperative
 * loop reads them. One GSAP ticker, one reduced-motion switch, zero CTAs.
 */
export function LandingPage() {
  // The hook appends the institute name; the spec fixes the exact title.
  useEffect(() => { document.title = 'Vyuh by MediXO' }, [])
  const reduced = usePrefersReducedMotion()
  const isMobile = useMediaQuery('(max-width: 767px)')
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

  const scrollTo = (target) => {
    const el = document.querySelector(target)
    if (!el) return
    if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: 0, duration: 1.4 })
    else el.scrollIntoView({ behavior: 'auto', block: 'start' })
  }

  return (
    <div ref={scopeRef} className="vyuh-landing relative bg-cinema-paper text-cinema-ink antialiased">
      <LatticeScene motion={motion} reduced={reduced} isMobile={isMobile} />
      <Nav onJump={scrollTo} />
      {!reduced ? <Loader motion={motion} /> : null}
      <main id="main">
        <Hero motion={motion} reduced={reduced} />
        <Statement reduced={reduced} />
        <Pillars motion={motion} reduced={reduced} isMobile={isMobile} />
        <Principles reduced={reduced} />
        <Loop reduced={reduced} />
        <Stats reduced={reduced} />
        <Closing motion={motion} reduced={reduced} />
      </main>
      <Footer />
      <div aria-hidden="true" className="landing-grain" />
    </div>
  )
}
