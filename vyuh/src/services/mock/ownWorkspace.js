/**
 * BATCH 3.2 (F-01 / F-02) — ONE fail-closed student/faculty workspace boundary.
 *
 * Batch 3.1 introduced this single shared helper but classified unknown
 * identifiers and missing/invalid sessions as `demo`. The final acceptance
 * review (F-01 / F-02) reproduced demo academic records being returned to
 * unauthenticated, invalid-session and arbitrary-identity callers. This module
 * is now STRICTLY fail-closed, under the four confirmed Batch 3.2 identity
 * rulings:
 *
 *   1. Strict demo identity/session matching: a recognized seeded demo id is
 *      `demo` ONLY with a valid session for that EXACT identity and role.
 *   2. No production demo-preview capability or consumer. There is no preview
 *      context token: `isMockMode` and the absence of a session are NOT
 *      authorization, and no branch derives `demo` from a null session.
 *   3. A frozen `DEMO_IDENTITIES` set is the ONLY demo allowlist. There is no
 *      production test-ID allowlist and no `fixture:` namespace.
 *   4. An issued identity is valid ONLY with a valid, matching issued session.
 *      Missing, expired, malformed, wrong-role or mismatched sessions resolve
 *      to `invalid` and fail closed. There is no "no conflicting session" path.
 *
 * Canonical identity ownership is verified for EVERY accepted identifier and
 * alias form: `accountByIdentifier()` resolves canonical key, Institute ID and
 * email; both the requested identifier and the session identity are resolved to
 * canonical records and their `key` is compared. No alternate identifier can
 * bypass the matching-session requirement (safeguard 1).
 *
 * It reuses ONLY the existing Batch 2 identity model:
 *   - `vyuh.mock.accounts.v1` through `loadAccountsDb()` / `accountByIdentifier()`
 *     / `isInstituteId()`
 *   - the persisted session through `readPersistedSession()`
 *   - the seeded demo seats in `users.js` / `currentStudent`
 * There is no second identity store, no new role, no new session shape, and
 * `mustChangePassword` is deliberately NOT an identity criterion (route guards
 * own first-login). No credential, hash, salt or academic record is read here,
 * and this file never writes to storage.
 */
import {
  loadAccountsDb, accountByIdentifier, isInstituteId,
  users as fixtureUsers, currentStudent,
} from '../../mock-data/index.js'
import { readPersistedSession } from '../../shared/lib/sessionPersistence.js'
import { notFound } from './errors.js'

/**
 * The frozen, recognized seeded demo identities, derived read-only from the
 * protected `src/mock-data/users.js` (which is never edited). `adm-pratibha` is
 * role `admin`, so it is not a student/faculty demo identity. Demo seats are
 * NOT canonical registry records (`accountByIdentifier('stu-ananya')` is null),
 * so they must be recognized here rather than through the registry.
 * @type {Readonly<Record<'student'|'faculty', ReadonlyArray<string>>>}
 */
export const DEMO_IDENTITIES = Object.freeze({
  student: Object.freeze([
    ...new Set([
      ...Object.keys(fixtureUsers).filter((id) => fixtureUsers[id]?.role === 'student'),
      currentStudent.id,
    ]),
  ]),
  faculty: Object.freeze(Object.keys(fixtureUsers).filter((id) => fixtureUsers[id]?.role === 'faculty')),
})

/**
 * @typedef {Object} WorkspaceScope
 * @property {'issued'|'demo'|'invalid'} kind
 * @property {any|null} record             Canonical registry record, when one exists.
 * @property {string} identifier           The trimmed identifier that was checked.
 */

/** @param {import('./ownWorkspace.js').WorkspaceScope['kind']} kind @param {any|null} record @param {string} identifier */
const scope = (kind, record = null, identifier = '') => ({ kind, record, identifier })

/**
 * A valid session for the requested role, exposing BOTH the raw session id and
 * the canonical lookup key. Returns null for missing, expired, malformed,
 * wrong-schema or wrong-role sessions.
 * @param {'student'|'faculty'} role
 */
function sessionIdentity(role) {
  const session = readPersistedSession()
  if (!session || session.user?.role !== role) return null
  const id = String(session.user?.id ?? session.instituteId ?? '').trim()
  const key = String(session.user?.instituteId ?? session.instituteId ?? id).trim()
  if (!id) return null
  return { session, id, key }
}

/**
 * Resolve the canonical registry record behind any accepted identifier/alias
 * form. `accountByIdentifier` covers canonical key, Institute ID (any case) and
 * email (any case); resolving twice keeps the alias semantics in one place.
 * @param {string} identifier
 * @param {ReturnType<typeof loadAccountsDb>} db
 */
