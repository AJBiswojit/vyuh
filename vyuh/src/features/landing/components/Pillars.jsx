import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js'
import { PANEL_COMPONENTS, PANEL_META } from './panels.jsx'

/**
 * Four disciplines, one formation — told through live paper documents, one
 * floating panel at a time.
 *
 * Desktop: the section pins (~300vh) and a CSS3D scene carries four real DOM
 * product panels (exam hall, ledger, roster, replay) in 3D space — tilt capped
 * at ±12°, positions scrubbed by ScrollTrigger through `motion.pillars`
 * (0 → 3). Ember appears once per panel: the tile in play, the mistake row,
 * the focus student, the replay link. The large ghost numeral 01–04 keeps
 * its place in the layout and advances with the scroll.
 *
 * Below 768px (or under reduced motion) the panels collapse into a vertical
 * reading stack — same DOM, no 3D, no tilt — and the pin is skipped entirely.
 */

const SPACING = 560
const CAM_Z = 1030
const FOV = 38
const MAX_TILT = 0.20 // ≈ 11.5°
const ANSWER_ADVANCE = [12, 20] // current tile range across panel-1's scroll window

export function Pillars({ motion, reduced, isMobile }) {
  const sectionRef = useRef(null)
  const stageRef = useRef(null)
  const mountRef = useRef(null)
  const numeralRef = useRef(null)
  // Stable, document-less panel roots. Portals render the panels into them;
  // the effect adopts them into the CSS3D scene. React never re-parents them.
  const [panelSlots] = useState(() => Array.from({ length: PANEL_META.length }, () => document.createElement('div')))
  const stacked = reduced || isMobile

  // ── Ledger rows stagger in ───────────────────────────────────────────
  // Stacked path: observer per article. CSS3D path: piggybacks the scrub
  // (camera past mid-way to panel 2). Either way each row reveals once.
  const revealedRef = useRef(false)
  const revealLedger = (root) => {
    if (!root || revealedRef.current) return
    const rows = root.querySelectorAll('[data-ledger-row]')
    if (!rows.length) return
    revealedRef.current = true
    rows.forEach((row, i) => {
      row.style.transitionDelay = `${i * 90}ms`
      row.classList.add('in')
    })
  }

  useEffect(() => {
    if (!stacked) return undefined // CSS3D path reveals from the scrub sync
    const section = sectionRef.current
    if (!section) return undefined
    if (reduced) {
      revealLedger(section)
      return undefined
    }
    const articles = [...section.querySelectorAll('[data-pillar-panel]')]
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            revealLedger(entry.target)
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.2 },
    )
    articles.forEach((article) => observer.observe(article))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stacked, reduced])

  // ── CSS3D scene + pin (desktop, motion allowed) ──────────────────────
  useEffect(() => {
    if (stacked) return undefined
    gsap.registerPlugin(ScrollTrigger)
    const section = sectionRef.current
    const mount = mountRef.current
    const stage = stageRef.current
    if (!section || !mount || !stage) return undefined

    const renderer = new CSS3DRenderer()
    renderer.setSize(stage.clientWidth, stage.clientHeight)
    Object.assign(renderer.domElement.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none', // the panels are documents, not controls
    })
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FOV, stage.clientWidth / stage.clientHeight, 1, 5000)
    camera.position.set(0, 0, CAM_Z)

    // Adopt the React-rendered panel DOM into the CSS3D scene.
    const items = panelSlots.map((slot, i) => {
      const object = new CSS3DObject(slot)
      object.position.set(i * SPACING, 0, 0)
      scene.add(object)
      return object
    })

    // ── Scroll sync: camera dolly + numeral + live panel state ──────
    let lastNumeral = ''
    let lastCurrent = -1
    const clamp01 = (v) => Math.min(1, Math.max(0, v))
    const sync = () => {
      const pillars = THREE.MathUtils.clamp(motion.current.pillars ?? 0, 0, PANEL_META.length - 1)
      camera.position.x = pillars * SPACING - 40

      // Ghost numeral 01–04
      const numeral = PANEL_META[Math.round(pillars)]?.index ?? '01'
      if (numeralRef.current && numeral !== lastNumeral) {
        numeralRef.current.textContent = numeral
        lastNumeral = numeral
      }

      // Panel 01: the current tile advances across panel-1's scroll window.
      const tileWindow = clamp01(pillars / 0.9)
      const current = ANSWER_ADVANCE[0] + Math.floor(tileWindow * (ANSWER_ADVANCE[1] - ANSWER_ADVANCE[0]))
      const hall = panelSlots[0]
      if (hall && current !== lastCurrent) {
        lastCurrent = current
        hall.querySelectorAll('[data-tile-index]').forEach((tile) => {
          const n = Number(tile.dataset.tileIndex)
          tile.classList.remove('tile-answered', 'tile-marked', 'tile-current', 'tile-tbd')
          if (n === current) { tile.classList.add('tile-current'); tile.innerHTML = `<span>Q${String(n).padStart(2, '0')}</span>` } else if (n < current) { tile.classList.add('tile-answered'); tile.innerHTML = `<span>Q${String(n).padStart(2, '0')}</span><small><svg viewBox='0 0 10 10' width='8' height='8' aria-hidden='true'><path d='M1.6 5.4 4 7.8 8.4 2.2' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'/></svg></small>` } else if (n === 15 || n === 22) { tile.classList.add('tile-marked'); tile.innerHTML = `<span>Q${String(n).padStart(2, '0')}</span><small>M</small>` } else { tile.classList.add('tile-tbd'); tile.innerHTML = `<span>Q${String(n).padStart(2, '0')}</span>` }
        })
      }

      if (pillars > 0.5) revealLedger(panelSlots[1])

      // Panel 04: the connector line draws as the camera arrives.
      const replay = panelSlots[3]
      const link = replay?.querySelector('[data-replay-link]')
      if (link) {
        const draw = clamp01((pillars - 2.45) / 0.5)
        link.style.strokeDashoffset = String(140 * (1 - draw))
      }
    }

    const renderFrame = () => {
      const time = performance.now()
      sync()
      for (let i = 0; i < items.length; i += 1) {
        const offset = items[i].position.x - camera.position.x
        items[i].rotation.y = THREE.MathUtils.clamp(-offset * 0.00038, -MAX_TILT, MAX_TILT)
        items[i].rotation.x = Math.sin(time * 0.0011 + i * 1.9) * 0.022
        items[i].position.y = -78 + Math.sin(time * 0.0009 + i * 1.4) * 9
        const el = items[i].element
        if (el) el.style.opacity = String(1 - Math.min(0.62, Math.abs(offset) / SPACING * 0.72))
      }
      renderer.render(scene, camera)
    }

    // Render only while the section is near the viewport.
    const gate = { on: true }
    const observer = new IntersectionObserver(
      (entries) => { for (const entry of entries) gate.on = entry.isIntersecting },
      { rootMargin: '30% 0px 30% 0px' },
    )
    observer.observe(section)

    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (gate.on) renderFrame()
    }
    raf = requestAnimationFrame(tick)

    const onResize = () => {
      const width = stage.clientWidth
      const height = stage.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', onResize)

    const ctx = gsap.context(() => {
      gsap.to(motion.current, {
        pillars: PANEL_META.length - 1,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=300%',
          pin: true,
          scrub: 0.9,
          anticipatePin: 1,
          onUpdate: sync,
          onRefresh: sync,
        },
      })
    }, section)

    return () => {
      cancelAnimationFrame(raf)
      ctx.revert()
      observer.disconnect()
      window.removeEventListener('resize', onResize)
      mount.removeChild(renderer.domElement)
    }
  }, [stacked, motion])

  const header = (
    <div className="pointer-events-none relative z-[2] flex items-end justify-between gap-6 px-5 pb-2 pt-14 sm:px-8 sm:pt-20">
      <div>
        <p className="section-eyebrow text-[var(--lg-text-50)]">02 — Method</p>
        <h2 className="mt-4 font-display text-[clamp(2rem,4.6vw,3.6rem)] font-[480] leading-[0.98] tracking-tight text-[var(--lg-text)]">
          Four disciplines,
          <br />
          one formation.
        </h2>
      </div>
    </div>
  )

  // ── Stacked path (mobile / reduced motion) ──────────────────────────
  if (stacked) {
    return (
      <section ref={sectionRef} id="method" aria-label="The method in four disciplines" className="relative overflow-hidden bg-[var(--lg-surface)] text-[var(--lg-text)]">
        {header}
        <div className="pillar-stack flex flex-col gap-2 pb-16 pt-4">
          {PANEL_META.map((panel, i) => {
            const Panel = PANEL_COMPONENTS[i]
            return (
              <article key={panel.index} data-pillar-panel={i} className="relative border-t border-[var(--lg-hairline)] px-5 pb-12 pt-10 sm:px-8">
                <p aria-hidden="true" className="pointer-events-none absolute right-3 top-4 font-display text-[clamp(5rem,26vw,8rem)] font-[380] leading-none text-[var(--lg-ghost)]">{panel.index}</p>
                <div className="relative">
                  <p className="font-mono text-[0.625rem] uppercase tracking-widest text-[var(--lg-text-50)]">P.{panel.index} <span className="opacity-60">/ 04</span></p>
                  <h3 className="mt-2 font-display text-[clamp(1.6rem,6vw,2.2rem)] font-[480] leading-[1.02] tracking-tight text-[var(--lg-text)]">{panel.title}</h3>
                  <p className="mt-3 max-w-[46ch] text-[0.9375rem] leading-relaxed text-[var(--lg-text-72)]">{panel.body}</p>
                  <div className="mt-6 flex justify-center">
                    <Panel />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    )
  }

  // ── Pinned CSS3D path (desktop) ─────────────────────────────────────
  return (
    <section ref={sectionRef} id="method" aria-label="The method in four disciplines" className="relative overflow-hidden bg-[var(--lg-surface)] text-[var(--lg-text)]">
      <div ref={stageRef} className="pillar-stage relative h-[100svh] overflow-hidden">
        <span ref={numeralRef} aria-hidden="true" className="pillar-numeral z-[0]">01</span>
        {header}
        {/* CSS3D mount — the panels' home */}
        <div ref={mountRef} className="absolute inset-0 z-[1]" aria-hidden="false" />
        {/* Portals into document-less roots; the CSS3D effect adopts them. */}
        {panelSlots.map((slot, i) => {
          const Panel = PANEL_COMPONENTS[i]
          return createPortal(<Panel />, slot)
        })}
        <p className="pointer-events-none absolute bottom-6 right-5 z-[2] font-mono text-[0.5625rem] uppercase tracking-[0.22em] text-[var(--lg-text-45)] sm:right-8">
          01–04 · Scroll
        </p>
      </div>
    </section>
  )
}
