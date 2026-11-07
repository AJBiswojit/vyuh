/**
 * Mock realtime transport. This is the only place Phase 6 schedules live events.
 * Timers, clock and RNG are injectable so unit tests can prove the 8–15 minute
 * random interval and the 15-second response window without waiting for them.
 *
 * @typedef {import('../contracts/learning.js').LearningEvent} LearningEvent
 * @typedef {import('../contracts/learning.js').AttendancePolicy} AttendancePolicy
 * @typedef {import('../contracts/learning.js').ChatMessage} ChatMessage
 * @typedef {(event: LearningEvent) => void} Listener
 */

/** Small typed pub/sub. Returns an unsubscribe function; emitting never mutates payloads. */
export function createEventEmitter() {
  /** @type {Set<Listener>} */
  const listeners = new Set()
  return {
    /** @param {Listener} listener */
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    /** @param {LearningEvent} event */
    emit(event) {
      const payload = structuredClone(event)
      for (const listener of [...listeners]) listener(payload)
    },
    get size() { return listeners.size },
    clear() { listeners.clear() },
  }
}

/**
 * Inclusive random integer in [min, max]. Exposed for policy tests.
 * @param {() => number} random
 * @param {number} min
 * @param {number} max
 */
export function randomBetween(random, min, max) {
  const low = Math.ceil(Math.min(min, max))
  const high = Math.floor(Math.max(min, max))
  return low + Math.floor(Math.min(0.999999, Math.max(0, random())) * (high - low + 1))
}

/**
 * @typedef {Object} ClassChannelOptions
 * @property {string} sessionId
 * @property {AttendancePolicy} policy
 * @property {{author:string,role:'student'|'faculty',body:string}[]} chatScript
 * @property {(seconds:number)=>void} onPresenceTick
 * @property {(message:ChatMessage)=>void} onChat
 * @property {(challenge:import('../contracts/learning.js').AttentionChallenge)=>void} onAttentionChallenge
 * @property {(checkId:string)=>void} onAttentionExpired
 * @property {()=>number} [now]
 * @property {()=>number} [random]
 * @property {(fn:()=>void,ms:number)=>number} [setTimer]
 * @property {(id:number)=>void} [clearTimer]
 * @property {{attentionMinSeconds?:number,attentionMaxSeconds?:number,presenceTickSeconds?:number,chatIntervalSeconds?:number}} [overrides]
 */

/** @param {ClassChannelOptions} options */
export function createMockClassChannel(options) {
  const now = options.now ?? Date.now
  const random = options.random ?? Math.random
  const setTimer = options.setTimer ?? ((fn, ms) => Number(setTimeout(fn, ms)))
  const clearTimer = options.clearTimer ?? ((id) => clearTimeout(id))
  const overrides = options.overrides ?? {}
  const minSeconds = overrides.attentionMinSeconds ?? options.policy.checkMinMinutes * 60
  const maxSeconds = overrides.attentionMaxSeconds ?? options.policy.checkMaxMinutes * 60
  const presenceSeconds = Math.max(1, overrides.presenceTickSeconds ?? 5)
  const chatSeconds = Math.max(2, overrides.chatIntervalSeconds ?? 12)
  /** @type {Set<number>} */
  const timers = new Set()
  /** @type {import('../contracts/learning.js').AttentionChallenge|null} */
  let activeChallenge = null
  let chatIndex = 0
  let started = false

  /** @param {()=>void} fn @param {number} seconds */
  function schedule(fn, seconds) {
    const id = setTimer(() => { timers.delete(id); fn() }, Math.max(0, seconds) * 1000)
    timers.add(id)
    return id
  }

  function scheduleAttention() {
    const delay = randomBetween(random, minSeconds, maxSeconds)
    schedule(() => {
      const issued = now()
      activeChallenge = {
        id: `check-${options.sessionId}-${issued}`,
        issuedAt: new Date(issued).toISOString(),
        expiresAt: new Date(issued + options.policy.responseWindowSeconds * 1000).toISOString(),
        windowSeconds: options.policy.responseWindowSeconds,
      }
      options.onAttentionChallenge(structuredClone(activeChallenge))
      const checkId = activeChallenge.id
      schedule(() => {
        if (!activeChallenge || activeChallenge.id !== checkId) return
        activeChallenge = null
        options.onAttentionExpired(checkId)
        scheduleAttention()
      }, options.policy.responseWindowSeconds)
    }, delay)
  }

  return {
    start() {
      if (started) return
      started = true
      schedule(function tick() {
        options.onPresenceTick(presenceSeconds)
        if (started) schedule(tick, presenceSeconds)
      }, presenceSeconds)
      schedule(function chat() {
        if (options.chatScript.length > 0) {
          const template = options.chatScript[chatIndex % options.chatScript.length]
          chatIndex += 1
          options.onChat({ id: `chat-${options.sessionId}-${now()}-${chatIndex}`, author: template.author, role: template.role, body: template.body, sentAt: new Date(now()).toISOString() })
        }
        if (started) schedule(chat, chatSeconds)
      }, chatSeconds)
      scheduleAttention()
    },
    /** Schedule a one-off domain event (e.g. faculty approval) on the channel clock. @param {()=>void} fn @param {number} seconds */
    later(fn, seconds) { return schedule(fn, seconds) },
    /** @param {string} checkId */
    attentionResolved(checkId) {
      if (!activeChallenge || activeChallenge.id !== checkId) return false
      activeChallenge = null
      // The expiry timer remains in the set but becomes a no-op; the next check
      // is scheduled from resolution, never overlapping the previous window.
      scheduleAttention()
      return true
    },
    get activeCheckId() { return activeChallenge?.id ?? null },
    stop() {
      started = false
      for (const id of timers) clearTimer(id)
      timers.clear()
      if (activeChallenge) {
        const id = activeChallenge.id
        activeChallenge = null
        options.onAttentionExpired(id)
      }
    },
  }
}

