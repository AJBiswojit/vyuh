/** @typedef {import('@/contracts/assessment.js').QuestionState} QuestionState */
export const STATUS_LABELS = /** @type {Record<QuestionState, string>} */ ({
  not_visited: 'Not visited',
  not_answered: 'Not answered',
  answered: 'Answered',
  review: 'Marked for review',
  review_answered: 'Answered and marked for review',
})
