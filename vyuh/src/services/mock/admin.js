/**
 * Phase 8 mock service: the institution console.
 *
 * One office seat, one store. Every write is real within the mock — an imported
 * row becomes an account, a policy change moves the number the register uses, a
 * decision on an integrity flag settles the flag — and every write appends an
 * audit entry. That is the point of the console: the ledger is not a separate
 * screen someone remembers to update, it is the record of what the service did.
 *
 * @typedef {import('../types.js').AdminService} AdminService
 * @typedef {import('../../contracts/admin.js').AdminUser} AdminUser
 * @typedef {import('../../contracts/admin.js').AdminBatch} AdminBatch
 * @typedef {import('../../contracts/admin.js').ApprovalItem} ApprovalItem
 * @typedef {import('../../contracts/admin.js').PolicyDefinition} PolicyDefinition
 * @typedef {import('../../contracts/admin.js').PolicyChange} PolicyChange
 * @typedef {import('../../contracts/admin.js').IntegrityReport} IntegrityReport
 * @typedef {import('../../contracts/admin.js').ModerationItem} ModerationItem
 * @typedef {import('../../contracts/admin.js').AuditEntry} AuditEntry
 * @typedef {import('../../contracts/admin.js').ImportPreview} ImportPreview
 * @typedef {import('../../contracts/admin.js').Branding} Branding
 */
import {
  adminUsers, adminBatches, facultyRoster, activeBatches, attendanceTrend,
  adminExamCalendar, adminAlerts, adminPolicies, policyHistory, policyScopeLabels,
  auditSeed, AUDIT_ACTIONS, integrityReports, approvalQueue, moderationQueue,
  reportDefinitions, reportFormats, brandingDefaults, adminProfile, adminTerm,
  IMPORT_FIELDS, IMPORT_HEADER_ALIASES, IMPORT_MAX_ROWS, importSamples, importSampleFileName,
  subjects, chapters, simulate, clone,
  /* Batch 2 identity foundation — read through the barrel only. */
  ACCOUNTS_STORAGE_KEY, loadAccountsDb, saveAccountsDb, accountByIdentifier,
  transitionAccountStatus, configureInstituteIds, instituteIdConfig,
  issueInstituteId, normalizeAccountKey, accountStatusLabels,
  users as fixtureUsers,
} from '../../mock-data/index.js'
import { csvFromColumns, formatPolicyValue, pageCount, policyImpact, reportFileName, validateImport } from '../../shared/lib/adminMath.js'
import { readPersistedSession } from '../../shared/lib/sessionPersistence.js'
import { instituteAccountInputSchema } from '../authSchemas.js'
import { provisionInstituteAccount, issueTemporaryPassword } from './auth.js'
import { notFound, serviceError } from './errors.js'

/* ── Batch 3 — Admin People identity bridge ─────────────────────────────────
 * The two Batch 2 ledgers are now joined through a READ-ONLY projection:
 *   vyuh.mock.accounts.v1  → canonical, loginable institute accounts (source of truth)
 *   vyuh.mock.admin.v1     → academic-office console state (audit, batches, policies)
 * `accounts.js` implementation is NOT rewritten: this module only calls its
 * approved public helpers and never declares a credential field of its own.
 * ------------------------------------------------------------------------- */
const AUTH_DB_KEY = 'vyuh.mock.auth.v1'
const PEOPLE_STATUSES = Object.freeze(['active', 'invited', 'suspended', 'locked', 'archived'])
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const YEAR_RE = /^\d{2}$/

const lowerEmail = (/** @type {unknown} */ value) => String(value ?? '').trim().toLowerCase()
const upperRoll = (/** @type {unknown} */ value) => String(value ?? '').trim().toUpperCase()
const titleOf = (/** @type {string} */ value) => value === 'faculty' ? 'Faculty' : 'Student'

/* BATCH 3.1 (WS8 / R-4): privileged account-management mutations must be
 * authorised at the SERVICE boundary, not only by the route guard. Reads and
 * pre-existing admin console mutations keep their original behaviour; this
 * check is applied ONLY to the Batch 3 account-management writes below.
 * A missing, expired, malformed, faculty or student session is rejected. */
function requireAdminActor() {
  const session = readPersistedSession()
  if (!session || session.user?.role !== 'admin') {
    throw serviceError('forbidden', 'Only a signed-in Admin can manage institute accounts.', 403)
  }
  return { id: session.user.id || adminProfile.id, name: session.user.name || adminProfile.name }
}

/** Session-derived actor, with the seeded office seat as an honest fallback. */
function adminActor() {
  const session = readPersistedSession()
  if (session?.user?.role === 'admin') {
    return { id: session.user.id || adminProfile.id, name: session.user.name || adminProfile.name }
  }
  return { id: adminProfile.id, name: adminProfile.name }
}

/** @param {ReturnType<typeof instituteIdConfig>} config */
function instituteConfigView(config = instituteIdConfig()) {
  return {
    year: config.year ?? null,
    studentCreationAvailable: YEAR_RE.test(String(config.year ?? '')),
    facultyCreationAvailable: true,
  }
}

/** Canonical registry row → Admin People row. NEVER includes a credential. */
function toPeopleRow(record) {
  const batch = adminBatches.find((item) => item.id === record.batchId)
  return {
    id: record.instituteId ?? record.id,
    name: record.name,
    initials: record.initials,
    email: record.email,
    phone: record.phone ?? '',
    role: record.role,
    status: record.status,
    batchId: record.batchId ?? null,
    batchName: record.batchName ?? batch?.name ?? null,
    rollNumber: record.rollNumber ?? null,
    joinedAt: String(record.createdAt ?? '').slice(0, 10),
    lastActiveAt: null,
    instituteId: record.instituteId ?? null,
    mustChangePassword: record.mustChangePassword === true,
    credentialDelivery: record.credentialDelivery ?? 'not_applicable',
    temporaryPasswordIssuedAt: record.temporaryPasswordIssuedAt ?? null,
    statusChangedAt: record.statusChangedAt ?? null,
    source: 'institute_issued',
  }
}

/**
 * Merged canonical roster. Legacy `adminUsers` fixtures and any pre-Batch-3
 * `createdUsers` rows stay visible; a canonical row supersedes a legacy row
 * with the same email or Institute ID. Demo fixtures are deliberately untouched.
 */
function roster(store) {
  const canonical = Object.values(loadAccountsDb().accounts)
    .filter((record) => record && record.source === 'institute_issued' && record.instituteId)
    .map(toPeopleRow)
  const ids = new Set(canonical.map((row) => String(row.instituteId).toUpperCase()))
  const emails = new Set(canonical.map((row) => lowerEmail(row.email)))
  const legacy = [...adminUsers, ...store.createdUsers].filter((row) => {
    const email = lowerEmail(row.email)
    const id = String(row.instituteId ?? row.id ?? '').toUpperCase()
    if (email && emails.has(email)) return false
    if (id && ids.has(id)) return false
    return true
  })
  return [...legacy, ...canonical]
}

/** Faculty available for batch assignment: fixture roster + issued faculty. */
function rosterFaculty() {
  const issued = Object.values(loadAccountsDb().accounts)
    .filter((record) => record && record.source === 'institute_issued' && record.role === 'faculty')
    .map((record) => ({
      id: record.instituteId,
      name: record.name,
      initials: record.initials,
      email: record.email,
      subjectIds: /** @type {string[]} */ ([]),
      designation: 'Faculty member',
      joinedAt: String(record.createdAt ?? '').slice(0, 10),
      batchesTaught: 0,
      status: /** @type {const} */ ('active'),
    }))
  return [...facultyRoster, ...issued]
}

/** Live seat counts and faculty names derived from the merged roster. */
function batches(store) {
  const people = roster(store)
  return adminBatches.map((batch) => ({
    ...batch,
    studentCount: people.filter((person) => person.role === 'student' && person.batchId === batch.id).length,
    facultyIds: store.batchFaculty[batch.id] ?? batch.facultyIds,
    leadFacultyName: rosterFaculty().find((faculty) => faculty.id === (store.batchFaculty[batch.id] ?? batch.facultyIds)[0])?.name ?? 'Unassigned',
    facultyNames: (store.batchFaculty[batch.id] ?? batch.facultyIds).map((id) => rosterFaculty().find((faculty) => faculty.id === id)?.name ?? id),
  }))
}