/**
 * Study-room presence channel: one visitor joins, later leaves, cyclically.
 * @param {{onPresence:(visitor:{id:string,name:string,initials:string},joined:boolean)=>void,visitors:{id:string,name:string,initials:string}[],intervalSeconds?:number,setTimer?:(fn:()=>void,ms:number)=>number,clearTimer?:(id:number)=>void}} options
 */
export function createMockRoomChannel(options) {
  const setTimer = options.setTimer ?? ((fn, ms) => Number(setTimeout(fn, ms)))
  const clearTimer = options.clearTimer ?? ((id) => clearTimeout(id))
  const interval = Math.max(3, options.intervalSeconds ?? 14)
  let index = 0
  let joined = true
  /** @type {number|null} */
  let timer = null
  return {
    start() {
      if (timer !== null) return
      const tick = () => {
        const visitor = options.visitors[index % options.visitors.length]
        options.onPresence(visitor, joined)
        if (joined) { joined = false } else { joined = true; index += 1 }
        timer = setTimer(tick, interval * 1000)
      }
      timer = setTimer(tick, interval * 1000)
    },
    stop() { if (timer !== null) clearTimer(timer); timer = null },
  }
}

/**
 * A generic, injectable ticker. The monitor and the host console both need
 * "one scripted event every N seconds"; both get it from here, so neither has to
 * own a raw setTimeout and both stay drivable by fake timers in tests.
 *
 * @param {Object} options
 * @param {number} options.intervalSeconds
 * @param {(at: string) => void} options.onTick
 * @param {() => number} [options.now]
 * @param {(fn: () => void, ms: number) => number} [options.setTimer]
 * @param {(id: number) => void} [options.clearTimer]
 */
export function createMockTicker({ intervalSeconds, onTick, now = Date.now, setTimer, clearTimer }) {
  const schedule = setTimer ?? ((fn, ms) => Number(setTimeout(fn, ms)))
  const cancel = clearTimer ?? ((id) => clearTimeout(id))
  const seconds = Math.max(1, intervalSeconds)
  /** @type {number | null} */
  let timerId = null
  let stopped = true

  /** @param {() => void} fn */
  function arm(fn) {
    timerId = schedule(() => {
      if (stopped) return
      fn()
      if (!stopped) arm(fn)
    }, seconds * 1000)
  }

  return {
    start() {
      if (!stopped) return
      stopped = false
      arm(() => onTick(new Date(now()).toISOString()))
    },
    stop() {
      stopped = true
      if (timerId !== null) cancel(timerId)
      timerId = null
    },
    get running() {
      return !stopped
    },
  }
}
