/**
 * Shared exam definition registry (Batch 1).
 *
 * `exams.js` is the student ledger, `facultyExams.js` the faculty register and
 * `analysis.js` the published example sheet. Until now the exam player and the
 * result sheet each hard-coded `exam-neet-practice`. This module is the single
 * source of truth for WHICH papers have a real authored question set.
 *
 * Honesty rule: a paper is `playable` only when `EXAM_QUESTION_SETS` contains
 * authored questions with keys and explanations. No questions, answer keys or
 * question-level analytics are generated here for the other ledger entries.
 * Those are `playable: false` and carry a plain-words `unavailableReason`.
 *
 * Adding a paper later is a data change only: author a question set, add its id
 * to PLAYABLE_EXAMS, and the hall, grading and read models all pick it up.
 *
 * @typedef {import('../contracts/exam.js').ExamDefinition} ExamDefinition
 * @typedef {import('../contracts/exam.js').ExamQuestion} ExamQuestion
 * @typedef {import('../contracts/student.js').Exam} Exam
 * @typedef {ExamQuestion & { correctOptions: string[], correctNumeric: number | null, explanation: string }} AuthoredQuestion
 */
import { exams } from './exams.js'
import { attempts } from './attempts.js'
import {
  authoredSections, buildQuestionBank, questions, configuredQuestionCount,
  DEFAULT_QUESTION_COUNT, NEET_PRACTICE_EXAM_ID,
} from './questions.js'

/** A plain-words explanation reused by the hall, detail page and result sheet. */
export const EXAM_UNAVAILABLE_REASON = 'This paper has no authored question set in the mock prototype, so the exam hall and question-level result sheet are not published. Its ledger entry and score summary remain available.'

/**
 * The only authored question set shipped today. `build` honours the existing
 * demo question-count override (3–60) so the hall keeps its configurable size.
 * @type {Readonly<Record<string, Readonly<{ id: string, label: string, build: (count?: number) => AuthoredQuestion[], sections: ReadonlyArray<{ id: string, subjectId: string, name: string, order: number }>, grading: AuthoredQuestion[] }>>>}
 */
export const EXAM_QUESTION_SETS = Object.freeze({
  'neet-practice-01': Object.freeze({
    id: 'neet-practice-01',
    label: 'NEET Practice 01 — 60 authored questions in three sections',
    build: (count) => buildQuestionBank(count ?? DEFAULT_QUESTION_COUNT),
    sections: authoredSections,
    grading: questions,
  }),
})

/** @type {Readonly<Record<string, Readonly<{ questionSetId: string }>>>} */
const PLAYABLE_EXAMS = Object.freeze({
  [NEET_PRACTICE_EXAM_ID]: Object.freeze({ questionSetId: 'neet-practice-01' }),
})

/** @type {ReadonlyArray<ExamDefinition>} */
export const examDefinitions = Object.freeze(exams.map((exam) => {
  const playable = PLAYABLE_EXAMS[exam.id]
  const seededAttempt = attempts.find((attempt) => attempt.examId === exam.id) ?? null
  return Object.freeze({
    id: exam.id,
    title: exam.title,
    track: exam.track,
    kind: exam.kind,
    status: exam.status,
    durationMinutes: exam.durationMinutes,
    questionCount: exam.questionCount,
    maxMarks: exam.maxMarks,
    negativeMarks: exam.negativeMarks,
    subjectIds: exam.subjectIds,
    sectionCount: exam.sectionCount,
    scheduledFor: exam.scheduledFor,
    endsAt: exam.endsAt,
    instructions: exam.instructions,
    playable: Boolean(playable),
    questionSetId: playable?.questionSetId ?? null,
    /** 'question_level' needs an authored set; 'score_summary' uses a real seeded attempt; 'unpublished' has neither. */
    resultMode: playable ? /** @type {const} */ ('question_level') : seededAttempt ? /** @type {const} */ ('score_summary') : /** @type {const} */ ('unpublished'),
    unavailableReason: playable ? null : EXAM_UNAVAILABLE_REASON,
  })
}))

/** @param {string} examId */
export function examDefinitionById(examId) {
  return examDefinitions.find((definition) => definition.id === examId) ?? null
}

/** @param {string} examId */
export function isPlayableExam(examId) {
  return examDefinitionById(examId)?.playable === true
}

/** @returns {ReadonlyArray<ExamDefinition>} */
export function listPlayableExams() {
  return examDefinitions.filter((definition) => definition.playable)
}

/** @returns {ReadonlyArray<ExamDefinition>} */
export function listUnplayableExams() {
  return examDefinitions.filter((definition) => !definition.playable)
}

/** @param {string} examId */
function questionSetFor(examId) {
  const setId = examDefinitionById(examId)?.questionSetId
  return setId ? EXAM_QUESTION_SETS[setId] ?? null : null
}

/**
 * Authored questions (with keys) for a playable paper. Returns an empty array
 * for ledger-only papers — callers must not fabricate a paper from it.
 * @param {string} examId
 * @param {number} [count]
 * @returns {AuthoredQuestion[]}
 */
export function authoredQuestionsFor(examId, count = configuredQuestionCount()) {
  const set = questionSetFor(examId)
  return set ? set.build(count) : []
}

/** Full authored bank used to grade a stored submission. @param {string} examId */
export function gradingQuestionsFor(examId) {
  const set = questionSetFor(examId)
  return set ? set.grading : []
}

/** Build answer-key-free section views from the paper's questions.
 * @param {string} examId
 * @param {ExamQuestion[]} publicQuestions
 * @returns {import('../contracts/exam.js').ExamSection[]}
 */
export function examSectionsFor(examId, publicQuestions) {
  const set = questionSetFor(examId)
  if (!set) return []
  return set.sections.map((section) => ({
    ...section,
    questionIds: publicQuestions.filter((question) => question.sectionId === section.id).map((question) => question.id),
  }))
}

/** Real seeded historical attempt, if this paper has one. @param {string} examId */
export function seededAttemptFor(examId) {
  return attempts.find((attempt) => attempt.examId === examId) ?? null
}

/**
 * Decorate the student exam read model with registry facts. Pages must not
 * import fixtures, so the mock service attaches these before returning them.
 * @param {Exam} exam
 */
export function withExamDefinition(exam) {
  const definition = examDefinitionById(exam.id)
  if (!definition) return exam
  return {
    ...exam,
    playable: definition.playable,
    resultMode: definition.resultMode,
    unavailableReason: definition.unavailableReason,
  }
}