function canonicalRecord(identifier, db) {
  return accountByIdentifier(identifier, db) ?? null
}

/**
 * @param {unknown} identifier @param {'student'|'faculty'} role @returns {WorkspaceScope}
 *
 * Ordered decision table (see module header):
 *   R1 blank / non-string                                   -> invalid
 *   R2 canonical record of the wrong role                  -> invalid
 *   R3 issued record + valid matching issued session      -> issued
 *   R4 issued record + ANY other session state            -> invalid
 *   R5 forged Institute ID (no issued record)             -> invalid
 *   R6 recognized demo id + valid matching demo session   -> demo
 *   R7 recognized demo id + ANY other session state       -> invalid
 *   R8 every other identifier (unknown / legacy test id)  -> invalid
 */
export function accountWorkspace(identifier, role = 'student') {
  const id = typeof identifier === 'string' ? identifier.trim() : ''
  if (!id) return scope('invalid', null, '')

  const identity = sessionIdentity(role)
  const db = loadAccountsDb()

  /* Canonical ownership: resolve the requested identifier through EVERY
     accepted alias form, and independently resolve the session identity. Both
     must point at the same canonical record key for an issued workspace. */
  const record = canonicalRecord(id, db)
  const own = identity
    ? canonicalRecord(identity.key, db) ?? canonicalRecord(identity.id, db)
    : null

  if (record && record.role !== role) return scope('invalid', record, id)

  if (record && record.source === 'institute_issued' && record.instituteId) {
    /* R4: no valid matching issued session -> fail closed. There is no
       "or no conflicting session" allowance. */
    if (!identity || !own || own.source !== 'institute_issued' || own.key !== record.key) {
      return scope('invalid', record, id)
    }
    return scope('issued', record, id)
  }

  if (isInstituteId(id)) return scope('invalid', record, id)

  if (DEMO_IDENTITIES[role]?.includes(id)) {
    if (!identity || identity.id !== id) return scope('invalid', record, id)
    return scope('demo', record, id)
  }

  return scope('invalid', record, id)
}

/** @param {unknown} studentId @returns {WorkspaceScope} */
export function studentWorkspace(studentId) {
  return accountWorkspace(studentId, 'student')
}

/** @param {unknown} facultyId @returns {WorkspaceScope} */
export function facultyWorkspace(facultyId) {
  return accountWorkspace(facultyId, 'faculty')
}

/**
 * Identity for services that have no id parameter. Derived from the persisted
 * session, NEVER from a caller and NEVER from `isMockMode`.
 * @param {'student'|'faculty'} role @returns {WorkspaceScope}
 */
export function sessionWorkspace(role = 'student') {
  const identity = sessionIdentity(role)
  if (!identity) return scope('invalid', null, '')
  return accountWorkspace(identity.id, role)
}

/* ── Throwing getters. Every fixture-serving service must use one of these so
 *    that `invalid` can never fall through to the demo branch. ───────────── */

/** Throw `not_found` for missing/invalid/forged/cross-account identities. */
export function requireStudentWorkspace(studentId) {
  const result = studentWorkspace(studentId)
  if (result.kind === 'invalid') throw notFound('student')
  return result
}

/** @param {unknown} facultyId */
export function requireFacultyWorkspace(facultyId) {
  const result = facultyWorkspace(facultyId)
  if (result.kind === 'invalid') throw notFound('faculty')
  return result
}

/** @param {'student'|'faculty'} role */
export function requireSessionWorkspace(role = 'student') {
  const result = sessionWorkspace(role)
  if (result.kind === 'invalid') throw notFound(role)
  return result
}

/**
 * Fail-closed predicate: true ONLY for an authorized demo seat. Throws for
 * `invalid`, false for `issued`. Services use this instead of testing
 * `kind === 'issued'` alone to decide whether to serve fixtures.
 * @param {unknown} studentId
 */
export function demoStudentWorkspace(studentId) {
  return requireStudentWorkspace(studentId).kind === 'demo'
}

/** @param {unknown} facultyId */
export function demoFacultyWorkspace(facultyId) {
  return requireFacultyWorkspace(facultyId).kind === 'demo'
}

/** @param {'student'|'faculty'} role */
export function demoSessionWorkspace(role = 'student') {
  return requireSessionWorkspace(role).kind === 'demo'
}

/** @param {unknown} studentId */
export function isIssuedStudent(studentId) {
  return requireStudentWorkspace(studentId).kind === 'issued'
}

/** @param {unknown} facultyId */
export function isIssuedFaculty(facultyId) {
  return requireFacultyWorkspace(facultyId).kind === 'issued'
}