/** @param {string} key @param {Record<string, unknown>} patch */
function patchAccountRecord(key, patch, db = loadAccountsDb()) {
  const record = db.accounts[key] ?? accountByIdentifier(key, db)
  if (!record) return null
  const updated = { ...record, ...patch }
  saveAccountsDb({ ...db, accounts: { ...db.accounts, [record.key]: updated } })
  return updated
}

/**
 * Keep the loginable user projection in sync with Admin profile edits. Only
 * metadata is touched — never a digest, salt or credential.
 * @param {string} key @param {Record<string, unknown>} patch
 */
function patchAuthUser(key, patch) {
  try {
    const raw = localStorage.getItem(AUTH_DB_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    const entry = parsed?.accounts?.[key]
    if (!entry?.user) return
    entry.user = { ...entry.user, ...patch }
    localStorage.setItem(AUTH_DB_KEY, JSON.stringify(parsed))
  } catch { /* Best-effort mock storage; the registry remains the source of truth. */ }
}

/** Explicit unlock clears ONLY the failed-attempt counter (R-8). */
function clearFailedAttempts(key) {
  try {
    const raw = localStorage.getItem(AUTH_DB_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!parsed?.attempts) return
    delete parsed.attempts[key]
    localStorage.setItem(AUTH_DB_KEY, JSON.stringify(parsed))
  } catch { /* Best-effort mock storage. */ }
}

/* Atomic pre-validation + snapshot. A failure at any point restores the exact
 * prior bytes of all three localStorage ledgers. This is a single-tab mock
 * guarantee, not a transactional database: no cross-tab isolation is claimed. */
function snapshotAccountStores() {
  const read = (/** @type {string} */ key) => {
    try { return localStorage.getItem(key) } catch { return null }
  }
  return {
    [ACCOUNTS_STORAGE_KEY]: read(ACCOUNTS_STORAGE_KEY),
    [AUTH_DB_KEY]: read(AUTH_DB_KEY),
    [STORAGE_KEY]: read(STORAGE_KEY),
  }
}

function restoreAccountStores(snapshot) {
  const write = (/** @type {string} */ key, /** @type {string|null} */ value) => {
    try {
      if (value === null) localStorage.removeItem(key)
      else localStorage.setItem(key, value)
    } catch { /* Storage unavailable: report honestly, do not pretend success. */ }
  }
  for (const [key, value] of Object.entries(snapshot)) write(key, value)
}

/** Mock-only fault injection so the rollback contract is testable. */
let accountWriteProbe = null
/** @param {((phase: string) => void) | null} fn */
export function setAccountWriteProbe(fn) {
  accountWriteProbe = fn ?? null
}

/** @param {(probe: (phase: string) => void) => Promise<unknown>} operation */
function withAccountSnapshot(operation) {
  const snapshot = snapshotAccountStores()
  const probe = (/** @type {string} */ phase) => { if (accountWriteProbe) accountWriteProbe(phase) }
  return Promise.resolve()
    .then(() => operation(probe))
    .catch((error) => {
      restoreAccountStores(snapshot)
      throw error
    })
}

/** @param {string} role */
function assertYearConfigured(role) {
  const config = instituteIdConfig()
  if (role === 'student' && !YEAR_RE.test(String(config.year ?? ''))) {
    throw serviceError('institute_year_not_configured', 'The institute must supply its two-digit year token before student accounts can be created. Configure it in Institute ID settings.', 409)
  }
}

/**
 * Institute-wide uniqueness. Email and roll number are checked against the
 * merged roster, the canonical registry and the four demo seats.
 * @param {string} email
 * @param {string} rollNumber
 * @param {{ excludeKey?: string }} [options]
 */
function assertIdentityAvailable(email, rollNumber, { excludeKey = '' } = {}) {
  const normalised = lowerEmail(email)
  if (!normalised || !EMAIL_RE.test(normalised)) throw serviceError('email_invalid', 'Enter a valid email address for this account.', 400)
  const db = loadAccountsDb()
  const candidates = [...roster(readStore()), ...Object.values(db.accounts), ...Object.values(fixtureUsers)]
  const isOther = (/** @type {any} */ record) => {
    const key = String(record?.key ?? '')
    const id = String(record?.instituteId ?? record?.id ?? '')
    return key !== excludeKey && id !== excludeKey
  }
  if (candidates.some((record) => isOther(record) && lowerEmail(record.email) === normalised)) {
    throw serviceError('duplicate_email', 'That email already belongs to an institute account. Use a different address.', 409)
  }
  const roll = upperRoll(rollNumber)
  if (roll) {
    if (!/^[A-Z0-9][A-Z0-9-]{0,23}$/.test(roll)) throw serviceError('roll_number_invalid', 'Roll numbers may contain letters, digits and hyphens only (24 characters at most).', 400)
    if (candidates.some((record) => isOther(record) && upperRoll(record.rollNumber) === roll && roll)) {
      throw serviceError('duplicate_roll_number', 'That roll number is already assigned in this institute.', 409)
    }
  }
}

/** @param {string} accountKey */
function issuedAccount(accountKey) {
  const key = normalizeAccountKey(String(accountKey ?? ''))
  const db = loadAccountsDb()
  const record = key ? accountByIdentifier(key, db) : null
  if (!record) throw notFound('account')
  if (record.source !== 'institute_issued' || record.role === 'admin') {
    throw serviceError('operation_not_available', 'This row is a demo fixture. Only institute-issued student and faculty accounts can be managed here.', 409)
  }
  return record
}

/** @param {unknown} value */
function requiredReason(value) {
  const reason = String(value ?? '').trim()
  if (!reason) throw serviceError('reason_required', 'A reason is required. It is recorded in the audit ledger.', 400)
  if (reason.length > 240) throw serviceError('reason_too_long', 'Keep the reason under 240 characters.', 400)
  return reason
}

/** U-1 CSV credential row — transient, never persisted or cached. */
function credentialRow(record, temporaryPassword) {
  return {
    instituteId: record.instituteId,
    temporaryPassword,
    role: record.role,
    name: record.name,
    batchName: record.batchName ?? null,
  }
}

const VERSION = 1
const DEFAULT_PAGE_SIZE = 25
const STORAGE_KEY = `vyuh.mock.admin.v${VERSION}`

/**
 * @typedef {Object} AdminStore
 * @property {number} version
 * @property {AdminUser[]} createdUsers
 * @property {Record<string, string[]>} batchFaculty
 * @property {Record<string, { status: 'approved'|'rejected', note: string|null, windowStart?: string, windowEnd?: string, decidedBy: string, decidedAt: string, overridden?: boolean }>} approvals
 * @property {Record<string, string|number>} policies
 * @property {PolicyChange[]} policyHistory
 * @property {Record<string, { decision: 'clear'|'warn'|'invalidate', note: string, decidedBy: string, decidedAt: string }>} integrity
 * @property {Record<string, { status: 'removed'|'dismissed'|'warned', note: string|null, decidedAt: string }>} moderation
 * @property {Partial<Branding>} branding
 * @property {AuditEntry[]} audit
 * @property {number} importSerial
 * @property {number} auditSerial
 */

/** @returns {AdminStore} */
function emptyStore() {
  return {
    version: VERSION,
    createdUsers: [],
    batchFaculty: {},
    approvals: {},
    policies: {},
    policyHistory: [],
    integrity: {},
    moderation: {},
    branding: {},
    audit: [],
    importSerial: 0,
    auditSerial: 0,
  }
}

/** @returns {AdminStore} */
function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw)
    if (parsed?.version !== VERSION) return emptyStore()
    const base = emptyStore()
    return {
      ...base,
      ...parsed.data,
      createdUsers: parsed.data?.createdUsers ?? [],
      batchFaculty: parsed.data?.batchFaculty ?? {},
      approvals: parsed.data?.approvals ?? {},
      policies: parsed.data?.policies ?? {},
      policyHistory: parsed.data?.policyHistory ?? [],
      integrity: parsed.data?.integrity ?? {},
      moderation: parsed.data?.moderation ?? {},
      branding: parsed.data?.branding ?? {},
      audit: parsed.data?.audit ?? [],
    }
  } catch {
    return emptyStore()
  }
}

/** @param {AdminStore} store */
function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, data: store }))
  } catch {
    /* The session continues in memory; storage is a convenience, not the truth. */
  }
}

function nowIso() {
  return new Date().toISOString()
}

