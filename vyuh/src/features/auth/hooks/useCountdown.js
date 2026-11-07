import { useEffect, useState } from 'react'
/**
 * A wall-clock countdown, not a decrement that drifts in a background tab.
 * @param {number} [deadline]
 */
export function useCountdown(deadline = 0) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!deadline) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [deadline])
  return Math.max(0, Math.ceil((deadline - now) / 1000))
}
/** @param {number} seconds */
export function formatCountdown(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
