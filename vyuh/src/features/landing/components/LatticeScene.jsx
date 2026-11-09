import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * One canvas, one renderer, three jobs.
 *
 *   1. Formation — an InstancedMesh of ~500 nodes that flies in from scattered
 *      positions and snaps into a crisp triple-chevron V while the loader fades.
 *      Scrolling the hero scrubs the V apart and re-arranges every node,
 *      inner rings first, into a chakravyuh — concentric rings, eight gates,
 *      an eightfold salience of order — that turns slowly on its axis while
 *      a ripple of light travels outward through the rings. The lattice is the
 *      product's motto made visible: an arrangement, deliberate ring by ring.
 *      A second, fainter InstancedMesh is a static background lattice grid.
 *   2. Rotation — the same `motion.hero` ScrollTrigger (0 → 1) dollies the
 *      camera, rotates the group into a face-on wheel, and counter-rotates
 *      alternate rings. Pointer adds ±0.1 rad (lerped).
 *   3. Dissolution — the closing ScrollTrigger writes `motion.dissolve`
 *      (0 → 1): nodes scatter outward and the material lerps from paper
 *      to ink, so the particles read on the paper background behind.
 *
 * The canvas is fixed, aria-hidden, pointer-events-none, and sits above the
 * section backgrounds (z 5) and below the nav and grain. Rendering pauses
 * unless a gated section is on screen — hero, pillars, or closing.
 */

const REDUCED_NODE_SCALE = 1
const FOV = 45
const CAM_Z = 8

/** Deterministic pseudo-random so every visit arranges the same lattice. */
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Triple chevron, cut precisely: three nested V-strokes. Nodes are spaced by
 * arc length along each stroke (even density, no clumping) with sub-pixel
 * jitter, so the mark reads as one deliberate instrument, not a scatter.
 */
function buildFormation(count) {
  const strokes = [
    { apexY: -1.7, spread: 3.35, rise: 4.6, z: -0.15 },
    { apexY: -1.15, spread: 2.35, rise: 3.2, z: 0.35 },
    { apexY: -0.62, spread: 1.45, rise: 2.05, z: 0.85 },
  ]
  // Each stroke is two straight arms (apex → arm tip). Allocate nodes
  // proportionally to total arm length so every arc segment holds equal density.
  const armLength = (s) => Math.hypot(s.spread, s.rise)
  const totalArm = strokes.reduce((sum, s) => sum + 2 * armLength(s), 0)
  const points = []
  strokes.forEach((stroke, i) => {
    const nStroke = Math.max(2, Math.round((count * 2 * armLength(stroke)) / totalArm))
    const nArm = Math.floor(nStroke / 2)
    for (let arm = 0; arm < 2; arm += 1) {
      const side = arm === 0 ? 1 : -1
      for (let j = 0; j < nArm; j += 1) {
        const t = (j + 0.5) / nArm // 0 at the apex, 1 at the arm tip
        points.push([
          side * t * stroke.spread,
          stroke.apexY + t * stroke.rise,
          stroke.z,
        ])
      }
    }
  })
  // Arc-length allocation can land a node or two short of `count`; top up by
  // re-tracing the outermost stroke's mid-arm region deterministically.
  let k = 0
  while (points.length < count) {
    const stroke = strokes[0]
    const t = 0.3 + 0.4 * ((k % 17) / 16)
    const side = k % 2 === 0 ? 1 : -1
    points.push([side * t * stroke.spread, stroke.apexY + t * stroke.rise, stroke.z])
    k += 1
  }
  return points.slice(0, count)
}

/**
 * The chakravyuh — a wheel of concentric rings broken by eight gates.
 * Geometry: a hub disc, five concentric rings (density ∝ circumference),
 * a doubled outer rim, and eight radial spokes (the gates). Nodes carry
 * their normalised radius [0,1] so the morph can build outward ring by
 * ring and the wheel can counter-rotate alternate rings.
 */