/**
 * The whole ledger: what this seat did, then the seeded record, newest first.
 * @param {AdminStore} store
 */
function ledger(store) {
  return [...store.audit, ...auditSeed].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
}

/**
 * Append one entry. Every mutating method calls this exactly once, which is what
 * makes the audit page trustworthy in the demo.
 * @param {AdminStore} store
 * @param {Object} input
 * @param {string} input.action
 * @param {string} input.target
 * @param {string} input.summary
 * @param {string} [input.note]
 * @param {Record<string, unknown>} [input.meta]
 * @param {string} [input.reason]            Batch 3: recorded reason, never a secret.
 * @param {boolean} [input.requireReason]    Reject a missing reason service-side.
 * @param {{ id: string, name: string }} [input.actor]
 * @returns {AuditEntry}
 */
function recordAudit(store, { action, target, summary, note, meta, reason, requireReason = false, actor }) {
  const reasonText = String(reason ?? '').trim()
  if (requireReason && !reasonText) {
    throw serviceError('audit_reason_required', 'A reason is required before this action can be recorded.', 400)
  }
  const who = actor ?? adminActor()
  store.auditSerial += 1
  const entry = {
    id: `aud-${2000 + store.auditSerial}`,
    at: nowIso(),
    actorId: who.id,
    actorName: who.name,
    actorRole: 'admin',
    action,
    target,
    summary,
    note: note ?? reasonText,
    meta: { ...(meta ?? {}), ...(reasonText ? { reason: reasonText } : {}) },
  }
  store.audit.unshift(entry)
  return entry
}

/* `roster()` and `batches()` live in the Batch 3 identity-bridge block above. */

/** @param {AdminStore} store @param {string} id */
function batchById(store, id) {
  return batches(store).find((batch) => batch.id === id) ?? null
}

/** @param {AdminStore} store */
function policyList(store) {
  return adminPolicies.map((policy) => ({
    ...policy,
    value: store.policies[policy.id] ?? policy.value,
  }))
}

/** @param {AdminStore} store @param {string} id */
function policyById(store, id) {
  return policyList(store).find((policy) => policy.id === id) ?? null
}

/** @param {AdminStore} store */
function approvalList(store) {
  return approvalQueue.map((item) => {
    const override = store.approvals[item.examId]
    if (!override) return { ...item }
    return {
      ...item,
      status: override.status,
      note: override.note ?? item.note,
      windowStart: override.windowStart ?? item.windowStart,
      windowEnd: override.windowEnd ?? item.windowEnd,
      decidedBy: override.decidedBy,
      decidedAt: override.decidedAt,
    }
  })
}

/** @param {AdminStore} store */
function integrityList(store) {
  return integrityReports.map((report) => ({
    ...report,
    sessions: report.sessions.map((session) => {
      const decision = store.integrity[session.id]
      return decision
        ? { ...session, decision: decision.decision, note: decision.note, decidedBy: decision.decidedBy, decidedAt: decision.decidedAt }
        : { ...session, decision: null, note: null, decidedBy: null, decidedAt: null }
    }),
  }))
}

/** @param {AdminStore} store */
function moderationList(store) {
  return moderationQueue.map((item) => {
    const decision = store.moderation[item.id]
    return decision
      ? { ...item, status: decision.status, note: decision.note, decidedAt: decision.decidedAt }
      : { ...item }
  })
}

/** @param {AdminStore} store */
function brandingOf(store) {
  return { ...brandingDefaults, ...store.branding }
}

/**
 * Weighted attendance across active batches: a 148-student batch counts more
 * than a 92-student batch, which is what the office means by "the rate".
 * @param {AdminBatch[]} list
 */
function weightedAttendance(list) {
  const active = list.filter((batch) => batch.status === 'active')
  const students = active.reduce((sum, batch) => sum + batch.studentCount, 0)
  if (students === 0) return 0
  const weighted = active.reduce((sum, batch) => sum + batch.attendancePercent * batch.studentCount, 0)
  return Math.round((weighted / students) * 10) / 10
}

/** @param {number} value */
function oneDecimal(value) {
  return Math.round(value * 10) / 10
}

