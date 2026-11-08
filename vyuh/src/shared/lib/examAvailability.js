/**
 * Pure read-model predicates for exam availability. Pages use these instead of
 * hard-coding `track === 'NEET'`; the mock service attaches the registry facts
 * to each exam in `assessmentService.listExams`.
 *
 * @typedef {import('../../contracts/student.js').Exam} Exam
 */

/** @typedef {Exam & { playable?: boolean, resultMode?: 'question_level'|'score_summary'|'unpublished', unavailableReason?: string | null }} RegisteredExam */

/**
 * A result sheet is reachable only when the paper has a question-level sheet or
 * a real published score summary. Never offer a link that would render an error.
 * @param {RegisteredExam | undefined | null} exam
 */
export function canShowResultSheet(exam) {
  if (!exam) return false
  return exam.playable === true || exam.resultMode === 'question_level' || exam.resultMode === 'score_summary'
}

/**
 * The hall is enterable only for a registered playable paper whose window is
 * still open. @param {RegisteredExam | undefined | null} exam
 */
export function canEnterExamHall(exam) {
  if (!exam || exam.playable !== true) return false
  return exam.status !== 'closed' && exam.status !== 'draft'
}

/**
 * Plain-words reason shown on the exam detail page. Falls back to a sentence
 * that does not pretend a paper exists. @param {RegisteredExam | undefined | null} exam
 */
export function examHallNotice(exam) {
  if (!exam || exam.playable === true) return null
  return exam.unavailableReason ?? 'The exam hall is not published for this paper in the mock prototype; its ledger entry remains available.'
}
