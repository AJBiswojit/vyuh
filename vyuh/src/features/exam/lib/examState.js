/** Pure exam-hall state helpers. Counts are derived from the paper order, so a
 * missing entry is always not_visited and the five statuses sum to the total.
 * @typedef {import('@/contracts/assessment.js').AnswerEntry} AnswerEntry
 * @typedef {import('@/contracts/assessment.js').QuestionState} QuestionState
 * @typedef {import('@/contracts/exam.js').ExamPaper} ExamPaper
 * @typedef {import('@/contracts/exam.js').ExamStartReceipt} ExamStartReceipt
 * @typedef {import('@/contracts/exam.js').ExamStatusCounts} ExamStatusCounts
 * @typedef {import('@/contracts/exam.js').ExamSubmissionCounts} ExamSubmissionCounts
 * @typedef {import('@/contracts/exam.js').Confidence} Confidence
 * @typedef {import('@/contracts/exam.js').IntegrityEvent} IntegrityEvent
 */

/** @typedef {Object} ExamAttemptState
 * @property {string} attemptId
 * @property {string} examId
 * @property {string} studentId
 * @property {string} examTitle
 * @property {import('@/contracts/exam.js').ExamCandidate} candidate
 * @property {string[]} questionIds
 * @property {import('@/contracts/exam.js').ExamSection[]} sections
 * @property {number} currentIndex
 * @property {1|-1} direction
 * @property {Record<string, AnswerEntry>} entries
 * @property {Record<string, Confidence | null>} confidences
 * @property {import('@/contracts/exam.js').QuestionVisit[]} [visits]
 * @property {'active'|'submitting'|'submitted'} status
 * @property {string} startedAt
 * @property {string} deadlineAt
 * @property {number} offsetMs
 * @property {number} durationSeconds
 * @property {number} remainingSeconds
 * @property {number} revision
 * @property {number} pendingSync
 * @property {'synced'|'pending'|'syncing'} syncState
 * @property {string | null} lastSyncedAt
 * @property {IntegrityEvent[]} integrityEvents
 * @property {number} tabSwitches
 * @property {number} fontSize
 * @property {boolean} highContrast
 * @property {string | null} lastVisitedAt
 * @property {import('@/contracts/exam.js').ExamSubmissionReceipt | null} receipt
 * @property {import('@/contracts/exam.js').ExamSubmissionInput | null} submissionInput
 */

/** @param {string} value */
export function isValidNumericAnswer(value) {
  const trimmed = value.trim()
  return /^-?(?:\d+\.?\d*|\.\d+)$/.test(trimmed) && Number.isFinite(Number(trimmed))
}

/** @param {import('@/contracts/exam.js').ExamQuestion} question @param {AnswerEntry | undefined} entry */
export function hasResponse(question, entry) {
  if (!entry || entry.selected.length === 0) return false
  return question.type === 'numeric' ? isValidNumericAnswer(entry.selected[0] ?? '') : true
}

/** @param {ExamStartReceipt} start @param {ExamPaper} paper @returns {ExamAttemptState} */
export function createAttemptState(start, paper) {
  /** @type {Record<string, AnswerEntry>} */
  const entries = {}
  /** @type {Record<string, Confidence | null>} */
  const confidences = {}
  for (const question of paper.questions) {
    entries[question.id] = { questionId: question.id, state: 'not_visited', selected: [], timeSpentSeconds: 0 }
    confidences[question.id] = null
  }
  return {
    attemptId: start.attemptId, examId: start.examId, studentId: start.studentId, examTitle: paper.exam.title,
    candidate: paper.candidate, questionIds: paper.questions.map((q) => q.id), sections: paper.sections,
    currentIndex: 0, direction: 1, entries, confidences, visits: [], status: 'active', startedAt: start.startedAt,
    deadlineAt: start.deadlineAt, offsetMs: start.offsetMs, durationSeconds: start.durationSeconds,
    remainingSeconds: start.durationSeconds, revision: 0, pendingSync: 0, syncState: 'synced', lastSyncedAt: null,
    integrityEvents: [], tabSwitches: 0, fontSize: 20, highContrast: false, lastVisitedAt: start.serverNow,
    receipt: null, submissionInput: null,
  }
}