function buildChakravyuh(count, rng) {
  const RING_RADII = [0.42, 0.82, 1.22, 1.62, 2.0]
  const RIM_RADIUS = 2.14
  const SPOKES = 8
  const HUB_RADIUS = 0.27
  const points = []
  const meta = [] // normalised radius per point
  const push = (x, y, z, rNorm) => {
    points.push([x, y, z])
    meta.push(rNorm)
  }
  // Hub — a small filled disc, denser at centre (spiral seat of the wheel).
  const hubCount = 19
  for (let i = 0; i < hubCount; i += 1) {
    const r = HUB_RADIUS * Math.sqrt((i + 0.5) / hubCount)
    const theta = i * 2.399963 // golden angle — no visible rows
    push(r * Math.cos(theta), r * Math.sin(theta), 1.15, r / RIM_RADIUS)
  }
  // Rings — even arc spacing.
  const ringSpacing = 0.121
  for (const radius of RING_RADII) {
    const n = Math.max(8, Math.round((2 * Math.PI * radius) / ringSpacing))
    for (let i = 0; i < n; i += 1) {
      const theta = (i / n) * Math.PI * 2
      push(radius * Math.cos(theta), radius * Math.sin(theta), 0.35 + (radius / RIM_RADIUS) * 0.5, radius / RIM_RADIUS)
    }
  }
  // Doubled outer rim — the perimeter the wheel defends.
  for (const radius of [RIM_RADIUS, RIM_RADIUS + 0.14]) {
    const n = Math.round((2 * Math.PI * radius) / (ringSpacing * 1.12))
    for (let i = 0; i < n; i += 1) {
      const theta = (i / n) * Math.PI * 2
      push(radius * Math.cos(theta), radius * Math.sin(theta), 0.95, radius / RIM_RADIUS)
    }
  }
  // Eight gates — radial spokes of nodes crossing every ring.
  for (let s = 0; s < SPOKES; s += 1) {
    const theta = (s / SPOKES) * Math.PI * 2
    const n = 11
    for (let i = 0; i < n; i += 1) {
      const r = HUB_RADIUS + ((i + 0.5) / n) * (RIM_RADIUS - HUB_RADIUS)
      push(r * Math.cos(theta), r * Math.sin(theta), 0.75, r / RIM_RADIUS)
    }
  }
  // Shuffle deterministically, then select exactly `count` nodes so the
  // wheel is a true subset of the geometry, never a truncated slice.
  const order = points.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const picked = order.slice(0, Math.min(count, order.length))
  const outPoints = picked.map((i) => points[i])
  const outMeta = picked.map((i) => meta[i])
  // Top up (small counts) by re-using hub points — invisible at this density.
  let k = 0
  while (outPoints.length < count) {
    const p = outPoints[k % outPoints.length]
    outPoints.push([p[0] * 0.98, p[1] * 0.98, p[2]])
    outMeta.push(outMeta[k % outMeta.length])
    k += 1
  }
  // Gate boost: outermost nodes aligned (within 0.16 rad) to an 8-fold gate angle.
  const gateBoost = new Float32Array(outPoints.length).fill(1)
  for (let i = 0; i < outPoints.length; i += 1) {
    const [x, y] = outPoints[i]
    const r = Math.hypot(x, y)
    if (r < 1.68) continue
    const theta = Math.atan2(y, x)
    const gate = Math.PI / 4
    const nearest = Math.round(theta / gate) * gate
    if (Math.abs(theta - nearest) < 0.16) gateBoost[i] = 1.38
  }
  return { points: outPoints, rNorm: outMeta, gateBoost }
}

/** Faint background lattice: points on a regular 3-plane grid. */
function buildDust(rng) {
  const points = []
  for (const z of [-1.7, -0.7, 0.3]) {
    for (let gx = -5; gx <= 5; gx++) {
      for (let gy = -3; gy <= 3; gy++) {
        points.push([gx * 1.05 + (rng() - 0.5) * 0.3, gy * 0.92 + (rng() - 0.5) * 0.3, z + (rng() - 0.5) * 0.3])
      }
    }
  }
  return points
}

function readChannelToken(name) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const [r, g, b] = raw.split(/\s+/).map((v) => Number.parseFloat(v) / 255)
  return new THREE.Color(r || 0, g || 0, b || 0)
}

