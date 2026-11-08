import {
  exams, currentStudent, configuredQuestionCount, simulate,
  examDefinitionById, authoredQuestionsFor, examSectionsFor, EXAM_UNAVAILABLE_REASON,
} from '../../mock-data/index.js'
import { notFound, serviceError } from './errors.js'
import { requireStudentWorkspace, requireSessionWorkspace } from './ownWorkspace.js'

/** @typedef {import('../types.js').ExamFlowService} ExamFlowService */
/** @typedef {import('../../contracts/exam.js').ExamPaper} ExamPaper */
/** @typedef {import('../../contracts/exam.js').ExamSubmissionReceipt} ExamSubmissionReceipt */
/** @typedef {import('../../contracts/exam.js').ExamStatusCounts} ExamStatusCounts */
/** @typedef {import('../../contracts/exam.js').AnswerEntry} AnswerEntry */

const SUBMISSIONS_KEY = 'vyuh.mock.exam.submissions'
const SYNC_KEY = 'vyuh.mock.exam.sync'
const DURATION_KEY = 'vyuh.mock.examDurationSeconds'
const OFFSET_KEY = 'vyuh.mock.examOffsetMs'

/** @param {string} key @param {any} fallback */
function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
/** @param {string} key @param {unknown} value */
function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* demo keeps working in memory */ }
}
/** @param {string} key @param {number} fallback @param {number} min @param {number} max */
function readNumber(key, fallback, min, max) {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw === null ? fallback : Number(raw)
    return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback
  } catch { return fallback }
}
/** BATCH 3.2 (F-01 / F-02): resolve the candidate ONLY through the shared
 * fail-closed boundary. Unknown, forged, sessionless and mismatched identities
 * throw `not_found`; demo seats keep their exact seeded name/roll. */
/** @param {string} studentId */
function candidate(studentId) {
  const scope = requireStudentWorkspace(studentId)
  if (scope.kind === 'demo') return { name: currentStudent.name, rollNumber: currentStudent.rollNumber }
  return { name: scope.record?.name ?? 'Student', rollNumber: scope.record?.rollNumber ?? 'Pending allotment' }
}
/* BATCH 3.1 (WS1 / WS6): an institute-issued account has no demo exam paper,
 * attempt or submission. Fail closed with an honest unavailable result. */
/** @param {string} studentId */
function denyIssuedExam(studentId) {
  /* BATCH 3.2: requireStudentWorkspace throws `not_found` for invalid
     identities before any fixture can be read. */
  const scope = requireStudentWorkspace(studentId)
  if (scope.kind === 'issued') {
    throw serviceError('exam_unavailable', 'No examination is published for this account yet. Your academic office has not assigned a paper.', 404)
  }
}

/**
 * Resolve an exam against the shared registry. The gate is now data-driven:
 * any paper with an authored question set is playable, and a ledger-only paper
 * gets a plain-words explanation instead of a NEET-specific hard-coded check.
 * @param {string} examId
 */
function findExam(examId) {
  const exam = exams.find((item) => item.id === examId)
  const definition = examDefinitionById(examId)
  if (!exam || !definition) throw notFound('exam')
  if (!definition.playable) throw serviceError('paper_not_playable', definition.unavailableReason ?? EXAM_UNAVAILABLE_REASON, 404)
  const count = configuredQuestionCount()
  const durationSeconds = readNumber(DURATION_KEY, exam.durationMinutes * 60, 3, 6 * 3600)
  return { ...exam, questionCount: count, maxMarks: count * 4, durationMinutes: Math.max(1, Math.ceil(durationSeconds / 60)) }
}
function serverOffset() { return readNumber(OFFSET_KEY, 0, -86_400_000, 86_400_000) }
/** @param {AnswerEntry[]} entries @param {string[]} questionIds @returns {ExamStatusCounts} */
function counts(entries, questionIds) {
  /** @type {Record<string, AnswerEntry>} */
  const map = Object.fromEntries(entries.map((entry) => [entry.questionId, entry]))
  /** @type {ExamStatusCounts} */
  const result = { answered: 0, not_answered: 0, review: 0, review_answered: 0, not_visited: 0, total: questionIds.length }
  for (const id of questionIds) result[map[id]?.state ?? 'not_visited'] += 1
  return result
}

