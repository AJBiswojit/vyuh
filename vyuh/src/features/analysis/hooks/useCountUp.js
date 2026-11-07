import { useEffect, useState } from 'react'
import { durations } from '@/shared/lib/motion.js'
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion.js'

/** Count from zero to a data-owned target. Reduced motion lands immediately. @param {number} target */
export function useCountUp(target) {
  const reduced = usePrefersReducedMotion()
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (reduced) return undefined
    let frame = 0
    const start = performance.now()
    const duration = durations.expressive * 1000
    /** @param {number} time */
    const step = (time) => {
      const progress = Math.min(1, (time - start) / duration)
      const eased = 1 - (1 - progress) ** 3
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, reduced])
  return reduced ? target : Math.min(value, target)
}
