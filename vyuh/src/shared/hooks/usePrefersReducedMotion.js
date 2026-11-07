import { useEffect, useState } from 'react'

/**
 * Reduced-motion preference as a boolean. Used where a component must do more
 * than CSS can express — swapping movement for a fade, or stopping a loop.
 * @returns {boolean}
 */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    /** @param {MediaQueryListEvent} event */
    const onChange = (event) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}
