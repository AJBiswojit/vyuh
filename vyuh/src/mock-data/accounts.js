/**
 * Batch 2 — single-institute identity foundation (mock only).
 *
 * PROTOTYPE DISCLAIMER: browser localStorage holds demonstration data. This is
 * not encrypted at rest, not tamper-proof and not suitable for real institutional
 * credentials. The salted SHA-256 digest kept in `vyuh.mock.auth.v1` is NOT a
 * password KDF and is NOT production-grade credential security.
 *
 * Storage separation (deliberate, versioned, additive — existing keys are kept):
 *   vyuh.mock.accounts.v1 → identity + lifecycle metadata. NO passwords, NO
 *                           hashes, NO salts, NO sessions, NO credentials.
 *   vyuh.mock.auth.v1     → salt, digest, lockout counters, legacy challenges.
 *   vyuh.session          → active session envelope (metadata only).
 *
 * Vyuh serves exactly one institute. There is no tenant id, no per-institute
 * namespace and no institute switching. `rollNumber` (academic identifier) and
 * the legacy `instituteCode` demo field remain separate from `instituteId`.
 *
 * G5 is PENDING: no policy wording or version identifier has been supplied by
 * the institute, so no `firstLoginPolicy` text/version exists here and no consent
 * state is enabled. The first-login gate is data-driven on `mustChangePassword`
 * only, so approved policy acceptance can be integrated later without rebuilding
 * authentication.
 */
import { users } from './users.js'
import { adminUsers } from './institution.js'

export const ACCOUNTS_STORAGE_KEY = 'vyuh.mock.accounts.v1'
export const ACCOUNTS_DB_VERSION = 1

/** One shared, additive status vocabulary. Reconciles the admin ledger's subset. */
export const ACCOUNT_STATUSES = Object.freeze(['active', 'invited', 'suspended', 'locked', 'archived'])
export const accountStatusLabels = Object.freeze({
  active: 'Active', invited: 'Invited', suspended: 'Suspended', locked: 'Locked', archived: 'Archived',
})

/** Approved ID shapes. Admin uses exactly three digits. */
/* `mock-data` deliberately does not import `services`: the patterns below are
   kept in step with the validation-layer INSTITUTE_ID_PATTERNS by a drift test
   in tests/unit/account-model.test.js. The registry owns issuance; the schema
   layer owns input validation. No new shared module or dependency is added. */
export const INSTITUTE_ID_FORMATS = Object.freeze({
  student: Object.freeze({ prefix: 'VYU-S', width: 4, max: 9999, yearToken: true, pattern: /^VYU-S-\d{2}-\d{4}$/ }),
  faculty: Object.freeze({ prefix: 'VYU-F', width: 4, max: 9999, yearToken: false, pattern: /^VYU-F-\d{4}$/ }),
  admin: Object.freeze({ prefix: 'VYU-A', width: 3, max: 999, yearToken: false, pattern: /^VYU-A-\d{3}$/ }),
})

/**
 * Approved credential policy. 12 characters is a USER-SELECTED decision from the
 * Batch 2 directive, NOT a blueprint requirement. No time expiry: an unused
 * temporary credential stays valid until account revocation / re-issuance is
 * implemented in the future Admin People batch (a documented security dependency).
 */
export const credentialPolicy = Object.freeze({
  length: 12,
  alphabet: 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789',
  excludedCharacters: Object.freeze(['0', 'O', '1', 'I', 'l']),
  expiresByTime: false,
  mandatoryFirstLoginChange: true,
  hashing: 'salted SHA-256 (prototype only, not a password KDF)',
  delivery: 'one-time viewing (UI belongs to the future Admin People batch)',
  lossRule: 'Admin issues a NEW temporary password; the old value is never retrievable',
})

