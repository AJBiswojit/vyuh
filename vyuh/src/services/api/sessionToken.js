/** Keep the HTTP bearer cache aligned with the validated Zustand envelope. */
import { setToken } from './http.js'
import { readPersistedSession } from '../../shared/lib/sessionPersistence.js'
export function setSessionToken(token) {
  setToken(token)
}
export function clearSessionToken() {
  setToken(null)
}
export function restoreSessionToken() {
  const token = readPersistedSession()?.token ?? null
  setToken(token)
  return token
}
