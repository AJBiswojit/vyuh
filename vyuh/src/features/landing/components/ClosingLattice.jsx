import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import * as THREE from 'three'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { mulberry32, buildChakravyuh, readChannelToken } from './latticeGeometry.js'

/**
 * The coda's lattice — the formed chakravyuh, face-on, dissolving into
 * particles as the closing panel scrubs in. Absolute inside the closing
 * section (never fixed over the page); paused and hidden off-screen;
 * aria-hidden, pointer-events-none. Theme-aware: nodes carry the contrasting
 * ink/paper of whatever surface the coda is painted on, the same outer gate
 * node burning vermilion — the arrangement, seen one last time, scattering.
 */

const FOV = 45
const CAM_Z = 6.9

export function ClosingLattice({ motion, reduced, isMobile, resolvedTheme }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    gsap.registerPlugin(ScrollTrigger)
    const sectionEl = canvas.closest('[data-lattice-gate="closing"]')
    const rng = mulberry32(20261109)
    const count = isMobile ? 330 : 510
    const chakra = buildChakravyuh(count, rng)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 60)
    camera.position.set(0, 0, CAM_Z)

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch (error) {
      console.warn('[closing-lattice] WebGL unavailable — coda renders typographic only.', error)
      canvas.style.display = 'none'
      return undefined
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setSize(canvas.parentElement?.clientWidth || window.innerWidth, canvas.parentElement?.clientHeight || window.innerHeight)
    renderer.setClearColor(0x000000, 0)

    const isLight = resolvedTheme === 'light'
    const paperColor = readChannelToken('--vyuh-cinema-paper-rgb')
    const inkColor = readChannelToken('--vyuh-cinema-ink-rgb')
    const emberColor = readChannelToken('--vyuh-ember-rgb')
    const nodeBase = isLight ? inkColor : paperColor

    const sphere = new THREE.SphereGeometry(0.0335, 10, 8)
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 })
    const mesh = new THREE.InstancedMesh(sphere, mat, count)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    mesh.frustumCulled = false
    const colorScratch = new THREE.Color()
    for (let i = 0; i < count; i += 1) mesh.setColorAt(i, nodeBase.clone())
    scene.add(mesh)

    const outward = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const delays = new Float32Array(count)
    const spinDir = new Float32Array(count)
    const rNorm = new Float32Array(chakra.rNorm)
    const vec = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      vec.set(chakra.points[i][0], chakra.points[i][1], chakra.points[i][2]).normalize()
      outward.set([vec.x * (4.5 + rng() * 3.5), vec.y * (4.5 + rng() * 3.5) + rng() * 2, (rng() - 0.5) * 6], i * 3)
      phases[i] = rng() * Math.PI * 2
      delays[i] = rng() * 0.35
      spinDir[i] = Math.floor(rNorm[i] * 5.001) % 2 === 0 ? 1 : -1
    }

    // Same outer-gate ember node as the hero — one continuous "active" thread.
    let emberIndex = 0
    let emberBest = Number.POSITIVE_INFINITY
    for (let i = 0; i < count; i += 1) {
      if (rNorm[i] < 0.88) continue
      const angle = Math.abs(Math.atan2(chakra.points[i][1], chakra.points[i][0]))
      if (angle < emberBest) { emberBest = angle; emberIndex = i }
    }

    const group = new THREE.Group()
    group.add(mesh)
    group.scale.setScalar(isMobile ? 0.72 : 1)
    scene.add(group)
    if (import.meta.env.DEV) window.__closingLatticeDebug = { group, mesh, scene, camera, renderer, motionRef: motion }

    const gate = { closing: true }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target.dataset.latticeGate === 'closing') gate.closing = entry.isIntersecting
        }
      },
      { rootMargin: '25% 0px 25% 0px' },
    )
    if (sectionEl) observer.observe(sectionEl)

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

    const dummy = new THREE.Object3D()
    let raf = 0
    let lastRender = 0
    const clockStart = performance.now()

    const renderFrame = () => {
      const time = performance.now() - clockStart
      const dissolve = THREE.MathUtils.clamp(motion.current.dissolve, 0, 1)
      const wheelSpin = time * 0.00016

      mat.opacity = 1 - THREE.MathUtils.smoothstep(dissolve, 0.14, 0.94)

      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        let x = chakra.points[i][0]
        let y = chakra.points[i][1]
        let z = chakra.points[i][2]
        const spin = wheelSpin * spinDir[i] * (1.5 - rNorm[i] * 0.85)
        const cos = Math.cos(spin), sin = Math.sin(spin)
        const rx = x * cos - y * sin
        const ry = x * sin + y * cos
        x = rx; y = ry
        if (dissolve > 0) {
          const local = THREE.MathUtils.clamp((dissolve - delays[i] * 0.5) / (1 - 0.5 * delays[i]), 0, 1)
          const ease = local * local * (3 - 2 * local)
          x += outward[i3] * ease
          y += outward[i3 + 1] * ease
          z += outward[i3 + 2] * ease
        }
        const wave = Math.sin(time * 0.0011 - rNorm[i] * 5.3)
        const ripple = Math.max(0, wave)
        dummy.position.set(x, y, z)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.setScalar(1 + 0.18 * ripple * ripple + (1 - dissolve) * 0.05 * Math.sin(phases[i] + time * 0.0011))
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
        if (i === emberIndex) {
          mesh.setColorAt(i, colorScratch.copy(emberColor).multiplyScalar(0.8 + 0.35 * ripple))
        } else {
          mesh.setColorAt(i, colorScratch.copy(nodeBase).multiplyScalar(0.82 + ripple * 0.5))
        }
      }
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true

      renderer.render(scene, camera)
      lastRender = time
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!gate.closing) return
      if (reduced) {
        if (lastRender === 0) { renderFrame(); lastRender = performance.now() }
        return
      }
      renderFrame()
    }

    if (reduced) {
      motion.current.dissolve = 0 // reduced motion holds the formed wheel, no scatter
      renderFrame()
    } else {
      raf = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      observer.disconnect()
      sphere.dispose()
      mat.dispose()
      mesh.dispose()
      renderer.dispose()
    }
  }, [motion, reduced, isMobile, resolvedTheme])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] block h-full w-full"
    />
  )
}