/** Institute-supplied configuration. `year: null` means "not configured". */
export const DEFAULT_INSTITUTE_ID_CONFIG = Object.freeze({
  year: null,
  seeds: Object.freeze({ student: 231, faculty: 42, admin: 1 }),
})

/** Explicit state transitions. Archived is terminal; locked requires an unlock. */
const ALLOWED_TRANSITIONS = Object.freeze({
  active: Object.freeze(['suspended', 'locked', 'archived']),
  invited: Object.freeze([]),
  suspended: Object.freeze(['active', 'archived']),
  locked: Object.freeze(['active', 'suspended', 'archived']),
  archived: Object.freeze([]),
})

/** Only these fields may leave the registry in a normal account-list response. */
const SAFE_ACCOUNT_FIELDS = Object.freeze([
  'id', 'key', 'instituteId', 'role', 'name', 'email', 'initials', 'status',
  'mustChangePassword', 'temporaryPasswordIssuedAt', 'acknowledgedPolicyVersion',
  'credentialDelivery', 'createdAt', 'statusChangedAt', 'source',
  'rollNumber', 'instituteCode', 'batchId', 'batchName',
])

/** Audit entries are metadata only: actor, target, action, reason, timestamp. */
const AUDIT_FIELDS = Object.freeze(['id', 'at', 'actorId', 'target', 'action', 'reason'])

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

/** Compatibility projection of the four seeded `users.js` fixtures. Fixtures are never deleted or edited. */
function seededAccounts() {
  /** @type {Record<string, any>} */
  const accounts = {}
  for (const user of Object.values(users)) {
    const key = user.email.toLowerCase()
    accounts[key] = {
      id: user.id,
      key,
      instituteId: null,
      role: user.role,
      name: user.name,
      email: user.email,
      initials: user.initials,
      status: 'active',
      /* Demo seats are explicitly NOT forced through first-login setup. */
      mustChangePassword: false,
      temporaryPasswordIssuedAt: null,
      acknowledgedPolicyVersion: null,
      credentialDelivery: 'not_applicable',
      createdAt: user.joinedAt,
      statusChangedAt: null,
      source: 'demo_fixture',
      rollNumber: null,
      instituteCode: user.instituteCode ?? null,
      batchId: user.batchId ?? null,
      batchName: user.batchName ?? null,
    }
  }
  return accounts
}

/** @returns {{ version: number, accounts: Record<string, any>, issuedInstituteIds: string[], counters: Record<string, number>, config: { year: string|null, seeds: Record<string, number> }, audit: Array<Record<string, string>> }} */
export function initialAccountsDb() {
  return {
    version: ACCOUNTS_DB_VERSION,
    accounts: seededAccounts(),
    issuedInstituteIds: [],
    counters: { ...DEFAULT_INSTITUTE_ID_CONFIG.seeds },
    config: { year: DEFAULT_INSTITUTE_ID_CONFIG.year, seeds: { ...DEFAULT_INSTITUTE_ID_CONFIG.seeds } },
    audit: [],
  }
}

/**
 * Additive, versioned migration. Existing keys are preserved; unknown or corrupt
 * data is ignored rather than overwriting the demo fixtures.
 */
export function loadAccountsDb() {
  /** @type {any} */
  let stored = null
  try { stored = JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY) ?? 'null') } catch { /* ignore corrupt mock data */ }
  const base = initialAccountsDb()
  if (!isObject(stored) || stored.version !== ACCOUNTS_DB_VERSION) return base
  return {
    version: ACCOUNTS_DB_VERSION,
    accounts: { ...base.accounts, ...(isObject(stored.accounts) ? stored.accounts : {}) },
    issuedInstituteIds: Array.isArray(stored.issuedInstituteIds)
      ? [...new Set(stored.issuedInstituteIds.filter((value) => typeof value === 'string'))]
      : [],
    counters: { ...base.counters, ...(isObject(stored.counters) ? stored.counters : {}) },
    config: {
      ...base.config,
      ...(isObject(stored.config) ? stored.config : {}),
      seeds: { ...base.config.seeds, ...(isObject(stored.config?.seeds) ? stored.config.seeds : {}) },
    },
    audit: Array.isArray(stored.audit) ? stored.audit : [],
  }
}

