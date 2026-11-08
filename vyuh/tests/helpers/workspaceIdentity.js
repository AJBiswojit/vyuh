/**
 * BATCH 3.2 — shared TEST-ONLY identity/session convention (F-01 / F-02 / F-04).
 *
 * The four confirmed Batch 3.2 rulings require every demo or issued identity to
 * be paired with a REAL, valid, matching session. Legacy tests used bare ids
 * (`stu-test`, `stu-ananya`, `fac-snehasish`, ...) with no session; those calls
 * now correctly fail closed. Tests must therefore sign in through the real
 * `authService.login()` and `useSessionStore.setSession()` — no forged envelope,
 * no production test-ID allowlist and no `fixture:` namespace.
 *
 * This helper lives under `tests/` only. There is NO production demo-preview
 * capability: `isMockMode`, a null session and a bare id are never authorization.
 */
import { authService } from '../../src/services/mock/auth.js'
import { adminService } from '../../src/services/mock/admin.js'
import { configureInstituteIds } from '../../src/mock-data/index.js'
import { SESSION_STORAGE_KEY, SESSION_LIFETIME_MS } from '../../src/shared/lib/sessionPersistence.js'
import { useSessionStore } from '../../src/shared/store/sessionStore.js'

const DEMO_PASSWORD = 'vyuh2026'
const ADMIN_ID = 'adm-pratibha'
const ADMIN_EMAIL = 'academic.office@vidyutacademy.in'
const DEMO_STUDENT_EMAIL = 'ananya.sahoo@vidyutacademy.in'
const DEMO_FACULTY_EMAIL = 'snehasish@vidyutacademy.in'

/** Recognized seeded demo seats (read-only fixtures, never modified here). */
export const DEMO_SEATS = Object.freeze({
  student: Object.freeze({ id: 'stu-ananya', email: DEMO_STUDENT_EMAIL }),
  faculty: Object.freeze({ id: 'fac-snehasish', email: DEMO_FACULTY_EMAIL }),
})

/** Fully clear BOTH localStorage and sessionStateStorage's in-memory fallback. */
export function signOut() {
  useSessionStore.getState().clear()
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

/** @param {string} email @param {string} [password] */
async function signIn(email, password = DEMO_PASSWORD) {
  const session = await authService.login({ email, password })
  useSessionStore.getState().setSession(session)
  return session
}

/** @returns {Promise<import('../../src/contracts/user.js').AuthSession>} */
export function signInAdmin() { return signIn(ADMIN_EMAIL) }

/** @returns {Promise<import('../../src/contracts/user.js').AuthSession>} */
export function signInDemoStudent() { return signIn(DEMO_STUDENT_EMAIL) }

/** @returns {Promise<import('../../src/contracts/user.js').AuthSession>} */
export function signInDemoFaculty() { return signIn(DEMO_FACULTY_EMAIL) }

/**
 * Create a REAL institute-issued account (through a real Admin session) and
 * sign into it with the generated temporary password. Returns the canonical
 * Institute ID, email, generated secret and the real session so tests can build
 * alias and mismatch cases honestly.
 * @param {'student'|'faculty'} role
 * @param {Record<string, unknown>} [overrides]
 */
async function signInIssued(role, overrides = {}) {
  /* '99' is TEST FIXTURE DATA, not institute policy. Batch 2 ships year:null. */
  configureInstituteIds({ year: '99' })
  await signInAdmin()
  const created = await adminService.createUser(ADMIN_ID, {
    role,
    name: role === 'student' ? 'Batch 3.2 Student' : 'Batch 3.2 Faculty',
    email: `b32.${role}.${Date.now()}${Math.random().toString(36).slice(2, 7)}@vidyutacademy.in`,
    ...(role === 'student' ? { batchId: 'bat-prayas-m', rollNumber: `B32-${Math.floor(1000 + Math.random() * 8999)}` } : {}),
    ...overrides,
  })
  const instituteId = created.account.instituteId
  const temporaryPassword = created.credentials[0].temporaryPassword
  const session = await signIn(instituteId, temporaryPassword)
  return { session, created, instituteId, temporaryPassword, email: created.account.email }
}

/** @param {Record<string, unknown>} [overrides] */
export function signInIssuedStudent(overrides) { return signInIssued('student', overrides) }

/** @param {Record<string, unknown>} [overrides] */
export function signInIssuedFaculty(overrides) { return signInIssued('faculty', overrides) }

/**
 * Write an EXPIRED but otherwise schema-valid session envelope. Used only to
 * prove that an expired session resolves `invalid` and fails closed.
 * @param {import('../../src/contracts/user.js').AuthSession} session
 */
export function expirePersistedSession(session) {
  const expired = { ...session, issuedAt: session.issuedAt - SESSION_LIFETIME_MS - 1000, expiresAt: Date.now() - 1000 }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ version: 1, state: { session: expired } }))
}

/** Write a structurally malformed envelope (version mismatch / bad JSON). */
export function malformedPersistedSession() {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ version: 99, state: { session: { user: { id: 'stu-ananya', role: 'student' } } } }))
}

/** @param {import('../../src/contracts/user.js').AuthSession} session */
export function writeSessionEnvelope(session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ version: 1, state: { session } }))
}

export { DEMO_PASSWORD, ADMIN_ID, SESSION_STORAGE_KEY }
