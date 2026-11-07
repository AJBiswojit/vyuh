/**
 * The only session storage key. Zustand owns writes; the mock AuthService reads
 * the same validated envelope. Passwords and pending credentials are excluded.
 * Storage failures degrade to an in-memory session rather than trapping a user.
 */
import { authSessionSchema } from '../../services/authSchemas.js'

export const SESSION_STORAGE_KEY = 'vyuh.session'
export const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000
/** @type {Map<string, string>} */
const memory = new Map()

/** @type {{ getItem: (key: string) => string | null, setItem: (key: string, value: string) => void, removeItem: (key: string) => void }} */
export const sessionStateStorage = {
  getItem(key) {
    try { return localStorage.getItem(key) ?? memory.get(key) ?? null }
    catch { return memory.get(key) ?? null }
  },
  setItem(key, value) {
    memory.set(key, value)
    try { localStorage.setItem(key, value) } catch { /* In-memory fallback. */ }
  },
  removeItem(key) {
    memory.delete(key)
    try { localStorage.removeItem(key) } catch { /* In-memory fallback. */ }
  },
}

/** @returns {import('../../contracts/user.js').AuthSession | null} */
/** @param {number} [now] */
export function readPersistedSession(now = Date.now()) {
  try {
    const raw = sessionStateStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const envelope = JSON.parse(raw)
    if (envelope?.version !== 1) return null
    const parsed = authSessionSchema.safeParse(envelope.state?.session)
    if (!parsed.success || parsed.data.expiresAt <= now) return null
    return parsed.data
  } catch { return null }
}

/** @param {unknown} persisted @param {import('../store/sessionStore.js').SessionState} current */
export function mergeSession(persisted, current) {
  const session = readPersistedSession()
  return { ...current, session, user: session?.user ?? null, status: session ? 'authenticated' : 'anonymous' }
}
