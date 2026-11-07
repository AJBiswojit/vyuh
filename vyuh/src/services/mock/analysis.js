/** Mock result sheets: published fixture, or the student's stored submission. */
import {
  analysisFixture, analysisFixtureMeta, buildAnalysisFromSubmission, buildTopicRevision,
  currentStudent, exams, NEET_PRACTICE_EXAM_ID, releasePolicy, simulate, users,
} from '../../mock-data/index.js'
import { readPersistedSession } from '../../shared/lib/sessionPersistence.js'
import { readStoredSubmissions } from './examFlow.js'
import { notFound, serviceError } from './errors.js'

/** @typedef {import('../types.js').AnalysisService} AnalysisService */
/** @typedef {import('../../contracts/analysis.js').ExamAnalysis} ExamAnalysis */
/** @typedef {import('../../contracts/analysis.js').ReleasePolicy} ReleasePolicy */

const LOCK_KEY = 'vyuh.mock.analysisLocked'
const RELEASE_IN_KEY = 'vyuh.mock.analysisReleaseInSeconds'
const OFFSET_KEY = 'vyuh.mock.analysisOffsetMs'

/** @param {string} key @param {number} fallback @param {number} min @param {number} max */
function readNumber(key, fallback, min, max) {
  try {
    const raw = localStorage.getItem(key)
    const value = raw === null ? fallback : Number(raw)
    return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback
  } catch { return fallback }
}
function locked() {
  try { return localStorage.getItem(LOCK_KEY) === 'true' } catch { return false }
}
/** @returns {ReleasePolicy} */
function releaseState() {
  const offsetMs = readNumber(OFFSET_KEY, releasePolicy.offsetMs, -86_400_000, 86_400_000)
  const serverNow = Date.now() + offsetMs
  const releaseAt = locked() ? new Date(Date.now() + readNumber(RELEASE_IN_KEY, releasePolicy.lockedReleaseInSeconds, 1, 7 * 86_400) * 1000).toISOString() : releasePolicy.releaseAt
  const released = releaseAt === null || serverNow >= Date.parse(releaseAt)
  return { released, releaseAt, serverNow: new Date(serverNow).toISOString(), offsetMs, rule: releasePolicy.rule }
}
/** @param {string} studentId */
function candidate(studentId) {
  if (studentId === currentStudent.id) return { name: currentStudent.name, rollNumber: currentStudent.rollNumber }
  const session = readPersistedSession()
  if (session?.user?.id === studentId && session.user.role === 'student') return { name: session.user.name, rollNumber: 'Pending allotment' }
  const account = users[studentId]
  if (account?.role === 'student') return { name: account.name, rollNumber: 'Pending allotment' }
  throw notFound('student')
}

/** @type {AnalysisService} */
export const analysisService = {
  getAnalysis(examId, studentId, attemptId) {
    return simulate(() => {
      const exam = exams.find((item) => item.id === examId)
      if (!exam) throw notFound('exam')
      if (examId !== NEET_PRACTICE_EXAM_ID) throw serviceError('analysis_unavailable', 'Question-level result sheets are published for NEET Practice 01 in this demo. Other papers keep their score summary.', 404)
      const person = candidate(studentId)
      const submissions = Object.values(readStoredSubmissions()).filter((entry) => entry.input.examId === examId && entry.input.studentId === studentId)
      const stored = attemptId ? submissions.find((entry) => entry.input.attemptId === attemptId) : submissions.sort((a, b) => Date.parse(b.input.submittedAt) - Date.parse(a.input.submittedAt))[0]
      if (attemptId && attemptId !== analysisFixtureMeta.attemptId && !stored) throw notFound('attempt')
      const release = releaseState()
      const details = release.released ? stored ? buildAnalysisFromSubmission(stored.input) : analysisFixture : null
      return /** @type {ExamAnalysis} */ ({
        examId, examTitle: exam.title, attemptId: stored?.input.attemptId ?? analysisFixtureMeta.attemptId,
        studentId, candidateName: person.name, rollNumber: person.rollNumber,
        submittedAt: stored?.input.submittedAt ?? analysisFixtureMeta.submittedAt,
        source: stored ? 'submission' : 'fixture', release, details,
      })
    })
  },
  getRevision(studentId, topicId) {
    return simulate(() => {
      candidate(studentId)
      const revision = buildTopicRevision(topicId)
      if (revision.questions.length === 0) throw notFound('topic')
      return revision
    })
  },
}
