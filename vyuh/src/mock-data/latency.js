/**
 * Mock transport helpers.
 *
 * Every mock service call routes through `simulate`, which
 *   1. waits 200-800ms so layouts are judged with real async behaviour,
 *   2. throws a modelled service error ~3% of the time when
 *      VITE_MOCK_ERRORS=true, so empty and error states get exercised,
 *   3. resolves with a deep clone so callers can never mutate the fixture.
 */

/** @typedef {import('../contracts/common.js').ServiceError} ServiceError */

/**
 * Failure rate per call. 3% by default, as specified; overridable so the error
 * states can be exercised deterministically (set VITE_MOCK_ERROR_RATE=1 in a
 * throwaway dev session rather than waiting for the dice).
 */
const DEFAULT_ERROR_RATE = 0.03

/**
 * Failure modes the mocks can produce. Each carries a sentence that states
 * what happened and what to do next.
 * @type {ReadonlyArray<ServiceError>}
 */
const FAILURES = [
  {
    code: 'network_unavailable',
    message: 'The connection dropped before the request finished. Check your network and try again.',
    status: 0,
    retryable: true,
  },
  {
    code: 'gateway_timeout',
    message: 'The server took too long to answer. Try again in a moment.',
    status: 504,
    retryable: true,
  },
  {
    code: 'service_unavailable',
    message: 'This service is briefly unavailable. Your data is safe; try again in a moment.',
    status: 503,
    retryable: true,
  },
]

/**
 * Reads an env flag at call time so tests can toggle it without a rebuild.
 * @param {string} key
 * @param {string} fallback
 * @returns {string}
 */
export function readFlag(key, fallback) {
  const raw = import.meta.env?.[key]
  return typeof raw === 'string' && raw.length > 0 ? raw : fallback
}

/** @returns {boolean} True when mock calls should fail randomly. */
export function errorsEnabled() {
  return readFlag('VITE_MOCK_ERRORS', 'false').toLowerCase() === 'true'
}

/** @returns {number} Probability in [0, 1] that a call rejects. */
export function errorRate() {
  const raw = Number.parseFloat(readFlag('VITE_MOCK_ERROR_RATE', String(DEFAULT_ERROR_RATE)))
  if (Number.isNaN(raw)) return DEFAULT_ERROR_RATE
  return Math.min(1, Math.max(0, raw))
}

/**
 * @template T
 * @param {() => (T | Promise<T>)} produce
 * @param {{ min?: number, max?: number, faulty?: boolean }} [options]
 *   `faulty: false` exempts a call from random failure. Only session restore
 *   uses it: a dropped restore would sign a demo user out at random, which
 *   teaches nothing about error states on a data screen.
 * @returns {Promise<T>}
 */
export function simulate(produce, options = {}) {
  const { min = 200, max = 800, faulty = true } = options
  const delay = Math.round(min + Math.random() * (max - min))

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (faulty && errorsEnabled() && Math.random() < errorRate()) {
        const failure = FAILURES[Math.floor(Math.random() * FAILURES.length)]
        const error = new Error(failure.message)
        error.name = 'ServiceError'
        Object.assign(error, failure)
        reject(error)
        return
      }
      Promise.resolve()
        .then(() => produce())
        .then((value) => resolve(structuredClone(value)))
        .catch(reject)
    }, delay)
  })
}

/**
 * Deep clone that survives fixtures containing no exotic values.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value))
}