/** @param {Record<string, AnswerEntry>} entries @param {string[]} questionIds @returns {ExamStatusCounts} */
export function countStatuses(entries, questionIds) {
  /** @type {ExamStatusCounts} */
  const counts = { answered: 0, not_answered: 0, review: 0, review_answered: 0, not_visited: 0, total: questionIds.length }
  for (const id of questionIds) {
    const state = entries[id]?.state ?? 'not_visited'
    counts[state] += 1
  }
  return counts
}

/** @param {ExamStatusCounts} counts @returns {ExamSubmissionCounts} */
export function submissionCounts(counts) {
  return {
    answered: counts.answered + counts.review_answered,
    notAnswered: counts.not_answered,
    review: counts.review,
    notVisited: counts.not_visited,
    total: counts.total,
  }
}

/** @param {QuestionState} previous @param {boolean} responded @returns {QuestionState} */
export function stateAfterResponse(previous, responded) {
  const review = previous === 'review' || previous === 'review_answered'
  if (review) return responded ? 'review_answered' : 'review'
  return responded ? 'answered' : 'not_answered'
}

/** @param {ExamAttemptState} state @param {number} index @param {string} now @returns {ExamAttemptState} */
export function visitQuestion(state, index, now) {
  const clamped = Math.max(0, Math.min(state.questionIds.length - 1, index))
  const questionId = state.questionIds[clamped]
  const entries = { ...state.entries }
  const previous = entries[questionId] ?? { questionId, state: /** @type {QuestionState} */ ('not_visited'), selected: [], timeSpentSeconds: 0 }
  if (previous.state === 'not_visited') entries[questionId] = { ...previous, state: 'not_answered' }
  const elapsed = state.lastVisitedAt ? Math.max(0, Math.floor((new Date(now).getTime() - new Date(state.lastVisitedAt).getTime()) / 1000)) : 0
  const currentId = state.questionIds[state.currentIndex]
  if (currentId && entries[currentId] && elapsed > 0) entries[currentId] = { ...entries[currentId], timeSpentSeconds: entries[currentId].timeSpentSeconds + elapsed }
  const visits = (state.visits ?? []).map((visit) => ({ ...visit }))
  if (currentId && elapsed > 0) {
    for (let index = visits.length - 1; index >= 0; index -= 1) {
      if (visits[index].questionId === currentId && visits[index].leftAt === null) {
        visits[index] = { ...visits[index], durationSeconds: visits[index].durationSeconds + elapsed, leftAt: questionId === currentId ? null : now }
        break
      }
    }
  }
  if (questionId !== currentId || visits.length === 0) visits.push({ questionId, enteredAt: now, leftAt: null, durationSeconds: 0 })
  return { ...state, entries, visits, currentIndex: clamped, direction: clamped >= state.currentIndex ? 1 : -1, lastVisitedAt: now }
}

/** @param {ExamAttemptState} state @param {string} questionId @param {string[]} selected @param {import('@/contracts/exam.js').ExamQuestion} question @returns {ExamAttemptState} */
export function setAnswer(state, questionId, selected, question) {
  const previous = state.entries[questionId] ?? { questionId, state: /** @type {QuestionState} */ ('not_answered'), selected: [], timeSpentSeconds: 0 }
  const entry = { ...previous, selected, state: stateAfterResponse(previous.state, hasResponse(question, { ...previous, selected })) }
  return { ...state, entries: { ...state.entries, [questionId]: entry } }
}

/** @param {ExamAttemptState} state @param {string} questionId @returns {ExamAttemptState} */
export function clearAnswer(state, questionId) {
  const previous = state.entries[questionId]
  if (!previous) return state
  return { ...state, entries: { ...state.entries, [questionId]: { ...previous, selected: [], state: 'not_answered' } }, confidences: { ...state.confidences, [questionId]: null } }
}

/** @param {ExamAttemptState} state @param {string} questionId @param {import('@/contracts/exam.js').ExamQuestion} question @returns {ExamAttemptState} */
export function markReview(state, questionId, question) {
  const previous = state.entries[questionId]
  if (!previous) return state
  const stateNext = hasResponse(question, previous) ? 'review_answered' : 'review'
  return { ...state, entries: { ...state.entries, [questionId]: { ...previous, state: stateNext } } }
}

/** @param {number} deadlineAt @param {number} clientNow @param {number} offsetMs */
export function remainingSeconds(deadlineAt, clientNow, offsetMs) {
  return Math.max(0, Math.ceil((deadlineAt - (clientNow + offsetMs)) / 1000))
}

/** @param {EventTarget | null} target */
export function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  const editable = target.getAttribute('contenteditable')
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable || editable === '' || editable === 'true'
}
