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
} from '../../mock-data/index.js'
import { csvFromColumns, formatPolicyValue, pageCount, policyImpact, reportFileName, validateImport } from '../../shared/lib/adminMath.js'
import { notFound, serviceError } from './errors.js'

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
 * @returns {AuditEntry}
 */
function recordAudit(store, { action, target, summary, note, meta }) {
  store.auditSerial += 1
  const entry = {
    id: `aud-${2000 + store.auditSerial}`,
    at: nowIso(),
    actorId: adminProfile.id,
    actorName: adminProfile.name,
    actorRole: 'admin',
    action,
    target,
    summary,
    note: note ?? '',
    meta: meta ?? {},
  }
  store.audit.unshift(entry)
  return entry
}

/** @param {AdminStore} store */
function roster(store) {
  return [...adminUsers, ...store.createdUsers]
}

/** @param {AdminStore} store */
function batches(store) {
  return adminBatches.map((batch) => ({
    ...batch,
    facultyIds: store.batchFaculty[batch.id] ?? batch.facultyIds,
  }))
}

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
    statuses: [
      { value: 'active', label: 'Active', count: count(users.filter((user) => user.status === 'active')) },
      { value: 'invited', label: 'Invited', count: count(users.filter((user) => user.status === 'invited')) },
      { value: 'suspended', label: 'Suspended', count: count(users.filter((user) => user.status === 'suspended')) },
    ],
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

  commitImport(_adminId, input) {
    return simulate(() => {
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
      /** @type {Array<{ line: number, user: AdminUser }>} */
      const created = []
      for (const row of preview.rows) {
        if (row.status !== 'ready') continue
        store.importSerial += 1
        const serial = String(store.importSerial).padStart(4, '0')
        const role = row.values.role === 'faculty' ? 'faculty' : 'student'
        const batch = row.values.batch ? byName.get(row.values.batch) : null
        created.push({
          line: row.line,
          user: {
            id: `${role === 'faculty' ? 'fac' : 'stu'}-imp-${serial}`,
            name: row.values.name,
            initials: initialsFor(row.values.name),
            email: row.values.email,
            phone: row.values.phone ? `+91${row.values.phone}` : '',
            role,
            status: 'invited',
            batchId: role === 'student' ? batch?.id ?? null : null,
            batchName: role === 'student' ? batch?.name ?? null : null,
            rollNumber: row.values.rollNumber || null,
            joinedAt: row.values.joinedAt || dateOnly(nowIso()),
            lastActiveAt: null,
          },
        })
      }

      store.createdUsers.push(...created.map((entry) => entry.user))

      const audit = recordAudit(store, {
        action: 'import.commit',
        target: input?.fileName || 'Pasted CSV',
        summary: `${created.length} account${created.length === 1 ? '' : 's'} created from ${input?.fileName || 'a pasted sheet'}; ${preview.summary.skipped} row${preview.summary.skipped === 1 ? '' : 's'} skipped.`,
        note: `Columns mapped: ${Object.entries(input?.mapping ?? {}).filter(([, header]) => header).map(([field]) => field).join(', ')}.`,
        meta: { created: created.length, skipped: preview.summary.skipped, fileName: input?.fileName ?? null },
      })

      writeStore(store)

      return {
        created: created.length,
        skipped: preview.summary.skipped,
        invalid: preview.summary.invalid,
        names: created.map((entry) => entry.user.name),
        auditId: audit.id,
      }
    })
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
          leadFacultyName: facultyRoster.find((faculty) => faculty.id === batch.facultyIds[0])?.name ?? 'Unassigned',
          facultyNames: batch.facultyIds
            .map((id) => facultyRoster.find((faculty) => faculty.id === id)?.name ?? id)
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
          const attendancePercent = 62 + ((index * 7) % 37)
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
        .map((id) => facultyRoster.find((candidate) => candidate.id === id))
        .filter(Boolean)

      const availableFaculty = facultyRoster
        .filter((candidate) => !batch.facultyIds.includes(candidate.id))
        .sort((a, b) => a.name.localeCompare(b.name))

      const subjectRows = batch.subjectIds.map((subjectId) => {
        const subject = subjects.find((candidate) => candidate.id === subjectId)
        return {
          id: subjectId,
          name: subject?.name ?? subjectId,
          shortName: subject?.shortName ?? subjectId,
          chapterCount: chapters.filter((chapter) => chapter.subjectId === subjectId).length,
          facultyIds: batch.facultyIds.filter((id) => facultyRoster.find((candidate) => candidate.id === id)?.subjectIds.includes(subjectId)),
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
          averageAttendance: batch.attendancePercent,
          defaulters: members.filter((member) => member.attendancePercent < threshold).length,
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
      const unknown = unique.filter((id) => !facultyRoster.some((faculty) => faculty.id === id))
      if (unknown.length > 0) throw serviceError('faculty_unknown', `That faculty member is not on the roster: ${unknown.join(', ')}.`, 400)

      const before = batch.facultyIds
      const added = unique.filter((id) => !before.includes(id))
      const removed = before.filter((id) => !unique.includes(id))
      store.batchFaculty[batchId] = unique

      const nameOf = (id) => facultyRoster.find((faculty) => faculty.id === id)?.name ?? id
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
}
