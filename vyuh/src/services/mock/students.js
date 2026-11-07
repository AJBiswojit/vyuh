import {
  currentStudent, users, institute, batches, studentBatchId, exams, attempts, lastReport, scoreTrend,
  subjectStrength, recordings, liveSessions, studyLog, announcements,
  notifications, defaultPreferences, simulate, configuredQuestionCount, NEET_PRACTICE_EXAM_ID, attendancePeriodLabel,
} from '../../mock-data/index.js'
import { readPersistedSession } from '../../shared/lib/sessionPersistence.js'
import { notFound } from './errors.js'
import { learningService } from './learning.js'

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
/** @returns {Student} */
function resolveStudent(/** @type {string} */ studentId) {
  if (studentId === currentStudent.id) return currentStudent
  const session = readPersistedSession()
  const user = session?.user
  if (user?.id === studentId && user.role === 'student') {
    const batch = batches.find((candidate) => candidate.id === user.batchId) ?? batches.find((candidate) => candidate.id === studentBatchId)
    return {
      id: user.id, name: user.name, rollNumber: 'Pending allotment', initials: user.initials,
      batchId: batch?.id ?? studentBatchId, batchName: batch?.name ?? 'Batch pending', track: batch?.track ?? 'JEE',
      cohort: batch?.cohort ?? 'class11', avatarTone: 'glacier',
    }
  }
  throw notFound('student')
}
function preferencesFor(/** @type {string} */ studentId) {
  const all = readJson(PREF_KEY, {})
  return /** @type {StudentPreferences} */ ({ ...defaultPreferences, ...(all[studentId] ?? {}) })
}
function isEmpty(/** @type {string} */ studentId) {
  return studentId !== currentStudent.id || emptyScenario()
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
      const user = users[studentId] ?? (session?.user?.id === studentId ? session.user : null)
      if (!user) throw notFound('student')
      const batch = batches.find((candidate) => candidate.id === student.batchId)
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
      const all = readJson(READ_KEY, {})
      const read = /** @type {string[]} */ (Array.isArray(all) ? [] : all[studentId] ?? [])
      return notifications.map((item) => ({ ...item, read: item.read || read.includes(item.id) }))
    })
  },
  markNotificationsRead(studentId) {
    return simulate(() => {
      resolveStudent(studentId)
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
    return learningService.listDoubts(studentId)
  },
  listStudyRooms(studentId) {
    resolveStudent(studentId)
    return learningService.listStudyRooms(studentId)
  },
}

/** @type {DashboardService} */
export const dashboardService = {
  getStudentHome(studentId) {
    return simulate(async () => {
      const student = resolveStudent(studentId)
      const empty = isEmpty(studentId)
      const [attendanceReport, recordingList, schedule] = await Promise.all([
        learningService.getAttendance(studentId), learningService.listRecordings(studentId), learningService.listLiveSessions(studentId),
      ])
      const resumable = recordingList.filter((item) => !item.playback.ended).sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime())[0] ?? null
      const nextTest = exams.filter((exam) => exam.status === 'scheduled').sort((a, b) => new Date(a.scheduledFor ?? 0).getTime() - new Date(b.scheduledFor ?? 0).getTime())[0] ?? null
      return {
        student,
        nextTest,
        liveNow: liveSessions.filter((session) => session.status === 'live'),
        lastReport: empty ? null : lastReport,
        trend: empty ? [] : scoreTrend,
        resume: null,
        announcements,
        streakDays: empty ? 0 : 14,
        weeklyGoalPercent: empty ? 0 : 78,
        studyLog,
        recentAttempts: empty ? [] : attempts.slice(0, 5),
        subjectStrength: empty ? [] : subjectStrength,
        continueRecording: empty || !resumable ? null : { id: resumable.id, title: resumable.title, chapterName: resumable.chapterName, subjectName: resumable.subjectName, facultyName: resumable.facultyName, durationMinutes: resumable.durationMinutes, progressPercent: resumable.progressPercent, lastWatchedAt: resumable.lastWatchedAt },
        schedule: schedule.filter((session) => session.status !== 'ended').slice(0, 4),
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
      const count = configuredQuestionCount()
      return exams.map((exam) => exam.id === NEET_PRACTICE_EXAM_ID ? { ...exam, questionCount: count, maxMarks: count * 4 } : exam)
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