/** @param {string[]} values */
function initialsFor(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** @param {string} iso */
function dateOnly(iso) {
  return String(iso).slice(0, 10)
}

/** @param {AdminUser[]} users */
function userFacets(users) {
  const count = (/** @type {AdminUser[]} */ list) => list.length
  return {
    roles: [
      { value: 'student', label: 'Student', count: count(users.filter((user) => user.role === 'student')) },
      { value: 'faculty', label: 'Faculty', count: count(users.filter((user) => user.role === 'faculty')) },
      { value: 'admin', label: 'Academic office', count: count(users.filter((user) => user.role === 'admin')) },
    ],
    statuses: PEOPLE_STATUSES.map((status) => ({
      value: status,
      label: accountStatusLabels[status] ?? status[0].toUpperCase() + status.slice(1),
      count: count(users.filter((user) => user.status === status)),
    })),
    batches: adminBatches.map((batch) => ({
      value: batch.id,
      label: batch.name,
      count: count(users.filter((user) => user.batchId === batch.id)),
    })),
  }
}

/** @type {AdminService} */
export const adminService = {
  /* ── Dashboard ───────────────────────────────────────────────────────── */

  getDashboard() {
    return simulate(() => {
      const store = readStore()
      const users = roster(store)
      const list = batches(store)
      const active = list.filter((batch) => batch.status === 'active')
      const students = users.filter((user) => user.role === 'student').length
      const attendance = weightedAttendance(list)
      const previous = attendanceTrend[attendanceTrend.length - 2]?.percent ?? attendance
      const now = Date.now()
      const weekAhead = now + 7 * 24 * 60 * 60 * 1000
      const upcoming = adminExamCalendar
        .filter((exam) => {
          const at = new Date(exam.date).getTime()
          return at >= now - 3 * 60 * 60 * 1000 && at <= weekAhead
        })
        .sort((a, b) => (a.date < b.date ? -1 : 1))

      const pendingApprovals = approvalList(store).filter((item) => item.status === 'pending').length
      const openFlags = integrityList(store)
        .flatMap((report) => report.sessions)
        .filter((session) => !session.decision).length

      const next = upcoming.find((exam) => exam.status !== 'live')

      return {
        instituteName: brandingOf(store).instituteName,
        termLabel: adminTerm.label,
        centre: adminTerm.centre,
        generatedAt: adminTerm.lastSyncedAt,
        stats: [
          {
            key: 'students',
            label: 'Students on the platform',
            value: students,
            detail: `${active.length} active batches · ${users.filter((user) => user.status === 'invited').length} invitations pending`,
            trend: 'up',
            trendLabel: '+18 this month',
            to: '/admin/users',
          },
          {
            key: 'batches',
            label: 'Active batches',
            value: active.length,
            detail: `${list.length - active.length} archived · ${list.reduce((sum, batch) => sum + batch.studentCount, 0)} seats allocated`,
            trend: 'flat',
            trendLabel: 'No change this week',
            to: '/admin/batches',
          },
          {
            key: 'attendance',
            label: 'Attendance rate',
            value: attendance,
            unit: '%',
            digits: 1,
            detail: 'Weighted across active batches, last full week',
            trend: attendance >= previous ? 'up' : 'down',
            trendLabel: `${attendance >= previous ? '+' : ''}${oneDecimal(attendance - previous)} points vs the week before`,
            to: '/admin/reports',
          },
          {
            key: 'exams',
            label: 'Exams in the next 7 days',
            value: upcoming.filter((exam) => exam.status !== 'completed').length,
            detail: next ? `Next: ${next.title} on ${new Date(next.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' })}` : 'Nothing scheduled',
            trend: pendingApprovals ? 'down' : 'flat',
            trendLabel: pendingApprovals ? `${pendingApprovals} papers still awaiting approval` : 'All scheduled papers are approved',
            to: '/admin/approvals',
          },
        ],
        attendanceTrend,
        calendar: upcoming.slice(0, 6),
        alerts: adminAlerts,
        pendingApprovals,
        openFlags,
      }
    })
  },

  /* ── Users ───────────────────────────────────────────────────────────── */

  listUsers(_adminId, query = {}) {
    return simulate(() => {
      const store = readStore()
      const all = roster(store)
      const search = String(query.search ?? '').trim().toLowerCase()
      const pageSize = Math.min(100, Math.max(5, Number(query.pageSize) || DEFAULT_PAGE_SIZE))
      const page = Math.max(1, Number(query.page) || 1)

      const filtered = all.filter((user) => {
        if (query.role && query.role !== 'all' && user.role !== query.role) return false
        if (query.batchId && query.batchId !== 'all' && user.batchId !== query.batchId) return false
        if (query.status && query.status !== 'all' && user.status !== query.status) return false
        if (!search) return true
        return [user.name, user.email, user.rollNumber ?? '', user.batchName ?? '']
          .some((value) => value.toLowerCase().includes(search))
      })

      const sort = query.sort ?? 'name'
      filtered.sort((a, b) => {
        if (sort === 'joined') return a.joinedAt < b.joinedAt ? 1 : a.joinedAt > b.joinedAt ? -1 : 0
        if (sort === 'lastActive') return String(b.lastActiveAt ?? '').localeCompare(String(a.lastActiveAt ?? ''))
        return a.name.localeCompare(b.name)
      })

      const start = (page - 1) * pageSize
      return {
        items: filtered.slice(start, start + pageSize).map((entry) => ({
          ...entry,
          actionLabel: AUDIT_ACTIONS[entry.action]?.label ?? entry.action,
        })),
        total: filtered.length,
        page,
        pageSize,
        pageCount: pageCount(filtered.length, pageSize),
        facets: userFacets(all),
        counts: {
          students: all.filter((user) => user.role === 'student').length,
          faculty: all.filter((user) => user.role === 'faculty').length,
          admins: all.filter((user) => user.role === 'admin').length,
          invited: all.filter((user) => user.status === 'invited').length,
          suspended: all.filter((user) => user.status === 'suspended').length,
          locked: all.filter((user) => user.status === 'locked').length,
          archived: all.filter((user) => user.status === 'archived').length,
        },
      }
    })
  },

  /* ── CSV import ──────────────────────────────────────────────────────── */

  getImportTemplate() {
    return simulate(() => ({
      fields: IMPORT_FIELDS,
      aliases: IMPORT_HEADER_ALIASES,
      samples: importSamples,
      maxRows: IMPORT_MAX_ROWS,
      fileName: importSampleFileName,
    }), { min: 80, max: 180 })
  },

  previewImport(_adminId, input) {
    return simulate(() => {
      const store = readStore()
      return validateImport({
        csv: input?.csv ?? '',
        mapping: input?.mapping ?? {},
        users: roster(store),
        batches: batches(store),
        fixes: input?.fixes ?? {},
        skipped: input?.skipped ?? [],
      })
    }, { min: 120, max: 320 })
  },

  /**
   * BATCH 3 (WS8) — import-to-account bridge. Every ready row becomes a real,
   * loginable `institute_issued` account with a real Institute ID and a
   * transient one-time credential. No `invited` placeholder rows are written.
   * Pre-validation happens BEFORE any write; `withAccountSnapshot` rolls the
   * three ledgers back if any later step fails.
   */
  commitImport(_adminId, input) {
    return simulate(() => withAccountSnapshot(async (probe) => {
      requireAdminActor()
      const store = readStore()
      const preview = validateImport({
        csv: input?.csv ?? '',
        mapping: input?.mapping ?? {},
        users: roster(store),
        batches: batches(store),
        fixes: input?.fixes ?? {},
        skipped: input?.skipped ?? [],
      })

      if (preview.summary.ready === 0) {
        throw serviceError('import_empty', 'No row is ready to import. Fix the errors or skip the rows, then try again.', 409)
      }
      if (preview.summary.invalid > 0) {
        throw serviceError(
          'import_invalid',
          `${preview.summary.invalid} row${preview.summary.invalid === 1 ? '' : 's'} still have errors. Fix them, or tick Skip on the row, before committing.`,
          409,
        )
      }

      const byName = new Map(batches(store).map((batch) => [batch.name, batch]))
      const config = instituteConfigView()
      /** @type {Array<{ values: Record<string, string>, role: 'student'|'faculty', batchId: string|null, batchName: string|null }>} */
      const prepared = []
      const seenEmails = new Set()
      const seenRolls = new Set()

      /* Pass 1 — pre-validate everything before the first write. */
      for (const row of preview.rows) {
        if (row.status !== 'ready') continue
        const role = /** @type {'student'|'faculty'} */ (row.values.role === 'faculty' ? 'faculty' : 'student')
        if (role === 'student' && !config.studentCreationAvailable) {
          throw serviceError('institute_year_not_configured', 'Student rows need the institute-supplied year token. Configure it in Institute ID settings before committing.', 409)
        }
        const email = lowerEmail(row.values.email)
        const roll = upperRoll(row.values.rollNumber)
        if (seenEmails.has(email)) throw serviceError('duplicate_email', `Sheet line ${row.line}: ${email} appears twice in this file.`, 409)
        if (roll && seenRolls.has(roll)) throw serviceError('duplicate_roll_number', `Sheet line ${row.line}: ${roll} appears twice in this file.`, 409)
        assertIdentityAvailable(email, roll)
        const batch = role === 'student' && row.values.batch ? byName.get(row.values.batch) : null
        if (role === 'student' && !batch) throw serviceError('batch_required', `Sheet line ${row.line}: choose a batch from the batch list.`, 400)
        seenEmails.add(email)
        if (roll) seenRolls.add(roll)
        prepared.push({
          values: { ...row.values },
          role,
          batchId: batch?.id ?? null,
          batchName: batch?.name ?? null,
        })
      }

      probe('pre-validated')
      const created = []
      const credentials = []
      for (let index = 0; index < prepared.length; index += 1) {
        const entry = prepared[index]
        const values = instituteAccountInputSchema.parse({
          role: entry.role,
          name: entry.values.name,
          email: entry.values.email,
          phone: entry.values.phone || undefined,
          batchId: entry.batchId ?? undefined,
          batchName: entry.batchName ?? undefined,
        })
        probe(`provision-${index + 1}`)
        const provisioned = await provisionInstituteAccount(values)
        const patched = patchAccountRecord(provisioned.account.key, {
          rollNumber: entry.values.rollNumber || null,
          phone: entry.values.phone || null,
        })
        created.push({ name: values.name, account: patched ?? provisioned.account })
        credentials.push(credentialRow(patched ?? provisioned.account, provisioned.credentials.temporaryPassword))
      }

      probe('provisioned')
      const audit = recordAudit(store, {
        action: 'user.import',
        target: input?.fileName || 'Pasted CSV',
        summary: `${created.length} account${created.length === 1 ? '' : 's'} created from ${input?.fileName || 'a pasted sheet'}; ${preview.summary.skipped} row${preview.summary.skipped === 1 ? '' : 's'} skipped.`,
        reason: `CSV account import committed by ${adminActor().name}.`,
        requireReason: true,
        meta: { created: created.length, skipped: preview.summary.skipped, fileName: input?.fileName ?? null },
      })

      writeStore(store)
      return {
        created: created.length,
        skipped: preview.summary.skipped,
        invalid: preview.summary.invalid,
        names: created.map((entry) => entry.name),
        auditId: audit.id,
        /* TRANSIENT: returned in memory only; never cached, logged or persisted. */
        credentials,
      }
    }))
  },

  /* ── Batches ─────────────────────────────────────────────────────────── */

  listAdminBatches() {
    return simulate(() => {
      const store = readStore()
      const list = batches(store)
      return list
        .slice()
        .sort((a, b) => (a.status === b.status ? b.studentCount - a.studentCount : a.status === 'active' ? -1 : 1))
        .map((batch) => ({
          ...batch,
          leadFacultyName: rosterFaculty().find((faculty) => faculty.id === batch.facultyIds[0])?.name ?? 'Unassigned',
          facultyNames: batch.facultyIds
            .map((id) => rosterFaculty().find((faculty) => faculty.id === id)?.name ?? id)
            .filter(Boolean),
        }))
    })
  },

  getAdminBatch(_adminId, batchId) {
    return simulate(() => {
      const store = readStore()
      const batch = batchById(store, batchId)
      if (!batch) throw notFound('batch')

      const threshold = Number(policyById(store, 'attendance-threshold')?.value ?? 75)
      const members = roster(store)
        .filter((user) => user.batchId === batch.id)
        .sort((a, b) => String(a.rollNumber ?? '').localeCompare(String(b.rollNumber ?? '')))
        .map((user, index) => {
          /* BATCH 3.1 (WS9 / R-5): a real institute-issued student has NO
             attendance records yet. Never invent a percentage from the row's
             position in the roster; report an honest unavailable value. The
             seeded demo members keep their existing illustrative figures. */
          const attendancePercent = user.source === 'institute_issued' ? null : 62 + ((index * 7) % 37)
          return {
            id: user.id,
            name: user.name,
            initials: user.initials,
            rollNumber: user.rollNumber ?? '—',
            email: user.email,
            status: user.status,
            attendancePercent,
            lastActiveAt: user.lastActiveAt,
          }
        })

      const faculty = batch.facultyIds
        .map((id) => rosterFaculty().find((candidate) => candidate.id === id))
        .filter(Boolean)

      const availableFaculty = rosterFaculty()
        .filter((candidate) => !batch.facultyIds.includes(candidate.id))
        .sort((a, b) => a.name.localeCompare(b.name))

      const subjectRows = batch.subjectIds.map((subjectId) => {
        const subject = subjects.find((candidate) => candidate.id === subjectId)
        return {
          id: subjectId,
          name: subject?.name ?? subjectId,
          shortName: subject?.shortName ?? subjectId,
          chapterCount: chapters.filter((chapter) => chapter.subjectId === subjectId).length,
          facultyIds: batch.facultyIds.filter((id) => rosterFaculty().find((candidate) => candidate.id === id)?.subjectIds.includes(subjectId)),
        }
      })

      return {
        batch,
        members,
        subjects: subjectRows,
        faculty,
        availableFaculty,
        summary: {
          sessionsHeld: batch.status === 'archived' ? 34 : 42,
          averageAttendance: members.some((member) => member.attendancePercent === null) ? null : batch.attendancePercent,
          defaulters: members.filter((member) => typeof member.attendancePercent === 'number' && member.attendancePercent < threshold).length,
          questionsAuthored: batch.examCount * 75,
        },
      }
    })
  },

  saveBatchFaculty(_adminId, batchId, facultyIds) {
    return simulate(() => {
      const store = readStore()
      const batch = batchById(store, batchId)
      if (!batch) throw notFound('batch')

      const unique = [...new Set((facultyIds ?? []).map(String))]
      if (unique.length === 0) throw serviceError('faculty_required', 'A batch needs at least one faculty member assigned. Add one before saving.', 400)
      const unknown = unique.filter((id) => !rosterFaculty().some((faculty) => faculty.id === id))
      if (unknown.length > 0) throw serviceError('faculty_unknown', `That faculty member is not on the roster: ${unknown.join(', ')}.`, 400)

      const before = batch.facultyIds
      const added = unique.filter((id) => !before.includes(id))
      const removed = before.filter((id) => !unique.includes(id))
      store.batchFaculty[batchId] = unique

      const nameOf = (id) => rosterFaculty().find((faculty) => faculty.id === id)?.name ?? id
      const parts = []
      if (added.length) parts.push(`${added.map(nameOf).join(', ')} added`)
      if (removed.length) parts.push(`${removed.map(nameOf).join(', ')} removed`)

      recordAudit(store, {
        action: 'batch.faculty',
        target: batch.name,
        summary: parts.length ? `Faculty assignment changed: ${parts.join('; ')}.` : 'Faculty assignment saved with no change.',
        note: `The batch now carries ${unique.length} faculty member${unique.length === 1 ? '' : 's'}.`,
        meta: { batchId, added, removed },
      })

      writeStore(store)
      return batchById(store, batchId)
    })
  },

  /* ── Exam approvals ──────────────────────────────────────────────────── */

  listApprovals(_adminId, filter = {}) {
    return simulate(() => {
      const store = readStore()
      const list = approvalList(store)
      const status = filter?.status ?? 'all'
      const items = status === 'all' ? list : list.filter((item) => item.status === status)
      return items.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (b.status === 'pending' && a.status !== 'pending') return 1
        return a.windowStart < b.windowStart ? -1 : 1
      })
    })
  },

  decideApproval(_adminId, examId, input) {
    return simulate(() => {
      const store = readStore()
      const item = approvalList(store).find((candidate) => candidate.examId === examId)
      if (!item) throw notFound('submitted paper')

      const decision = input?.decision
      const note = String(input?.note ?? '').trim()
      if (!['approve', 'reject', 'schedule'].includes(decision)) {
        throw serviceError('decision_invalid', 'A decision must be approve, reject or schedule.', 400)
      }
      if (decision !== 'schedule' && item.status !== 'pending') {
        throw serviceError('already_decided', 'This paper has already been decided. Only its schedule can still be overridden.', 409)
      }
      if (decision === 'reject' && note.length === 0) {
        throw serviceError('note_required', 'A rejection needs a note. The note is what the faculty receives, so say what to change.', 400)
      }

      /** @type {typeof store.approvals[string]} */
      const record = {
        status: 'approved',
        note: note || null,
        decidedBy: adminProfile.name,
        decidedAt: nowIso(),
      }

      if (decision === 'reject') {
        record.status = 'rejected'
      }

      if (decision === 'schedule') {
        const windowStart = String(input?.windowStart ?? '').trim()
        const windowEnd = String(input?.windowEnd ?? '').trim()
        if (!windowStart || !windowEnd) {
          throw serviceError('window_required', 'A schedule override needs both a start and an end.', 400)
        }
        if (new Date(windowEnd).getTime() <= new Date(windowStart).getTime()) {
          throw serviceError('window_invalid', 'The window must end after it starts.', 400)
        }
        /** The office types IST wall-clock time; a value with no offset is IST. */
        const asIso = (value) => {
          const normalised = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00+05:30` : value
          const parsed = new Date(normalised)
          if (Number.isNaN(parsed.getTime())) throw serviceError('window_invalid', 'That window is not a date we can read.', 400)
          return parsed.toISOString()
        }
        record.status = 'approved'
        record.windowStart = asIso(windowStart)
        record.windowEnd = asIso(windowEnd)
        record.overridden = true
        record.note = note || 'Schedule overridden by the academic office.'
      }

      store.approvals[examId] = record

      const action = decision === 'reject' ? 'approval.reject' : decision === 'schedule' ? 'approval.schedule' : 'approval.approve'
      recordAudit(store, {
        action,
        target: item.title,
        summary:
          decision === 'reject'
            ? `Paper returned to ${item.facultyName}.`
            : decision === 'schedule'
              ? `Window set to ${new Date(record.windowStart ?? '').toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}.`
              : `Paper approved for the ${new Date(record.windowStart ?? item.windowStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' })} window.`,
        note,
        meta: { examId, decision },
      })

      writeStore(store)
      return approvalList(store).find((candidate) => candidate.examId === examId)
    })
  },

  /* ── Policies ────────────────────────────────────────────────────────── */

  listPolicies() {
    return simulate(() => {
      const store = readStore()
      return policyList(store).map((policy) => ({
        ...policy,
        scopeLabel: policyScopeLabels[policy.scope],
        valueLabel: formatPolicyValue(policy, policy.value),
      }))
    })
  },

  getPolicyImpact(_adminId, key, value) {
    return simulate(() => {
      const store = readStore()
      const policy = policyById(store, key)
      if (!policy) throw notFound('policy')
      const upcoming = adminExamCalendar.filter((exam) => ['scheduled', 'awaiting', 'live'].includes(exam.status)).length
      return policyImpact({
        policy,
        value: value ?? policy.value,
        batches: batches(store),
        users: roster(store),
        examCount: upcoming,
      })
    }, { min: 100, max: 250 })
  },

  listPolicyHistory() {
    return simulate(() => {
      const store = readStore()
      return [...store.policyHistory, ...policyHistory].sort((a, b) => (a.at < b.at ? 1 : -1))
    })
  },

  updatePolicy(_adminId, input) {
    return simulate(() => {
      const store = readStore()
      const policy = policyById(store, input?.key)
      if (!policy) throw notFound('policy')

      const raw = input?.value
      /** @type {string|number} */
      let value = raw
      if (policy.kind === 'number') {
        value = Number(raw)
        if (!Number.isFinite(value)) throw serviceError('value_invalid', 'That setting needs a number.', 400)
        if (policy.min !== undefined && value < policy.min) throw serviceError('value_out_of_range', `The lowest this setting may go is ${policy.min}${policy.unit ? ` ${policy.unit}` : ''}.`, 400)
        if (policy.max !== undefined && value > policy.max) throw serviceError('value_out_of_range', `The highest this setting may go is ${policy.max}${policy.unit ? ` ${policy.unit}` : ''}.`, 400)
      } else {
        value = String(raw)
        if (!policy.options?.some((option) => option.value === value)) {
          throw serviceError('value_invalid', 'Choose one of the listed options.', 400)
        }
      }

      const from = policy.value
      store.policies[policy.id] = value
      const change = {
        id: `pol-${Date.now().toString(36)}`,
        policyId: policy.id,
        from,
        to: value,
        at: nowIso(),
        actorName: adminProfile.name,
        note: String(input?.note ?? '').trim(),
      }
      store.policyHistory.unshift(change)

      recordAudit(store, {
        action: 'policy.update',
        target: `${policy.label} · ${formatPolicyValue(policy, value)}`,
        summary:
          String(from) === String(value)
            ? `${policy.label} reviewed and kept at ${formatPolicyValue(policy, from)}.`
            : `${policy.label} changed from ${formatPolicyValue(policy, from)} to ${formatPolicyValue(policy, value)}.`,
        note: change.note,
        meta: { policyId: policy.id, from, to: value },
      })

      writeStore(store)
      return { ...policyById(store, policy.id), scopeLabel: policyScopeLabels[policy.scope], valueLabel: formatPolicyValue(policy, value) }
    })
  },

  /* ── Integrity ───────────────────────────────────────────────────────── */

  listIntegrityReports() {
    return simulate(() => integrityList(readStore()))
  },

  getIntegrityReport(_adminId, examId) {
    return simulate(() => {
      const report = integrityList(readStore()).find((candidate) => candidate.examId === examId)
      if (!report) throw notFound('integrity report')
      return report
    })
  },

  decideIntegrity(_adminId, input) {
    return simulate(() => {
      const store = readStore()
      const report = integrityList(store).find((candidate) => candidate.examId === input?.examId)
      if (!report) throw notFound('integrity report')
      const session = report.sessions.find((candidate) => candidate.id === input?.sessionId)
      if (!session) throw notFound('flagged session')

      const decision = input?.decision
      if (!['clear', 'warn', 'invalidate'].includes(decision)) {
        throw serviceError('decision_invalid', 'A decision must clear, warn or invalidate.', 400)
      }
      const note = String(input?.note ?? '').trim()
      if (!note) {
        throw serviceError('note_required', 'Every integrity decision needs a note. It is the record the candidate and guardian are shown.', 400)
      }

      store.integrity[session.id] = {
        decision,
        note,
        decidedBy: adminProfile.name,
        decidedAt: nowIso(),
      }

      const action = `integrity.${decision}`
      recordAudit(store, {
        action,
        target: `${report.examTitle} · ${session.rollNumber}`,
        summary: `${AUDIT_ACTIONS[action]?.label ?? 'Decision'} for ${session.studentName}.`,
        note,
        meta: { examId: report.examId, sessionId: session.id, reasons: session.reasons },
      })

      writeStore(store)
      return integrityList(store).find((candidate) => candidate.examId === report.examId)
    })
  },

  /* ── Reports ─────────────────────────────────────────────────────────── */

  runReport(_adminId, request) {
    return simulate(() => {
      const store = readStore()
      const definition = reportDefinitions.find((candidate) => candidate.id === request?.kind)
      if (!definition) throw notFound('report')
      const format = reportFormats.find((candidate) => candidate.value === request?.format) ?? reportFormats[0]
      const from = String(request?.from ?? '')
      const to = String(request?.to ?? '')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        throw serviceError('range_invalid', 'Choose a start and an end date for the report.', 400)
      }
      if (from > to) throw serviceError('range_invalid', 'The end date must not be before the start date.', 400)

      const list = batches(store)
      const threshold = Number(policyById(store, 'attendance-threshold')?.value ?? 75)

      /** @type {Record<string, string|number>[]} */
      let rows = []
      if (definition.id === 'attendance') {
        rows = list.map((batch) => {
          const sessions = batch.status === 'archived' ? 34 : 42
          const present = Math.round(batch.studentCount * sessions * (batch.attendancePercent / 100))
          const defaulters = Math.round(batch.studentCount * ((100 - batch.attendancePercent) / 100) * 0.35)
          return {
            batch: batch.name,
            students: batch.studentCount,
            sessions,
            present,
            percent: `${batch.attendancePercent.toFixed(1)}%`,
            defaulters,
            note: batch.attendancePercent < threshold ? 'Below policy threshold' : '',
          }
        })
      } else if (definition.id === 'results') {
        const papers = [
          { paper: 'JEE Main 10 — Full syllabus', batch: 'Aarambh JEE 2026 — Evening', satAt: '04 Nov 2026', candidates: 158, mean: '171.4', highest: 268, passShare: '62%' },
          { paper: 'NEET Mock 06 — Full syllabus', batch: 'Aarogyam NEET 2026 — Morning', satAt: '06 Nov 2026', candidates: 131, mean: '148.2', highest: 216, passShare: '58%' },
          { paper: 'Shikhar Weekly 21 — Mechanics', batch: 'Shikhar Droppers — Full day', satAt: '27 Oct 2026', candidates: 92, mean: '68.9 / 120', highest: 108, passShare: '71%' },
          { paper: 'Prayas Unit Test 17 — Optics', batch: 'Prayas JEE 2027 — Morning', satAt: '24 Oct 2026', candidates: 144, mean: '52.1 / 100', highest: 94, passShare: '54%' },
        ]
        rows = papers.map((paper) => ({ ...paper, maxMarks: 300 }))
      } else {
        rows = list.map((batch, index) => ({
          batch: batch.name,
          activeAccounts: Math.round(batch.studentCount * 0.86),
          doubts: Math.round(batch.studentCount * 0.42),
          recordingHours: (batch.studentCount * 0.9).toFixed(1),
          liveMinutes: Math.round(batch.studentCount * 11.4),
          attentionAverage: `${(78 + index * 2.1).toFixed(1)}%`,
        }))
      }

      const csv = csvFromColumns(definition.columns, rows)

      recordAudit(store, {
        action: 'report.export',
        target: `${definition.label} report`,
        summary: `${definition.label} report produced for ${from} to ${to}.`,
        note: format.available ? 'CSV produced.' : `${format.label} requested; the mock produced CSV instead.`,
        meta: { kind: definition.id, from, to, format: format.value, rows: rows.length },
      })
      writeStore(store)

      return {
        kind: definition.id,
        kindLabel: definition.label,
        from,
        to,
        format: format.value,
        formatLabel: format.label,
        columns: definition.columns,
        rows,
        summary: {
          rows: rows.length,
          note: format.available
            ? `${rows.length} rows · CSV, UTF-8 with a header row.`
            : `${rows.length} rows · ${format.label} is not produced by the mock; the file is CSV.`,
        },
        csv,
        fileName: reportFileName(definition.id, from, to, format.value),
        generatedAt: nowIso(),
        formatAvailable: format.available,
      }
    })
  },

  /* ── Moderation ──────────────────────────────────────────────────────── */

  listModeration(_adminId, filter = {}) {
    return simulate(() => {
      const list = moderationList(readStore())
      return list
        .filter((item) => (filter?.kind && filter.kind !== 'all' ? item.kind === filter.kind : true))
        .filter((item) => (filter?.status && filter.status !== 'all' ? item.status === filter.status : true))
        .sort((a, b) => (a.reportedAt < b.reportedAt ? 1 : -1))
    })
  },

  decideModeration(_adminId, input) {
    return simulate(() => {
      const store = readStore()
      const item = moderationList(store).find((candidate) => candidate.id === input?.id)
      if (!item) throw notFound('reported item')

      const decision = input?.decision
      if (!['remove', 'dismiss', 'warn'].includes(decision)) {
        throw serviceError('decision_invalid', 'A moderation decision must remove, dismiss or warn.', 400)
      }
      const note = String(input?.note ?? '').trim()
      if (decision !== 'dismiss' && !note) {
        throw serviceError('note_required', 'Removing content or warning an author needs a note, so the decision can be explained later.', 400)
      }

      const status = decision === 'remove' ? 'removed' : decision === 'dismiss' ? 'dismissed' : 'warned'
      store.moderation[item.id] = { status, note: note || null, decidedAt: nowIso() }

      recordAudit(store, {
        action: `moderation.${decision}`,
        target: `${item.kind === 'doubt' ? 'Doubt' : 'Chat'} · ${item.batchName}`,
        summary:
          decision === 'remove'
            ? `Content by ${item.authorName} removed after a report of ${item.reason.toLowerCase()}.`
            : decision === 'warn'
              ? `${item.authorName} warned over ${item.reason.toLowerCase()}.`
              : `Report against ${item.authorName} dismissed.`,
        note,
        meta: { itemId: item.id, kind: item.kind, decision },
      })

      writeStore(store)
      return moderationList(store).find((candidate) => candidate.id === item.id)
    })
  },

  /* ── Audit ───────────────────────────────────────────────────────────── */

  listAudit(_adminId, query = {}) {
    return simulate(() => {
      const store = readStore()
      const all = ledger(store)
      const pageSize = Math.min(100, Math.max(5, Number(query.pageSize) || DEFAULT_PAGE_SIZE))
      const page = Math.max(1, Number(query.page) || 1)
      const search = String(query.search ?? '').trim().toLowerCase()

      const filtered = all.filter((entry) => {
        if (query.actorId && query.actorId !== 'all' && entry.actorId !== query.actorId) return false
        if (query.action && query.action !== 'all' && entry.action !== query.action) return false
        if (query.from && dateOnly(entry.at) < query.from) return false
        if (query.to && dateOnly(entry.at) > query.to) return false
        if (!search) return true
        return [entry.target, entry.summary, entry.note ?? '', entry.actorName].some((value) => value.toLowerCase().includes(search))
      })

      const start = (page - 1) * pageSize
      const actors = [...new Map(all.map((entry) => [entry.actorId, entry])).values()].map((entry) => ({
        value: entry.actorId,
        label: entry.actorName,
        count: all.filter((candidate) => candidate.actorId === entry.actorId).length,
      }))
      const actions = [...new Set(all.map((entry) => entry.action))].map((action) => ({
        value: action,
        label: AUDIT_ACTIONS[action]?.label ?? action,
        count: all.filter((candidate) => candidate.action === action).length,
      }))

      return {
        items: filtered.slice(start, start + pageSize).map((entry) => ({
          ...entry,
          actionLabel: AUDIT_ACTIONS[entry.action]?.label ?? entry.action,
        })),
        total: filtered.length,
        page,
        pageSize,
        pageCount: pageCount(filtered.length, pageSize),
        facets: { actors, actions },
      }
    })
  },

  /* ── Branding ────────────────────────────────────────────────────────── */

  getBranding() {
    return simulate(() => brandingOf(readStore()))
  },

  saveBranding(_adminId, input) {
    return simulate(() => {
      const store = readStore()
      const instituteName = String(input?.instituteName ?? '').trim()
      if (instituteName.length < 3) {
        throw serviceError('name_required', 'The institute name needs at least three characters; it is printed on every paper.', 400)
      }
      const shortName = String(input?.shortName ?? '').trim()
      if (!shortName) throw serviceError('short_name_required', 'A short name is used in the rail and on tight layouts.', 400)

      const previous = brandingOf(store)
      const next = {
        ...previous,
        instituteName,
        shortName,
        tagline: String(input?.tagline ?? '').trim(),
        logoFileName: input?.logoFileName ?? previous.logoFileName,
        logoMark: String(input?.logoMark ?? previous.logoMark ?? initialsFor(instituteName)).slice(0, 3).toUpperCase(),
        logoUpdatedAt: input?.logoFileName ? nowIso() : previous.logoUpdatedAt,
      }
      store.branding = next

      recordAudit(store, {
        action: 'settings.branding',
        target: 'Institute identity',
        summary:
          previous.instituteName !== next.instituteName
            ? `Institute renamed from ${previous.instituteName} to ${next.instituteName}.`
            : next.logoFileName && next.logoFileName !== previous.logoFileName
              ? `Logo replaced with ${next.logoFileName}.`
              : 'Branding reviewed and saved.',
        note: 'The colour system is locked to Vyuh’s paper, ink and ember tokens.',
        meta: { logoFileName: next.logoFileName, shortName: next.shortName },
      })

      writeStore(store)
      return clone(next)
    })
  },

  /* ── Batch 3 — Institute ID configuration (Admin only) ───────────────── */

  getInstituteIdConfig(_adminId) {
    return simulate(() => instituteConfigView(), { min: 60, max: 140 })
  },

  configureInstituteIds(_adminId, input) {
    return simulate(() => {
      requireAdminActor()
      const raw = input?.year
      const year = raw === null || raw === undefined || String(raw).trim() === '' ? null : String(raw).trim()
      if (year !== null && !YEAR_RE.test(year)) {
        throw serviceError('year_token_invalid', 'The year token is exactly two digits supplied by the institute, for example 26.', 400)
      }
      configureInstituteIds({ year })
      return instituteConfigView()
    }, { min: 80, max: 180 })
  },

  /** Non-mutating preview: uses issueInstituteId() without saving anything. */
  previewInstituteId(_adminId, input) {
    return simulate(() => {
      const role = input?.role
      if (role !== 'student' && role !== 'faculty') {
        throw serviceError('role_invalid', 'Choose student or faculty. Admin seats are not issued here.', 400)
      }
      const allocation = issueInstituteId(role, loadAccountsDb())
      return {
        ok: allocation.ok,
        instituteId: allocation.instituteId ?? null,
        code: allocation.code,
        message: allocation.message,
      }
    }, { min: 60, max: 140 })
  },

  /* ── Batch 3 — Creation (WS5) ────────────────────────────────────────── */

  createUser(_adminId, input) {
    return simulate(() => withAccountSnapshot(async (probe) => {
      requireAdminActor()
      const role = input?.role
      if (role !== 'student' && role !== 'faculty') {
        throw serviceError('role_invalid', 'Choose student or faculty. Admin-created Admin accounts are out of scope.', 400)
      }
      assertYearConfigured(role)
      /* Validate identity FIRST so an invalid address or a duplicate is rejected
         with a stable service error and no Institute ID is ever allocated. */
      const email = lowerEmail(input?.email)
      const roll = upperRoll(input?.rollNumber)
      assertIdentityAvailable(email, roll)
      const values = instituteAccountInputSchema.parse({
        role,
        name: input?.name ?? '',
        email: input?.email ?? '',
        phone: input?.phone || undefined,
      })

      let batchId = null
      let batchName = null
      if (role === 'student') {
        const batch = adminBatches.find((item) => item.id === input?.batchId && item.status === 'active')
        if (!batch) throw serviceError('batch_required', 'Choose an active batch for this student.', 400)
        batchId = batch.id
        batchName = batch.name
      }

      probe('pre-validated')
      const provisioned = await provisionInstituteAccount({ ...values, batchId: batchId ?? undefined, batchName: batchName ?? undefined })
      const patched = patchAccountRecord(provisioned.account.key, {
        rollNumber: roll || null,
        phone: values.phone || null,
      })
      const record = patched ?? provisioned.account
      probe('provisioned')

      const store = readStore()
      const audit = recordAudit(store, {
        action: 'user.create',
        target: `${record.name} · ${record.instituteId}`,
        summary: `${titleOf(role)} account created for ${record.name}${batchName ? ` in ${batchName}` : ''}. One-time credentials shown; first-login password change required.`,
        reason: `Institute ${role} account created by ${adminActor().name}.`,
        requireReason: true,
        meta: { instituteId: record.instituteId, role, batchId, rollNumber: roll || null },
      })
      writeStore(store)

      return {
        account: toPeopleRow(record),
        credentials: [credentialRow(record, provisioned.credentials.temporaryPassword)],
        auditId: audit.id,
      }
    }))
  },

  /** Credential sheet was displayed → metadata only. NEVER stores a value. */
  markCredentialsShown(_adminId, input) {
    return simulate(() => {
      requireAdminActor()
      const keys = Array.isArray(input?.accountKeys) ? input.accountKeys.map((key) => normalizeAccountKey(String(key))) : []
      const db = loadAccountsDb()
      let updated = 0
      const accounts = { ...db.accounts }
      for (const key of keys) {
        const record = key ? accountByIdentifier(key, db) : null
        if (!record || record.credentialDelivery !== 'pending') continue
        accounts[record.key] = { ...record, credentialDelivery: 'shown' }
        updated += 1
      }
      if (updated > 0) saveAccountsDb({ ...db, accounts })
      return { updated }
    }, { min: 40, max: 100 })
  },

  /* ── Batch 3 — Lifecycle (WS6) ───────────────────────────────────────── */

  applyAccountOperation(_adminId, operation, input) {
    return simulate(() => withAccountSnapshot(async (probe) => {
      requireAdminActor()
      const actions = {
        suspend: { action: 'user.suspend', next: 'suspended', from: ['active'], label: 'suspended' },
        reactivate: { action: 'user.reactivate', next: 'active', from: ['suspended'], label: 'reactivated' },
        /* Batch 2 ALLOWED_TRANSITIONS permits active→locked only; suspended→locked
           is NOT a legal transition. Do not offer or accept it (Gate 0 D-3). */
        lock: { action: 'user.lock', next: 'locked', from: ['active'], label: 'locked' },
        /* Unlock is the ONE approved action that clears a failed-attempt
           lockout. It also lifts a `locked` registry status when present. */
        unlock: { action: 'user.unlock', next: 'active', from: ['active', 'suspended', 'locked'], label: 'unlocked' },
        archive: { action: 'user.archive', next: 'archived', from: ['active', 'suspended', 'locked'], label: 'archived' },
      }
      const spec = actions[/** @type {keyof typeof actions} */ (operation)]
      if (!spec) throw serviceError('operation_invalid', 'That account operation is not supported.', 400)
      const reason = requiredReason(input?.reason)
      if (operation === 'archive' && input?.acknowledged !== true) {
        throw serviceError('archive_confirmation_required', 'Confirm the irreversible archive acknowledgement before continuing.', 409)
      }
      const record = issuedAccount(input?.accountKey)
      if (record.status === 'archived' && operation !== 'archive') {
        throw serviceError('account_archived', 'An archived account is terminal. Its Institute ID is never reused.', 409)
      }
      if (!spec.from.includes(record.status)) {
        throw serviceError('status_transition_invalid', `A ${accountStatusLabels[record.status] ?? record.status} account cannot be ${spec.label}.`, 409)
      }

      probe('pre-validated')
      /** @type {any} */
      let updated = record
      if (operation === 'unlock') {
        /* R-8: re-issue/recovery NEVER clears this; only this explicit action does.
           A `locked` status is lifted, an active/suspended account simply has its
           failed-attempt counter cleared without a redundant status change. */
        clearFailedAttempts(record.key)
        if (record.status === 'locked') {
          const result = transitionAccountStatus(record.key, 'active', loadAccountsDb())
          if (!result.ok) throw serviceError('status_transition_invalid', 'That status change is not permitted.', 409)
          updated = result.account
        } else {
          updated = accountByIdentifier(record.key, loadAccountsDb()) ?? record
        }
      } else {
        const result = transitionAccountStatus(record.key, spec.next, loadAccountsDb())
        if (!result.ok) throw serviceError('status_transition_invalid', 'That status change is not permitted.', 409)
        updated = result.account
      }
      probe('transitioned')

      const store = readStore()
      const audit = recordAudit(store, {
        action: spec.action,
        target: `${updated.name} · ${updated.instituteId}`,
        summary: `${titleOf(updated.role)} account ${spec.label}. Status: ${accountStatusLabels[record.status] ?? record.status} → ${accountStatusLabels[spec.next]}.`,
        reason,
        requireReason: true,
        meta: { instituteId: updated.instituteId, from: record.status, to: spec.next },
      })
      writeStore(store)
      /* D-2: `transitionAccountStatus()` returns a SAFE_ACCOUNT_FIELDS
         projection, which intentionally omits `phone`. Re-read the CANONICAL
         registry record so the operation result carries the same phone as the
         account list. `SAFE_ACCOUNT_FIELDS` is NOT broadened and the registry
         is unchanged. */
      const current = accountByIdentifier(record.key, loadAccountsDb()) ?? record
      return { account: toPeopleRow(current), auditId: audit.id }
    }))
  },

  /** Editable fields only; immutable instituteId/source/role are never accepted. */
  editAccount(_adminId, input) {
    return simulate(() => withAccountSnapshot(async (probe) => {
      requireAdminActor()
      const reason = requiredReason(input?.reason)
      const record = issuedAccount(input?.accountKey)
      if (record.status === 'archived') throw serviceError('account_archived', 'An archived account cannot be edited.', 409)

      const name = input?.name === undefined ? record.name : String(input.name).trim()
      if (name.length < 2 || name.length > 80) throw serviceError('name_invalid', 'Enter a name between 2 and 80 characters.', 400)
      const email = input?.email === undefined ? lowerEmail(record.email) : lowerEmail(input.email)
      const phone = input?.phone === undefined ? (record.phone ?? null) : String(input.phone).trim() || null
      const roll = input?.rollNumber === undefined
        ? (record.rollNumber ?? null)
        : (String(input.rollNumber).trim() ? upperRoll(input.rollNumber) : null)
      assertIdentityAvailable(email, roll ?? '', { excludeKey: record.key })

      probe('pre-validated')
      const updated = patchAccountRecord(record.key, { name, email, phone, rollNumber: roll }) ?? record
      patchAuthUser(record.key, { name, email, phone: phone ?? undefined })
      probe('updated')

      const store = readStore()
      const audit = recordAudit(store, {
        action: 'user.edit',
        target: `${updated.name} · ${updated.instituteId}`,
        summary: `Profile edited for ${updated.name}. Institute ID and role are unchanged.`,
        reason,
        requireReason: true,
        meta: { instituteId: updated.instituteId, fields: ['name', 'email', 'phone', 'rollNumber'] },
      })
      writeStore(store)
      return { account: toPeopleRow(updated), auditId: audit.id }
    }))
  },

  /** Dedicated batch move; past academic history is intentionally preserved. */
  moveStudentBatch(_adminId, input) {
    return simulate(() => withAccountSnapshot(async (probe) => {
      requireAdminActor()
      const reason = requiredReason(input?.reason)
      const record = issuedAccount(input?.accountKey)
      if (record.role !== 'student') throw serviceError('role_invalid', 'Only student accounts have a batch assignment.', 409)
      if (record.status === 'archived') throw serviceError('account_archived', 'An archived account cannot be moved.', 409)
      const batch = adminBatches.find((item) => item.id === input?.batchId && item.status === 'active')
      if (!batch) throw serviceError('batch_required', 'Choose an active destination batch.', 400)
      if (record.batchId === batch.id) throw serviceError('batch_unchanged', 'This student is already in that batch.', 409)

      probe('pre-validated')
      const updated = patchAccountRecord(record.key, { batchId: batch.id, batchName: batch.name }) ?? record
      patchAuthUser(record.key, { batchId: batch.id, batchName: batch.name })
      probe('updated')

      const store = readStore()
      const audit = recordAudit(store, {
        action: 'user.batch.move',
        target: `${updated.name} · ${updated.instituteId}`,
        summary: `Batch changed from ${record.batchName ?? 'no batch'} to ${batch.name}. Existing history is preserved.`,
        reason,
        requireReason: true,
        meta: { instituteId: updated.instituteId, fromBatchId: record.batchId ?? null, toBatchId: batch.id },
      })
      writeStore(store)
      return { account: toPeopleRow(updated), auditId: audit.id }
    }))
  },

  /** U-5 recovery: delegates ALL credential writes to the additive auth helper. */
  reissueTemporaryPassword(_adminId, input) {
    return simulate(() => withAccountSnapshot(async (probe) => {
      requireAdminActor()
      const reason = requiredReason(input?.reason)
      const record = issuedAccount(input?.accountKey)
      if (record.status === 'archived') throw serviceError('account_archived', 'An archived account cannot receive a new credential.', 409)

      probe('pre-validated')
      const reissued = await issueTemporaryPassword({ targetAccountKey: record.key, reason, actorId: adminActor().id })
      probe('reissued')

      const store = readStore()
      const audit = recordAudit(store, {
        action: 'user.credential.reissue',
        target: `${record.name} · ${record.instituteId}`,
        summary: `A new temporary password was issued for ${record.name} and shown once. First-login password change is required again; lockout state was not cleared.`,
        reason,
        requireReason: true,
        meta: { instituteId: record.instituteId, clearAttempts: false },
      })
      writeStore(store)
      return {
        account: toPeopleRow(accountByIdentifier(record.key, loadAccountsDb()) ?? reissued.account),
        credentials: [credentialRow(record, reissued.credentials.temporaryPassword)],
        auditId: audit.id,
      }
    }))
  },
}