/** @type {ExamFlowService} */
export const examFlowService = {
  getPaper(examId, studentId) {
    return simulate(() => {
      denyIssuedExam(studentId)
      const exam = findExam(examId)
      const person = candidate(studentId)
      const authored = authoredQuestionsFor(examId, exam.questionCount)
      const questions = authored.map(({ correctOptions: _correctOptions, correctNumeric: _correctNumeric, explanation: _explanation, ...question }) => question)
      const sections = examSectionsFor(examId, questions)
      const offsetMs = serverOffset()
      const durationSeconds = readNumber(DURATION_KEY, exam.durationMinutes * 60, 3, 6 * 3600)
      return /** @type {ExamPaper} */ ({
        exam, sections, questions, candidate: person, serverNow: new Date(Date.now() + offsetMs).toISOString(), offsetMs, durationSeconds,
        rules: [
          'The clock is server-corrected and continues while the tab is in the background.',
          'Answers are saved on this device after every change and queued when offline.',
          'Copy, cut and right-click are disabled inside the hall. Tab switches are counted.',
          'At zero the sheet submits automatically, even if you are idle.',
          ...(exam.instructions ?? []),
        ],
        markingScheme: { correct: 4, incorrect: -1, unattempted: 0 },
        declaration: 'I have read the rules and marking scheme. I will not use unfair means, and I understand that tab switches and blocked copy attempts are logged.',
      })
    })
  },
  startAttempt(input) {
    return simulate(() => {
      if (!input.declarationAccepted) {
        const error = new Error('Accept the declaration before entering the hall.')
        error.name = 'ServiceError'
        Object.assign(error, { code: 'declaration_required', status: 400, retryable: false })
        throw error
      }
      denyIssuedExam(input.studentId)
      const exam = findExam(input.examId)
      candidate(input.studentId)
      const offsetMs = serverOffset()
      const durationSeconds = readNumber(DURATION_KEY, exam.durationMinutes * 60, 3, 6 * 3600)
      const serverNow = Date.now() + offsetMs
      return {
        attemptId: `att-${input.examId}-${serverNow.toString(36)}`,
        examId: input.examId, studentId: input.studentId,
        startedAt: new Date(serverNow).toISOString(), deadlineAt: new Date(serverNow + durationSeconds * 1000).toISOString(),
        serverNow: new Date(serverNow).toISOString(), offsetMs, durationSeconds, resumed: false,
      }
    })
  },
  syncAttempt(input) {
    return simulate(() => {
      /* BATCH 3.2: a missing / expired / malformed / wrong-role session throws
         `not_found` BEFORE any write; an issued session is unavailable; only a
         valid matching demo session may persist demo sync state. */
      const scope = requireSessionWorkspace('student')
      if (scope.kind === 'issued') {
        throw serviceError('exam_unavailable', 'No examination is published for this account yet.', 404)
      }
      const all = readJson(SYNC_KEY, {})
      all[input.attemptId] = { revision: input.revision, syncedAt: new Date().toISOString(), entries: input.entries }
      writeJson(SYNC_KEY, all)
      return { attemptId: input.attemptId, revision: input.revision, syncedAt: new Date().toISOString() }
    }, { faulty: false })
  },
  submitAttempt(input) {
    return simulate(() => {
      denyIssuedExam(input.studentId)
      const exam = findExam(input.examId)
      const paper = authoredQuestionsFor(input.examId, exam.questionCount)
      const statusCounts = counts(input.entries, paper.map((q) => q.id))
      /** @type {ExamSubmissionReceipt} */
      const receipt = {
        attemptId: input.attemptId, examId: input.examId, examTitle: exam.title, studentId: input.studentId,
        submittedAt: input.submittedAt, reason: input.reason, pendingSync: false,
        counts: { answered: statusCounts.answered + statusCounts.review_answered, notAnswered: statusCounts.not_answered, review: statusCounts.review, notVisited: statusCounts.not_visited, total: statusCounts.total },
      }
      const all = readJson(SUBMISSIONS_KEY, {})
      all[input.attemptId] = { input, receipt }
      writeJson(SUBMISSIONS_KEY, all)
      return receipt
    }, { faulty: false })
  },
}

/** Stored final submissions, shared with the Phase 5 analysis service. */
export function readStoredSubmissions() {
  return /** @type {Record<string, { input: import('../../contracts/exam.js').ExamSubmissionInput, receipt: ExamSubmissionReceipt }>} */ (readJson(SUBMISSIONS_KEY, {}))
}