export function saveAccountsDb(db) {
  try { localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(db)) } catch { /* keep the demo usable in memory */ }
  return db
}

/**
 * Institute-supplied configuration (year token + counter seeds). Counters never
 * decrease: raising a seed can only move the next candidate forward.
 * @param {{ year?: string|null, seeds?: Partial<Record<'student'|'faculty'|'admin', number>> }} partial
 */
export function configureInstituteIds(partial) {
  const db = loadAccountsDb()
  const year = Object.hasOwn(partial, 'year') ? (partial.year === null ? null : String(partial.year).trim()) : db.config.year
  const seeds = { ...db.config.seeds }
  for (const role of Object.keys(DEFAULT_INSTITUTE_ID_CONFIG.seeds)) {
    const value = partial.seeds?.[role]
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) seeds[role] = Math.floor(value)
  }
  const counters = { ...db.counters }
  for (const role of Object.keys(seeds)) counters[role] = Math.max(Number(counters[role] ?? 0), seeds[role])
  return saveAccountsDb({ ...db, config: { year, seeds }, counters }).config
}

export function instituteIdConfig() {
  return loadAccountsDb().config
}

/** @param {unknown} value */
export function parseInstituteId(value) {
  if (typeof value !== 'string') return null
  const id = value.trim().toUpperCase()
  for (const [role, format] of Object.entries(INSTITUTE_ID_FORMATS)) {
    if (!format.pattern.test(id)) continue
    const parts = id.split('-')
    return { role: /** @type {'student'|'faculty'|'admin'} */ (role), year: format.yearToken ? parts[2] : null, suffix: Number(parts[parts.length - 1]) }
  }
  return null
}

export function isInstituteId(value) {
  return parseInstituteId(value) !== null
}

/** @param {string} value */
export function normalizeAccountKey(value) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return isInstituteId(trimmed) ? trimmed.toUpperCase() : trimmed.toLowerCase()
}

/**
 * Reconciliation source of truth: highest numeric suffix observed in the seeded
 * user fixtures, the institution records, the persisted registry and the
 * permanent issued-ID ledger.
 * @param {'student'|'faculty'|'admin'} role
 */
export function highestExistingSuffix(role, db = loadAccountsDb()) {
  if (!INSTITUTE_ID_FORMATS[role]) return 0
  /** @type {unknown[]} */
  const candidates = []
  for (const record of Object.values(db.accounts)) {
    candidates.push(record.instituteId, record.id, record.email, record.rollNumber, record.instituteCode)
  }
  for (const user of Object.values(users)) candidates.push(user.id, user.email, user.instituteCode)
  for (const person of adminUsers) candidates.push(person.id, person.email, person.rollNumber)
  for (const issued of db.issuedInstituteIds) candidates.push(issued)
  let highest = 0
  for (const value of candidates) {
    const parsed = typeof value === 'string' ? parseInstituteId(value) : null
    if (parsed && parsed.role === role) highest = Math.max(highest, parsed.suffix)
  }
  return highest
}

/**
 * Allocate the next never-reused Institute ID.
 * Rule: `nextCounter = max(configuredSeed, highestExistingNumericSuffix) + 1`.
 * The issued-ID ledger is permanent: suspension/archival never frees an ID, and
 * counters never decrement. Exhaustion is an explicit error, never a wraparound.
 * Returns the updated DB but does NOT persist it, so the caller can commit the
 * account record and the ID in one atomic write.
 * @param {'student'|'faculty'|'admin'} role
 * @param {ReturnType<typeof loadAccountsDb>} [db]
 */
