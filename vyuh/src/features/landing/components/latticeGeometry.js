import * as THREE from 'three'

/**
 * Shared geometry for the landing's lattice scenes (hero + closing).
 * Deterministic so every visit arranges the same formation.
 */

/** Deterministic pseudo-random so every visit arranges the same lattice. */
export function mulberry32(seed) {
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
export function buildFormation(count) {
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
export function buildChakravyuh(count, rng) {
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
export function buildDust(rng) {
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

export function readChannelToken(name) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const [r, g, b] = raw.split(/\s+/).map((v) => Number.parseFloat(v) / 255)
  return new THREE.Color(r || 0, g || 0, b || 0)
}

