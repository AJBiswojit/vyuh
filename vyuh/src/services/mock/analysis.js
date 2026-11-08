/** Mock result sheets: published fixture, or the student's stored submission. */
import {
  analysisFixture, analysisFixtureMeta, buildAnalysisFromSubmission, buildTopicRevision,
  currentStudent, exams, NEET_PRACTICE_EXAM_ID, releasePolicy, simulate,
  examDefinitionById, gradingQuestionsFor, seededAttemptFor, EXAM_UNAVAILABLE_REASON,
} from '../../mock-data/index.js'
import { applyFaultsToResultSheet } from '../../shared/lib/facultyMath.js'
import { readStoredSubmissions } from './examFlow.js'
import { notFound, serviceError } from './errors.js'
import { requireStudentWorkspace } from './ownWorkspace.js'

/** @typedef {import('../types.js').AnalysisService} AnalysisService */
/** @typedef {import('../../contracts/analysis.js').ExamAnalysis} ExamAnalysis */
/** @typedef {import('../../contracts/analysis.js').ReleasePolicy} ReleasePolicy */

const LOCK_KEY = 'vyuh.mock.analysisLocked'
const FAULTS_PREFIX = 'vyuh.mock.faults.'
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
/**
 * Faults marked by faculty on this paper. The faculty service mirrors its
 * register here because the two mocks are separate modules; a real API would
 * return the corrected score from the server.
 * @param {string} examId
 * @returns {string[]}
 */
function facultyFaults(examId) {
  try {
    const raw = localStorage.getItem(`${FAULTS_PREFIX}${examId}`)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
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
/** BATCH 3.2 (F-01 / F-02): candidate resolution goes through the shared
 * fail-closed boundary; no loose `users[studentId]` or sessionless shortcut. */
/** @param {string} studentId */
function candidate(studentId) {
  const scope = requireStudentWorkspace(studentId)
  if (scope.kind === 'demo') return { name: currentStudent.name, rollNumber: currentStudent.rollNumber }
  return { name: scope.record?.name ?? 'Student', rollNumber: scope.record?.rollNumber ?? 'Pending allotment' }
}

/* BATCH 3.1 (WS1 / WS6): an institute-issued student owns NO seeded result
 * sheet, no demo attempt and no shared revision set. Return an honest
 * unavailable result instead of another student's academic records. */
/** @param {string} studentId */
function ownAnalysis(studentId) {
  /* BATCH 3.2: requireStudentWorkspace throws `not_found` for invalid
     identities before any fixture can be read. */
  return requireStudentWorkspace(studentId).kind === 'issued'
}

/** @type {AnalysisService} */
export const analysisService = {
  getAnalysis(examId, studentId, attemptId) {
    return simulate(() => {
      const exam = exams.find((item) => item.id === examId)
      const definition = examDefinitionById(examId)
      if (!exam || !definition) throw notFound('exam')
      const issued = ownAnalysis(studentId)
      const person = issued ? requireStudentWorkspace(studentId).record : candidate(studentId)
      const release = releaseState()

      if (issued) {
        return /** @type {ExamAnalysis} */ ({
          examId, examTitle: exam.title,
          attemptId: attemptId ?? `no-attempt-${examId}`,
          studentId,
          candidateName: person?.name ?? 'Student',
          rollNumber: person?.rollNumber ?? 'Pending allotment',
          submittedAt: release.serverNow,
          source: 'unpublished',
          notice: 'No result sheet is available for this account yet. Your academic office has not published an examination result.',
          scoreSummary: null,
          release, details: null,
        })
      }

      // Ledger-only paper: no authored question set means no question-level
      // analytics can be produced. Return a labelled state plus the REAL seeded
      // score summary (from attempts.js) rather than borrowing the NEET sheet.
      if (!definition.playable) {
        const seeded = seededAttemptFor(examId)
        return /** @type {ExamAnalysis} */ ({
          examId, examTitle: exam.title,
          attemptId: seeded?.id ?? `no-attempt-${examId}`,
          studentId, candidateName: person.name, rollNumber: person.rollNumber,
          submittedAt: seeded?.submittedAt ?? new Date(release.serverNow).toISOString(),
          source: 'unpublished',
          notice: seeded
            ? 'This paper has a published score summary but no authored question set, so question-level analysis is not available in the mock prototype.'
            : (definition.unavailableReason ?? EXAM_UNAVAILABLE_REASON),
          scoreSummary: seeded ? {
            score: seeded.score, maxMarks: seeded.maxMarks, percentile: seeded.percentile,
            accuracy: seeded.accuracy, submittedAt: seeded.submittedAt,
            subjects: seeded.subjects.map((subject) => ({ subjectId: subject.subjectId, subjectName: subject.subjectName, scored: subject.scored, max: subject.max, accuracy: subject.accuracy })),
          } : null,
          release, details: null,
        })
      }

      const submissions = Object.values(readStoredSubmissions()).filter((entry) => entry.input.examId === examId && entry.input.studentId === studentId)
      const stored = attemptId ? submissions.find((entry) => entry.input.attemptId === attemptId) : submissions.sort((a, b) => Date.parse(b.input.submittedAt) - Date.parse(a.input.submittedAt))[0]
      if (attemptId && attemptId !== analysisFixtureMeta.attemptId && !stored) throw notFound('attempt')
      // Only the NEET practice paper owns the published example fixture. Grade a
      // stored submission against ITS OWN paper's authored key.
      const hasPublishedExample = examId === NEET_PRACTICE_EXAM_ID
      const baseDetails = release.released
        ? (stored ? buildAnalysisFromSubmission(stored.input, gradingQuestionsFor(examId)) : (hasPublishedExample ? analysisFixture : null))
        : null
      const details = baseDetails ? applyFaultsToResultSheet(baseDetails, facultyFaults(examId)) : null
      const source = stored ? 'submission' : hasPublishedExample ? 'fixture' : 'unpublished'
      return /** @type {ExamAnalysis} */ ({
        examId, examTitle: exam.title,
        attemptId: stored?.input.attemptId ?? (hasPublishedExample ? analysisFixtureMeta.attemptId : `no-attempt-${examId}`),
        studentId, candidateName: person.name, rollNumber: person.rollNumber,
        submittedAt: stored?.input.submittedAt ?? (hasPublishedExample ? analysisFixtureMeta.submittedAt : release.serverNow),
        source,
        notice: source === 'unpublished' ? 'Submit this paper to see your question-level result sheet.' : null,
        scoreSummary: null,
        release, details,
      })
    })
  },
  getRevision(studentId, topicId) {
    return simulate(() => {
      if (ownAnalysis(studentId)) {
        throw serviceError('revision_unavailable', 'No practice set has been published for this account yet.', 404)
      }
      candidate(studentId)
      const revision = buildTopicRevision(topicId)
      if (revision.questions.length === 0) throw notFound('topic')
      return revision
    })
  },
}