export function issueInstituteId(role, db = loadAccountsDb()) {
  const format = INSTITUTE_ID_FORMATS[role]
  if (!format) return { ok: false, code: 'unknown_role', message: 'That account role is not supported.', db }
  const year = db.config.year
  if (format.yearToken && (typeof year !== 'string' || !/^\d{2}$/.test(year))) {
    return {
      ok: false,
      code: 'institute_year_not_configured',
      message: 'The institute has not configured an academic-year token. An Institute ID cannot be generated without it.',
      db,
    }
  }
  const issued = new Set(db.issuedInstituteIds)
  const inUse = new Set(Object.values(db.accounts).map((record) => record.instituteId).filter(Boolean))
  /* `counters[role]` is the last allocated suffix and never decreases. Using it
     alongside the configured seed, the observed records and the permanent
     issued-ID ledger means an ID cannot be reused even if one source is lost. */
  const seed = Number(db.config.seeds[role] ?? 0)
  const counter = Number(db.counters[role] ?? 0)
  let suffix = Math.max(
    Number.isFinite(seed) ? seed : 0,
    Number.isFinite(counter) ? counter : 0,
    highestExistingSuffix(role, db),
  ) + 1
  const assemble = (value) => format.yearToken
    ? `VYU-S-${year}-${String(value).padStart(format.width, '0')}`
    : `${format.prefix}-${String(value).padStart(format.width, '0')}`
  while (suffix <= format.max) {
    const candidate = assemble(suffix)
    if (!issued.has(candidate) && !inUse.has(candidate)) break
    suffix += 1
  }
  if (suffix > format.max) {
    return { ok: false, code: 'institute_id_range_exhausted', message: `The ${role} Institute ID range is exhausted. No identity was issued.`, db }
  }
  const instituteId = assemble(suffix)
  return {
    ok: true,
    instituteId,
    suffix,
    db: {
      ...db,
      counters: { ...db.counters, [role]: suffix },
      issuedInstituteIds: [...db.issuedInstituteIds, instituteId],
    },
  }
}

/** @param {any} record */
export function projectSafeAccount(record) {
  /** @type {Record<string, unknown>} */
  const result = {}
  for (const field of SAFE_ACCOUNT_FIELDS) {
    if (Object.hasOwn(record, field)) result[field] = record[field]
  }
  return result
}

/** Normal account-list response. Never carries a credential or a hash. */
export function listAccounts(db = loadAccountsDb()) {
  return Object.values(db.accounts).map(projectSafeAccount)
}

/** @param {string} identifier @param {ReturnType<typeof loadAccountsDb>} [db] */
export function accountByIdentifier(identifier, db = loadAccountsDb()) {
  const key = normalizeAccountKey(identifier)
  if (!key) return null
  return db.accounts[key]
    ?? Object.values(db.accounts).find((record) => record.instituteId?.toUpperCase() === key || record.email?.toLowerCase() === key)
    ?? null
}

/**
 * Explicit, validated status transition. Records are never removed, so issued
 * IDs remain permanently reserved even for suspended and archived accounts.
 * @param {string} identifier
 * @param {'active'|'invited'|'suspended'|'locked'|'archived'} nextStatus
 * @param {ReturnType<typeof loadAccountsDb>} [db]
 */
export function transitionAccountStatus(identifier, nextStatus, db = loadAccountsDb()) {
  const record = accountByIdentifier(identifier, db)
  if (!record) return { ok: false, code: 'account_not_found', db }
  if (!ACCOUNT_STATUSES.includes(nextStatus)) return { ok: false, code: 'invalid_account_status', db }
  if (!ALLOWED_TRANSITIONS[record.status]?.includes(nextStatus)) {
    return { ok: false, code: 'invalid_status_transition', db }
  }
  const updated = { ...record, status: nextStatus, statusChangedAt: new Date().toISOString() }
  const next = saveAccountsDb({ ...db, accounts: { ...db.accounts, [record.key]: updated } })
  return { ok: true, account: projectSafeAccount(updated), db: next }
}

