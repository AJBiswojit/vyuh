import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import * as THREE from 'three'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { mulberry32, buildFormation, buildChakravyuh, buildDust, readChannelToken } from './latticeGeometry.js'

/**
 * The hero's lattice — an InstancedMesh of ~500 nodes that flies in from a
 * scatter and snaps into a triple-chevron V while the loader fades. Scrolling
 * the hero scrubs the V apart and re-arranges every node, inner rings first,
 * into a chakravyuh — concentric rings, eight gates — that turns slowly on its
 * axis while a ripple of light travels outward. One node on the outer gate
 * burns vermilion: the gate the practice is currently moving through.
 *
 * The canvas is ABSOLUTE INSIDE THE PINNED HERO SECTION (never fixed over the
 * page): when the hero leaves, the canvas goes with it. ScrollTrigger's
 * onLeave / onEnterBack additionally hide it and the render loop pauses via an
 * IntersectionObserver, so no frame is drawn off-screen. aria-hidden and
 * pointer-events-none — the type is the experience; the lattice is the weather.
 */

const REDUCED_NODE_SCALE = 1
const FOV = 45
const CAM_Z = 8

export function LatticeScene({ motion, reduced, isMobile, resolvedTheme }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    gsap.registerPlugin(ScrollTrigger)
    const heroEl = canvas.closest('[data-lattice-gate="hero"]')
    const rng = mulberry32(20261109)
    const formationCount = isMobile ? 330 : 510
    const dustPoints = buildDust(rng)
    const vFormation = buildFormation(formationCount)
    const chakra = buildChakravyuh(formationCount, rng)
    const count = vFormation.length

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 60)
    camera.position.set(0, 0.55, CAM_Z)

    /** @type {THREE.WebGLRenderer} */
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch (error) {
      // No WebGL on this device/context: the page reads perfectly well as a
      // static typographic composition without the lattice. Fail invisible.
      console.warn('[lattice] WebGL unavailable — rendering static page.', error)
      canvas.style.display = 'none'
      return undefined
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setSize(canvas.parentElement?.clientWidth || window.innerWidth, canvas.parentElement?.clientHeight || window.innerHeight)
    renderer.setClearColor(0x000000, 0)

    // Theme-aware node colours. Ink nodes on paper (light), paper nodes on ink
    // (dark); ember is identical in both. Read once per mount — the effect
    // re-runs on theme change and rebuilds the scene.
    const isLight = resolvedTheme === 'light'
    const paperColor = readChannelToken('--vyuh-cinema-paper-rgb')
    const inkColor = readChannelToken('--vyuh-cinema-ink-rgb')
    const emberColor = readChannelToken('--vyuh-ember-rgb')
    const nodeBase = isLight ? inkColor : paperColor

    // ── Formation mesh ───────────────────────────────────────────────
    const sphere = new THREE.SphereGeometry(0.0335, 10, 8)
    const formationMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, // per-node tint lives in instanceColor (pulse)
      transparent: true,
      opacity: 1,
    })
    const formationMesh = new THREE.InstancedMesh(sphere, formationMat, count)
    formationMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    formationMesh.frustumCulled = false
    const colorScratch = new THREE.Color()
    for (let i = 0; i < count; i += 1) {
      formationMesh.setColorAt(i, nodeBase.clone())
    }
    scene.add(formationMesh)

    const dustGeo = new THREE.SphereGeometry(0.0225, 6, 5)
    const dustMat = new THREE.MeshBasicMaterial({ color: nodeBase.clone(), transparent: true, opacity: 0.3 })
    const dustMesh = new THREE.InstancedMesh(dustGeo, dustMat, dustPoints.length)
    dustMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage)
    dustMesh.frustumCulled = false
    scene.add(dustMesh)

    // Per-node random start (scatter sphere), dual targets (V / chakravyuh),
    // phases, morph metadata.
    const starts = new Float32Array(count * 3)
    const targets = new Float32Array(count * 3)
    const chakraTargets = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const rNorm = new Float32Array(chakra.rNorm)
    const morphDelay = new Float32Array(count)
    const spinDir = new Float32Array(count)
    const coreR = new Float32Array(count)
    const coreTheta = new Float32Array(count)
    const gateBoost = chakra.gateBoost
    const vec = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      vec.set(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize().multiplyScalar(3.6 + rng() * 2.4)
      starts.set([vec.x, vec.y, vec.z], i * 3)
      targets.set(vFormation[i], i * 3)
      chakraTargets.set(chakra.points[i], i * 3)
      phases[i] = rng() * Math.PI * 2
      morphDelay[i] = rNorm[i] * 0.26 // rings man themselves outward, hub first
      spinDir[i] = Math.floor(rNorm[i] * 5.001) % 2 === 0 ? 1 : -1 // alternate rings counter-rotate
      coreR[i] = 0.3 * Math.sqrt(rng()) // the command hub
      coreTheta[i] = rng() * Math.PI * 2
    }

    // The active node — the outer-rim gate nearest the 0° gate line. It burns
    // ember from the moment the wheel forms; before that it glows through the
    // implosion like every other node.
    let emberIndex = 0
    let emberBest = Number.POSITIVE_INFINITY
    for (let i = 0; i < count; i += 1) {
      if (rNorm[i] < 0.88) continue
      const angle = Math.abs(Math.atan2(chakraTargets[i * 3 + 1], chakraTargets[i * 3]))
      if (angle < emberBest) { emberBest = angle; emberIndex = i }
    }

    // ── Dust matrices are static, set once ───────────────────────────
    const dummy = new THREE.Object3D()
    for (let i = 0; i < dustPoints.length; i++) {
      dummy.position.set(dustPoints[i][0], dustPoints[i][1], dustPoints[i][2])
      dummy.scale.setScalar(1)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      dustMesh.setMatrixAt(i, dummy.matrix)
    }
    dustMesh.instanceMatrix.needsUpdate = true

    const group = new THREE.Group()
    scene.add(group)
    // Attach FIRST, THEN position — attach() bakes any pre-set parent transform
    // into the children, which would silently cancel the offset below.
    group.attach(formationMesh); group.attach(dustMesh)
    group.position.set(isMobile ? 0 : 2.15, isMobile ? 2.55 : 0.7, 0)
    if (isMobile) group.scale.setScalar(0.58) // keep the formation clear of the type on narrow screens
    // DEBUG-CAPTURE: dev-only introspection handle for headless probes.
    if (import.meta.env.DEV) window.__latticeDebug = { group, formationMesh, dustMesh, scene, camera, renderer, motionRef: motion }

    // ── Pause rendering when the hero is off screen ──────────────────
    const gate = { hero: true }
    const gateObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target.dataset.latticeGate === 'hero') gate.hero = entry.isIntersecting
        }
      },
      { rootMargin: '25% 0px 25% 0px' },
    )
    if (heroEl) gateObserver.observe(heroEl)

    // ── Hide the moment the pinned hero releases ─────────────────────
    const showCanvas = () => { canvas.style.opacity = '1'; canvas.style.visibility = 'visible' }
    const hideCanvas = () => { canvas.style.opacity = '0'; canvas.style.visibility = 'hidden' }
    let leaveTrigger = null
    if (heroEl) {
      leaveTrigger = ScrollTrigger.create({
        trigger: heroEl,
        start: 'top top',
        end: '+=200%',
        onLeave: hideCanvas,
        onEnterBack: showCanvas,
      })
    }

    // ── Pointer parallax (hero only) ─────────────────────────────────
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    const onPointerMove = (event) => {
      if (isMobile) return
      pointer.tx = (event.clientX / window.innerWidth) * 2 - 1
      pointer.ty = (event.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    const onResize = () => {
      const width = canvas.parentElement?.clientWidth || window.innerWidth
      const height = canvas.parentElement?.clientHeight || window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      renderer.setSize(width, height)
      if (reduced) renderer.render(scene, camera)
    }
    window.addEventListener('resize', onResize)

    // ── Frame loop ───────────────────────────────────────────────────
    let raf = 0
    let lastRender = 0
    const clockStart = performance.now()
    const baseColor = new THREE.Color()

    const renderFrame = () => {
      const time = performance.now() - clockStart
      const m = motion.current
      const a = THREE.MathUtils.clamp(m.assemble, 0, 1)
      const hero = THREE.MathUtils.clamp(m.hero, 0, 1)

      // V → chakravyuh, told in two beats: the formation breaks inward onto a
      // spinning command hub (tA), then releases outward ring by ring (tB).
      const tA = THREE.MathUtils.smoothstep(hero, 0.1, 0.4)
      const wheel = THREE.MathUtils.smoothstep(hero, 0.25, 0.8) // facing, recentre, ripple

      // Camera: dolly in and settle as the hero scrubs.
      camera.position.z = THREE.MathUtils.lerp(8.6, 7.15, hero)
      camera.position.y = THREE.MathUtils.lerp(0.55, 0.12, hero)

      // Group: rotate, tilt; pointer parallax ±0.1 rad (lerped).
      pointer.x = THREE.MathUtils.lerp(pointer.x, pointer.tx * 0.1, 0.055)
      pointer.y = THREE.MathUtils.lerp(pointer.y, pointer.ty * 0.1, 0.055)
      group.rotation.y = (hero * 1.18 + pointer.x) * (1 - wheel * 0.88)
      group.rotation.x = (-0.07 + hero * 0.36 + pointer.y) * (1 - wheel) + 0.05 * wheel
      group.position.x = isMobile ? 0 : THREE.MathUtils.lerp(2.15, 1.12, wheel)
      group.position.y = isMobile ? THREE.MathUtils.lerp(2.55, 2.4, wheel) : THREE.MathUtils.lerp(0.7, 0.62, wheel)

      // The lattice holds until the wheel has formed, then releases — a
      // faint residue remains through the pin's last stretch so the exit
      // never reads as an empty frame.
      const heroFade = 1 - THREE.MathUtils.smoothstep(hero, 0.8, 1.0) * 0.82
      formationMat.opacity = heroFade
      dustMat.color.copy(nodeBase)
      dustMat.opacity = 0.3 * heroFade * (1 - wheel * 0.55)
      baseColor.copy(nodeBase)

      // The wheel turns — slowly on its own, emphatically under the scroll,
      // with a whip of acceleration through the implosion at mid-morph.
      const wheelSpin = hero * 2.6 + time * 0.00014 + Math.sin(tA * Math.PI) * 1.1

      const breath = 0.045
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const sx = starts[i3], sy = starts[i3 + 1], sz = starts[i3 + 2]
        // Beat A — the V breaks inward onto the hub.
        const coreX = coreR[i] * Math.cos(coreTheta[i])
        const coreY = coreR[i] * Math.sin(coreTheta[i])
        let x = targets[i3] + (coreX - targets[i3]) * tA
        let y = targets[i3 + 1] + (coreY - targets[i3 + 1]) * tA
        let z = targets[i3 + 2] + (1.0 - targets[i3 + 2]) * tA
        // Beat B — the hub releases outward into concentric rings, inner first.
        const tB = THREE.MathUtils.smoothstep(hero, 0.32 + morphDelay[i], 0.55 + morphDelay[i])
        const ix = chakraTargets[i3]
        const iy = chakraTargets[i3 + 1]
        const iz = chakraTargets[i3 + 2]
        x += (ix - x) * tB
        y += (iy - y) * tB
        z += (iz - z) * tB
        // Assemble from the scatter sphere.
        const invA = 1 - a
        x = sx * invA + x * a
        y = sy * invA + y * a
        z = sz * invA + z * a
        // In-plane wheel spin: alternate rings counter-rotate, inner faster.
        if (wheel > 0.001) {
          const spin = wheelSpin * spinDir[i] * (1.5 - rNorm[i] * 0.85) * wheel
          const cos = Math.cos(spin), sin = Math.sin(spin)
          const rx = x * cos - y * sin
          const ry = x * sin + y * cos
          x = rx
          y = ry
        }
        if (a > 0.85) {
          const k = (a - 0.85) / 0.15
          y += Math.sin(time * 0.0011 + phases[i]) * breath * k
          x += Math.cos(time * 0.0009 + phases[i] * 1.7) * breath * k
        }
        // Ripple of light travelling outward through the rings — scroll-led.
        const wave = Math.sin(hero * 9.5 - rNorm[i] * 5.3 + time * 0.0011)
        const gatePulse = Math.max(0, wave)
        // The implosion flares hot at its densest, then dims to a readable wheel.
        const flash = Math.sin(Math.PI * Math.min(tA, 1)) * (1 - tB)
        dummy.position.set(x, y, z)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.setScalar(
          REDUCED_NODE_SCALE *
            gateBoost[i] *
            (1 + 0.5 * flash + 0.18 * gatePulse * gatePulse * wheel),
        )
        dummy.updateMatrix()
        formationMesh.setMatrixAt(i, dummy.matrix)
        if (i === emberIndex) {
          // The active gate burns ember through the whole morph.
          const emberPulse = 0.78 + 0.22 * Math.sin(time * 0.0021) + 0.4 * gatePulse * wheel
          formationMesh.setColorAt(i, colorScratch.copy(emberColor).multiplyScalar(emberPulse * (1 + flash * 0.9)))
        } else {
          // Ring brightness: hot core while imploding, calm disc with a travelling wave.
          const brightness = 1 - wheel * 0.18 + wheel * gatePulse * 0.55 + flash * 1.35
          formationMesh.setColorAt(i, colorScratch.copy(baseColor).multiplyScalar(brightness))
        }
      }
      formationMesh.instanceMatrix.needsUpdate = true
      if (formationMesh.instanceColor) formationMesh.instanceColor.needsUpdate = true

      renderer.render(scene, camera)
      lastRender = time
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!gate.hero) return
      if (reduced) {
        // Static end state: one frame is enough, re-render only on demand.
        if (lastRender === 0) { renderFrame(); lastRender = performance.now() }
        return
      }
      renderFrame()
    }

    if (reduced) {
      // Reduced motion: assemble jumps to the formed lattice, no scrub anywhere.
      motion.current.assemble = 1
      renderFrame()
    } else {
      raf = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('resize', onResize)
      gateObserver.disconnect()
      if (leaveTrigger) leaveTrigger.kill()
      sphere.dispose()
      dustGeo.dispose()
      formationMat.dispose()
      dustMat.dispose()
      formationMesh.dispose()
      dustMesh.dispose()
      // No forceContextLoss: React StrictMode double-mounts in dev, and a lost
      // context can never be re-acquired by the canvas below.
      renderer.dispose()
    }
    // Theme flips rebuild the scene — cheap (500 nodes), and guarantees the
    // materials never hold stale colours.
  }, [motion, reduced, isMobile, resolvedTheme])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] block h-full w-full transition-opacity duration-500"
    />
  )
}
