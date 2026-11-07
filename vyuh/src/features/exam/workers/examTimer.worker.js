/** Exam timer worker. The deadline is server epoch milliseconds; the client
 * clock is corrected by the mock/server offset. Interval throttling cannot
 * accumulate drift because every tick recomputes from the absolute deadline.
 */

/** @param {number} deadlineAt @param {number} clientNow @param {number} offsetMs */
export function remainingSeconds(deadlineAt, clientNow, offsetMs) {
  return Math.max(0, Math.ceil((deadlineAt - (clientNow + offsetMs)) / 1000))
}

/** @param {{ deadlineAt: number, offsetMs: number }} config */
export function createTimerTick(config) {
  return () => {
    const now = Date.now()
    const remaining = remainingSeconds(config.deadlineAt, now, config.offsetMs)
    return { type: /** @type {const} */ ('tick'), remainingSeconds: remaining, serverNow: now + config.offsetMs }
  }
}

if (typeof window === 'undefined' && typeof self !== 'undefined') {
  /** @type {ReturnType<typeof setInterval> | null} */
  let interval = null
  self.onmessage = (/** @type {MessageEvent<{ type: string, deadlineAt?: number, offsetMs?: number }>} */ event) => {
    const message = event.data
    if (message.type === 'stop') {
      if (interval) clearInterval(interval)
      interval = null
      return
    }
    if (message.type !== 'start' || typeof message.deadlineAt !== 'number') return
    if (interval) clearInterval(interval)
    const tick = createTimerTick({ deadlineAt: message.deadlineAt, offsetMs: message.offsetMs ?? 0 })
    self.postMessage(tick())
    interval = setInterval(() => {
      const payload = tick()
      self.postMessage(payload)
      if (payload.remainingSeconds === 0 && interval) { clearInterval(interval); interval = null }
    }, 250)
  }
}