export function LatticeScene({ motion, reduced, isMobile }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
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
      // No WebGL on this device/context: the landing reads perfectly well as a
      // static typographic page — every section is opaque and legible without
      // the lattice, so the failure is invisible instead of fatal.
      console.warn('[lattice] WebGL unavailable — rendering static page.', error)
      canvas.style.display = 'none'
      return undefined
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)

    const paperColor = readChannelToken('--vyuh-cinema-paper-rgb')
    const inkColor = readChannelToken('--vyuh-cinema-ink-rgb')

    // ── Formation mesh ───────────────────────────────────────────────
    const sphere = new THREE.SphereGeometry(0.0335, 10, 8)
    const formationMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, // per-node tint lives in instanceColor (pulse + paper→ink dissolve)
      transparent: true,
      opacity: 1,
    })
    const formationMesh = new THREE.InstancedMesh(sphere, formationMat, count)
    formationMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    formationMesh.frustumCulled = false
    const colorScratch = new THREE.Color()
    for (let i = 0; i < count; i += 1) {
      formationMesh.setColorAt(i, paperColor.clone())
    }
    scene.add(formationMesh)

    const dustGeo = new THREE.SphereGeometry(0.0225, 6, 5)
    const dustMat = new THREE.MeshBasicMaterial({ color: paperColor.clone(), transparent: true, opacity: 0.3 })
    const dustMesh = new THREE.InstancedMesh(dustGeo, dustMat, dustPoints.length)
    dustMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage)
    dustMesh.frustumCulled = false
    scene.add(dustMesh)

    // Per-node random start (scatter sphere), dual targets (V / chakravyuh),
    // scatter-out dirs, phases, morph metadata.
    const starts = new Float32Array(count * 3)
    const targets = new Float32Array(count * 3)
    const chakraTargets = new Float32Array(count * 3)
    const outward = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const delays = new Float32Array(count)
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
      vec.set(chakraTargets[i * 3], chakraTargets[i * 3 + 1], chakraTargets[i * 3 + 2]).normalize() // wheel formed by then — scatter radially from the chakra
      outward.set([vec.x * (4.5 + rng() * 3.5), vec.y * (4.5 + rng() * 3.5) + rng() * 2, vec.z + (rng() - 0.5) * 6], i * 3)
      phases[i] = rng() * Math.PI * 2
      delays[i] = rng() * 0.35
      morphDelay[i] = rNorm[i] * 0.26 // rings man themselves outward, hub first
      spinDir[i] = Math.floor(rNorm[i] * 5.001) % 2 === 0 ? 1 : -1 // alternate rings counter-rotate
      coreR[i] = 0.3 * Math.sqrt(rng()) // the command hub — every node collapses onto it…
      coreTheta[i] = rng() * Math.PI * 2
    }

    // ── Pillar objects ───────────────────────────────────────────────
    // Wireframe studies on the Method panels: cube, sphere, torus knot, ring.
    // The knot carries the page's vermilion accent on ink.
    const emberColor = new THREE.Color(228 / 255, 87 / 255, 46 / 255)
    const pillarGeos = [
      new THREE.BoxGeometry(1.15, 1.15, 1.15),
      new THREE.SphereGeometry(0.74, 18, 12),
      new THREE.TorusKnotGeometry(0.5, 0.155, 110, 12),
      new THREE.TorusGeometry(0.68, 0.155, 12, 72),
    ]
    const pillarMats = pillarGeos.map((_, i) =>
      new THREE.MeshBasicMaterial({
        color: i === 2 ? emberColor : paperColor.clone(),
        wireframe: true,
        transparent: true,
        opacity: 0,
      }),
    )
    const pillarMeshes = pillarGeos.map((geometry, i) => {
      const mesh = new THREE.Mesh(geometry, pillarMats[i])
      mesh.visible = false
      if (isMobile) mesh.scale.setScalar(0.72) // portrait frustum: same world size fills too much
      scene.add(mesh)
      return mesh
    })
    const pillarEls = () => [...document.querySelectorAll('[data-pillar-panel]')]

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
    // Attach FIRST (group at the origin, so children keep their world-built
    // V lattice), THEN position — attach() bakes any pre-set parent transform
    // into the children, which would silently cancel the offset below.
    group.attach(formationMesh); group.attach(dustMesh)
    group.position.set(isMobile ? 0 : 2.15, isMobile ? 2.55 : 0.7, 0)
    if (isMobile) group.scale.setScalar(0.58) // keep the formation clear of the type on narrow screens
    // DEBUG-CAPTURE: dev-only introspection handle for headless probes.
    if (import.meta.env.DEV) window.__latticeDebug = { group, formationMesh, dustMesh, scene, camera, renderer, motionRef: motion }
    // Pillar objects stay in world space so panel coordinates map directly.

    // ── Gating: render only while a lattice section is on screen ─────
    const gate = { hero: true, method: false, closing: false }
    const gateObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const key = entry.target.dataset.latticeGate
          if (key && key in gate) gate[key] = entry.isIntersecting
        }
      },
      { rootMargin: '25% 0px 25% 0px' },
    )
    document.querySelectorAll('[data-lattice-gate]').forEach((el) => gateObserver.observe(el))

    // ── Pointer parallax (hero only) ─────────────────────────────────
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    const onPointerMove = (event) => {
      if (isMobile) return
      pointer.tx = (event.clientX / window.innerWidth) * 2 - 1
      pointer.ty = (event.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      renderer.setSize(window.innerWidth, window.innerHeight)
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
      const dissolve = THREE.MathUtils.clamp(m.dissolve, 0, 1)

      // V → chakravyuh, told in two beats: the formation breaks inward onto a
      // spinning command hub (tA), then releases outward ring by ring (tB) —
      // deliberate practice as an executable, not an explosion.
      const tA = THREE.MathUtils.smoothstep(hero, 0.1, 0.4)
      const wheel = THREE.MathUtils.smoothstep(hero, 0.25, 0.8) // facing, recentre, ripple

      // Camera: dolly in and settle as the hero scrubs.
      camera.position.z = THREE.MathUtils.lerp(8.6, 7.15, hero)
      camera.position.y = THREE.MathUtils.lerp(0.55, 0.12, hero)

      // Group: rotate, tilt; pointer parallax ±0.1 rad (lerped). The V pose
      // shows three-quarter depth; by full formation the wheel turns face-on,
      // re-centred toward the frame's open right-of-type.
      pointer.x = THREE.MathUtils.lerp(pointer.x, pointer.tx * 0.1, 0.055)
      pointer.y = THREE.MathUtils.lerp(pointer.y, pointer.ty * 0.1, 0.055)
      group.rotation.y = (hero * 1.18 + pointer.x) * (1 - wheel * 0.88)
      group.rotation.x = (-0.07 + hero * 0.36 + pointer.y) * (1 - wheel) + 0.05 * wheel
      group.position.x = isMobile ? 0 : THREE.MathUtils.lerp(2.15, 1.12, wheel)
      group.position.y = isMobile ? THREE.MathUtils.lerp(2.55, 2.4, wheel) : THREE.MathUtils.lerp(0.7, 0.62, wheel)

      // The lattice holds until the wheel has formed, then releases.
      const heroFade = 1 - THREE.MathUtils.smoothstep(hero, 0.8, 1.0)
      // Dissolve: nodes scatter outward and turn ink for the paper background.
      const inkMix = THREE.MathUtils.clamp(dissolve * 2.1, 0, 1)
      formationMat.opacity = heroFade * (1 - THREE.MathUtils.smoothstep(dissolve, 0.14, 0.94))
      dustMat.color.copy(paperColor).lerp(inkColor, inkMix)
      dustMat.opacity = 0.3 * heroFade * (1 - wheel * 0.55) * (1 - THREE.MathUtils.smoothstep(dissolve, 0.05, 0.6))
      baseColor.copy(paperColor).lerp(inkColor, inkMix)

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
          y += Math.sin(time * 0.0011 + phases[i]) * breath * k * (1 - dissolve)
          x += Math.cos(time * 0.0009 + phases[i] * 1.7) * breath * k * (1 - dissolve)
        }
        if (dissolve > 0) {
          const local = THREE.MathUtils.clamp((dissolve - delays[i] * 0.5) / (1 - 0.5 * delays[i]), 0, 1)
          const ease = local * local * (3 - 2 * local)
          x += outward[i3] * ease
          y += outward[i3 + 1] * ease
          z += outward[i3 + 2] * ease
        }
        // Ripple of light travelling outward through the rings — scroll-led.
        const wave = Math.sin(hero * 9.5 - rNorm[i] * 5.3 + time * 0.0011)
        const gatePulse = Math.max(0, wave)
        // The implosion flares white at its densest, then dims to a readable wheel.
        const flash = Math.sin(Math.PI * Math.min(tA, 1)) * (1 - tB)
        dummy.position.set(x, y, z)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.setScalar(
          REDUCED_NODE_SCALE *
            gateBoost[i] *
            (1 - dissolve * 0.35) *
            (1 + 0.5 * flash + 0.18 * gatePulse * gatePulse * wheel),
        )
        dummy.updateMatrix()
        formationMesh.setMatrixAt(i, dummy.matrix)
        // Ring brightness: hot core while imploding, calm disc with a travelling wave.
        const brightness = 1 - wheel * 0.18 + wheel * gatePulse * 0.55 + flash * 1.35
        formationMesh.setColorAt(i, colorScratch.copy(baseColor).multiplyScalar(brightness))
      }
      formationMesh.instanceMatrix.needsUpdate = true
      if (formationMesh.instanceColor) formationMesh.instanceColor.needsUpdate = true

      // Pillar objects: positions track their panels every frame — horizontal
      // translate on desktop, vertical stack on mobile — so one renderer serves both.
      const panels = pillarEls()
      for (let i = 0; i < pillarMeshes.length; i++) {
        const mesh = pillarMeshes[i]
        const el = panels[i]
        if (!el) { mesh.visible = false; continue }
        const rect = el.getBoundingClientRect()
        const onScreen = rect.bottom > 40 && rect.top < window.innerHeight - 40
        if (!onScreen) { mesh.visible = false; pillarMats[i].opacity = 0; continue }
        mesh.visible = true
        const halfH = Math.tan((FOV / 2) * (Math.PI / 180)) * camera.position.z
        const halfW = halfH * camera.aspect
        const cx = rect.left + rect.width * (isMobile ? 0.5 : 0.72)
        const cy = rect.top + rect.height * (isMobile ? 0.38 : 0.34)
        const nx = (cx / window.innerWidth) * 2 - 1
        const ny = -((cy / window.innerHeight) * 2 - 1)
        mesh.position.set(nx * halfW, ny * halfH, 0)
        const spin = reduced ? 0.55 + i * 0.62 : m.pillars * 0.9 + i * 0.9
        mesh.rotation.y = spin
        mesh.rotation.x = reduced ? 0.32 : m.pillars * 0.55 + i * 0.35
        mesh.rotation.z = reduced ? -0.12 : m.pillars * 0.28
        // Fade with horizontal/vertical overlap so off-screen panels cost nothing.
        const visibleW = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0))
        const overlap = visibleW / Math.max(1, rect.width)
        pillarMats[i].opacity = THREE.MathUtils.clamp(overlap * (reduced ? 0.9 : 0.95), 0, 0.95)
      }

      renderer.render(scene, camera)
      lastRender = time
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const anyGate = gate.hero || gate.method || gate.closing
      const pillarsWarm = gate.method
      if (!anyGate && !pillarsWarm) return
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
      sphere.dispose()
      dustGeo.dispose()
      pillarGeos.forEach((geo) => geo.dispose())
      formationMat.dispose()
      dustMat.dispose()
      pillarMats.forEach((mat) => mat.dispose())
      formationMesh.dispose()
      dustMesh.dispose()
      // No forceContextLoss: React StrictMode double-mounts in dev, and a lost
      // context can never be re-acquired by the canvas below. dispose() frees
      // GL resources; the element keeps a working context for the remount.
      renderer.dispose()
    }
  }, [motion, reduced, isMobile])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[5] block h-full w-full"
    />
  )
}
