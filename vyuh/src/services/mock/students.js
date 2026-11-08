import {
  currentStudent, users, institute, batches, studentBatchId, exams, attempts, lastReport, scoreTrend,
  subjectStrength, recordings, liveSessions, studyLog, announcements,
  notifications, defaultPreferences, simulate, configuredQuestionCount, attendancePeriodLabel,
  examDefinitionById, withExamDefinition,
  /* Batch 3 (H-4): the Admin batch ledger is authoritative for issued accounts.
     `batches.js` stays byte-identical; this reader reconciles the two lists. */
  adminBatches,
} from '../../mock-data/index.js'
import { readPersistedSession } from '../../shared/lib/sessionPersistence.js'
import { notFound } from './errors.js'
import { learningService } from './learning.js'
import { requireStudentWorkspace, demoStudentWorkspace } from './ownWorkspace.js'

/** @typedef {import('../types.js').StudentService} StudentService */
/** @typedef {import('../types.js').DashboardService} DashboardService */
/** @typedef {import('../types.js').AssessmentService} AssessmentService */
/** @typedef {import('../../contracts/student.js').StudentProfile} StudentProfile */
/** @typedef {import('../../contracts/student.js').StudentPreferences} StudentPreferences */
/** @typedef {import('../../contracts/user.js').Student} Student */

const PREF_KEY = 'vyuh.student.preferences'
const READ_KEY = 'vyuh.student.notifications.read'
const SCENARIO_KEY = 'vyuh.mock.studentScenario'

function readJson(/** @type {string} */ key, /** @type {any} */ fallback) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function writeJson(/** @type {string} */ key, /** @type {unknown} */ value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* demo keeps working in memory */ }
}
function emptyScenario() {
  try { return localStorage.getItem(SCENARIO_KEY) === 'empty-attempts' } catch { return false }
}
/* BATCH 3.2 (F-01 / F-02): the ONE fail-closed eligibility mechanism lives in
 * `ownWorkspace.js` and is shared by every student-facing service. Its real
 * name, Institute ID, roll number and batch come from the canonical account;
 * only a valid matching demo session keeps its fixtures. */
function ownWorkspace(/** @type {string} */ studentId) {
  return !demoStudentWorkspace(studentId)
}

/**
 * H-4 / B-6 reconciliation: `batches.js` lacks `bat-neet-13`, which the Admin
 * batch ledger does contain. Falling back to the Admin ledger (read through the
 * barrel) prevents a silent, wrong `bat-prayas-m` assignment for issued students.
 * The student-side fixture itself is left unchanged.
 * @param {string} batchId
 */
function batchFor(batchId) {
  return batches.find((candidate) => candidate.id === batchId)
    ?? adminBatches.find((candidate) => candidate.id === batchId)
    ?? null
}

/** BATCH 3.2 (F-01 / F-02): resolution goes ONLY through the fail-closed
 * boundary. A missing / expired / malformed / wrong-role / mismatched session
 * or an unknown identifier throws `not_found` before any fixture is read. The
 * canonical Institute ID (not a caller-supplied alias) is the returned id. */
/** @returns {Student} */
function resolveStudent(/** @type {string} */ studentId) {
  const scope = requireStudentWorkspace(studentId)
  if (scope.kind === 'demo') return currentStudent
  const session = readPersistedSession()
  const user = session?.user
  const record = scope.record
  const batch = batchFor(String(record?.batchId ?? user?.batchId ?? ''))
    ?? batches.find((candidate) => candidate.id === studentBatchId)
  return {
    id: String(user?.id ?? record?.instituteId ?? studentId),
    name: user?.name ?? record?.name ?? 'Student',
    rollNumber: record?.rollNumber ?? 'Pending allotment',
    initials: user?.initials ?? 'ST',
    batchId: batch?.id ?? studentBatchId, batchName: batch?.name ?? 'Batch pending', track: batch?.track ?? 'JEE',
    cohort: batch?.cohort ?? 'class11', avatarTone: 'glacier',
  }
}
function preferencesFor(/** @type {string} */ studentId) {
  const all = readJson(PREF_KEY, {})
  return /** @type {StudentPreferences} */ ({ ...defaultPreferences, ...(all[studentId] ?? {}) })
}
function isEmpty(/** @type {string} */ studentId) {
  /* Throws for invalid identities via demoStudentWorkspace; issued accounts
     always have no seeded history. */
  return !demoStudentWorkspace(studentId) || emptyScenario()
}

