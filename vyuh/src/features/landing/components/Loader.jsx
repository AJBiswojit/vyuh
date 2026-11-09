import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

/**
 * Two seconds, no skip button, no progress bar — the lattice assembles behind
 * the overlay while the wordmark sets itself down. Fades out, then unmounts.
 * `motion.assemble` 0 → 1 is scrubbed by this timeline and read by the canvas.
 */
export function Loader({ motion }) {
  const overlayRef = useRef(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const tl = gsap.timeline({ onComplete: () => setDone(true) })
    tl.to(motion.current, { assemble: 1, duration: 1.15, ease: 'power3.out', delay: 0.18 }, 0)
      .fromTo('.loader-word', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.78)
      .fromTo('.loader-sub', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.55, ease: 'power2.out' }, 1.18)
      .to(overlayRef.current, { autoAlpha: 0, duration: 0.65, ease: 'power2.inOut' }, 1.48)
    return () => tl.kill()
  }, [motion])

  if (done) return null
  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="fixed inset-0 z-[7] flex flex-col items-center justify-center bg-cinema-ink"
    >
      <p
        className="loader-word font-display text-cinema-paper"
        style={{
          fontSize: 'clamp(4rem, 14vw, 8.5rem)',
          lineHeight: 0.92,
          letterSpacing: '-0.045em',
          fontVariationSettings: "'SOFT' 0, 'WONK' 1, 'wght' 520",
        }}
      >
        Vyuh
      </p>
      <p className="loader-sub mt-5 font-mono text-[0.6875rem] uppercase tracking-widest text-cinema-paper opacity-60">
        by MediXO
      </p>
    </div>
  )
}