/**
 * Credential-free audit metadata contract. Only actor, target, action, reason
 * and timestamp survive. A generated credential can never enter an audit entry,
 * even if a caller accidentally passes one. Recovery decisions require a reason.
 * @param {{ actorId?: string, target?: string, action?: string, reason?: string, [key: string]: unknown }} input
 */
export function createAccountAuditEntry(input) {
  const reason = String(input?.reason ?? '').trim()
  if (!reason) return { ok: false, code: 'audit_reason_required' }
  const entry = Object.freeze({
    id: `audit-${crypto.randomUUID()}`,
    at: new Date().toISOString(),
    actorId: String(input?.actorId ?? ''),
    target: String(input?.target ?? ''),
    action: String(input?.action ?? ''),
    reason,
  })
  return { ok: true, entry }
}

/** Appends a whitelisted, credential-free audit entry (contract only; no UI). */
export function appendAccountAudit(input, db = loadAccountsDb()) {
  const created = createAccountAuditEntry(input)
  if (!created.ok) return created
  /** @type {Record<string, string>} */
  const safe = {}
  for (const field of AUDIT_FIELDS) safe[field] = created.entry[field]
  const next = saveAccountsDb({ ...db, audit: [...db.audit, Object.freeze(safe)] })
  return { ok: true, entry: safe, db: next }
}

/**
 * Fill a Uint8Array from Web Crypto. Returns false when no secure generator is
 * available so the caller can fall back to a CLEARLY LABELLED mock-only source.
 * @param {Uint8Array} buffer
 */
export function defaultRandomBytes(buffer) {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(buffer)
    return true
  }
  return false
}

/**
 * Generate a 12-character temporary password with `crypto.getRandomValues` and
 * rejection sampling (uniform over the approved alphabet). Whole candidates are
 * resampled until they also satisfy the shared `newPasswordSchema` composition
 * (at least one letter and one digit), so a generated credential can never be
 * weaker than a user-chosen replacement. An injectable deterministic generator
 * is permitted EXCLUSIVELY for unit tests; it is mock only and must never be
 * described as cryptographically secure.
 * @param {(buffer: Uint8Array) => boolean | void} [randomBytes]
 */
export function generateTemporaryPassword(randomBytes = defaultRandomBytes) {
  const alphabet = credentialPolicy.alphabet
  const limit = Math.floor(256 / alphabet.length) * alphabet.length
  const digits = new Set('23456789')
  const buffer = new Uint8Array(32)
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let password = ''
    while (password.length < credentialPolicy.length) {
      buffer.fill(0)
      const secure = randomBytes(buffer)
      if (secure === false) {
        /* Mock-only fallback: predictable, NOT cryptographically secure. */
        for (let index = 0; index < buffer.length; index += 1) buffer[index] = Math.floor(Math.random() * 256)
      }
      for (const byte of buffer) {
        if (byte >= limit) continue
        password += alphabet[byte % alphabet.length]
        if (password.length === credentialPolicy.length) break
      }
    }
    const characters = [...password]
    if (characters.some((character) => digits.has(character)) && characters.some((character) => !digits.has(character))) return password
  }
  /* Fail loudly rather than issuing an off-policy or predictable credential. */
  throw new Error('Unable to generate a policy-compliant temporary password.')
}

/** Pure predicate used by the generator regression tests. */
export function isPolicyTemporaryPassword(value) {
  if (typeof value !== 'string' || value.length !== credentialPolicy.length) return false
  const characters = [...value]
  if (!characters.every((character) => credentialPolicy.alphabet.includes(character))) return false
  if (credentialPolicy.excludedCharacters.some((character) => value.includes(character))) return false
  const digits = new Set('23456789')
  return characters.some((character) => digits.has(character)) && characters.some((character) => !digits.has(character))
}