/** @type {StudentService} */
export const studentService = {
  getById(studentId) {
    return simulate(() => {
      const student = resolveStudent(studentId)
      const account = users[student.id]
      return { ...student, email: account?.email ?? readPersistedSession()?.user?.email ?? '' }
    })
  },
  getProfile(studentId) {
    return simulate(() => {
      const student = resolveStudent(studentId)
      const session = readPersistedSession()
      /* resolveStudent already validated a matching session, so the session
         user is authoritative for issued accounts (including id aliases). */
      const user = users[student.id] ?? session?.user ?? null
      if (!user) throw notFound('student')
      const batch = batchFor(String(student.batchId ?? ''))
      if (!batch) throw notFound('batch')
      return /** @type {StudentProfile} */ ({ user, student, batch, institute, preferences: preferencesFor(studentId) })
    })
  },
  updatePreferences(studentId, preferences) {
    return simulate(() => {
      resolveStudent(studentId)
      const all = readJson(PREF_KEY, {})
      const next = { ...preferencesFor(studentId), ...preferences }
      all[studentId] = next
      writeJson(PREF_KEY, all)
      return next
    })
  },
  listNotifications(studentId) {
    return simulate(() => {
      resolveStudent(studentId)
      if (ownWorkspace(studentId)) return []
      const all = readJson(READ_KEY, {})
      const read = /** @type {string[]} */ (Array.isArray(all) ? [] : all[studentId] ?? [])
      return notifications.map((item) => ({ ...item, read: item.read || read.includes(item.id) }))
    })
  },
  markNotificationsRead(studentId) {
    return simulate(() => {
      resolveStudent(studentId)
      if (ownWorkspace(studentId)) return []
      const all = readJson(READ_KEY, {})
      all[studentId] = notifications.map((item) => item.id)
      writeJson(READ_KEY, all)
      return notifications.map((item) => ({ ...item, read: true }))
    })
  },
  async getAttendance(studentId) {
    const student = resolveStudent(studentId)
    if (isEmpty(student.id)) return { present: 0, total: 0, percentage: 0, periodLabel: attendancePeriodLabel, currentStreak: 0 }
    return (await learningService.getAttendance(studentId)).summary
  },
  listDoubts(studentId) {
    resolveStudent(studentId)
    if (ownWorkspace(studentId)) return Promise.resolve([])
    return learningService.listDoubts(studentId)
  },
  listStudyRooms(studentId) {
    resolveStudent(studentId)
    if (ownWorkspace(studentId)) return Promise.resolve([])
    return learningService.listStudyRooms(studentId)
  },
}

/** @type {DashboardService} */
export const dashboardService = {
  getStudentHome(studentId) {
    return simulate(async () => {
      const student = resolveStudent(studentId)
      /* U-3: an institute-issued account starts with NO demo academic data.
         `own` is deliberately narrower than `empty` so pre-existing mock
         scenarios for other ids keep their exact behaviour (C1). */
      const own = ownWorkspace(studentId)
      const empty = isEmpty(studentId) || own
      const [attendanceReport, recordingList, schedule] = await Promise.all([
        learningService.getAttendance(studentId), learningService.listRecordings(studentId), learningService.listLiveSessions(studentId),
      ])
      const resumable = recordingList.filter((item) => !item.playback.ended).sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime())[0] ?? null
      const nextTest = exams.filter((exam) => exam.status === 'scheduled').sort((a, b) => new Date(a.scheduledFor ?? 0).getTime() - new Date(b.scheduledFor ?? 0).getTime())[0] ?? null
      return {
        student,
        nextTest: own ? null : nextTest,
        liveNow: own ? [] : liveSessions.filter((session) => session.status === 'live'),
        lastReport: empty ? null : lastReport,
        trend: empty ? [] : scoreTrend,
        resume: null,
        announcements: own ? [] : announcements,
        streakDays: empty ? 0 : 14,
        weeklyGoalPercent: empty ? 0 : 78,
        studyLog: own ? [] : studyLog,
        recentAttempts: empty ? [] : attempts.slice(0, 5),
        subjectStrength: empty ? [] : subjectStrength,
        continueRecording: empty || !resumable ? null : { id: resumable.id, title: resumable.title, chapterName: resumable.chapterName, subjectName: resumable.subjectName, facultyName: resumable.facultyName, durationMinutes: resumable.durationMinutes, progressPercent: resumable.progressPercent, lastWatchedAt: resumable.lastWatchedAt },
        schedule: own ? [] : schedule.filter((session) => session.status !== 'ended').slice(0, 4),
        attendance: empty ? { present: 0, total: 0, percentage: 0, periodLabel: attendancePeriodLabel, currentStreak: 0 } : attendanceReport.summary,
      }
    })
  },
}

/** @type {AssessmentService} */
export const assessmentService = {
  getLatestReport(studentId) {
    return simulate(() => (isEmpty(studentId) ? null : lastReport))
  },
  listExams(studentId) {
    return simulate(() => {
      resolveStudent(studentId)
      /* U-3: an issued account has no demo exam schedule until the office
         publishes one for it. Never invent academic data. */
      if (ownWorkspace(studentId)) return []
      const count = configuredQuestionCount()
      // The registry, not a hard-coded exam id, decides which paper is playable
      // and which size override applies. Every row carries plain-words facts so
      // pages never have to import fixtures to know what is available.
      return exams.map((exam) => {
        const sized = examDefinitionById(exam.id)?.playable ? { ...exam, questionCount: count, maxMarks: count * 4 } : exam
        return withExamDefinition(sized)
      })
    })
  },
  listAttempts(studentId) {
    return simulate(() => { resolveStudent(studentId); return isEmpty(studentId) ? [] : attempts })
  },
  getPerformance(studentId) {
    return simulate(() => {
      resolveStudent(studentId)
      return isEmpty(studentId) ? { attempts: [], scoreTrend: [], subjects: [] } : { attempts, scoreTrend, subjects: subjectStrength }
    })
  },
}

export { recordings }
