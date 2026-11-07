import { formatNumber } from '@/shared/lib/format.js'

/** @typedef {import('@/contracts/analysis.js').LedgerFilter} LedgerFilter */
/** @typedef {import('@/contracts/analysis.js').QuestionAnalysis} QuestionAnalysis */
/** @typedef {import('@/contracts/analysis.js').MistakeCategory} MistakeCategory */

export const FILTERS = /** @type {{ id: LedgerFilter, label: string }[]} */ ([
  { id: 'all', label: 'All' }, { id: 'correct', label: 'Correct' }, { id: 'wrong', label: 'Wrong' },
  { id: 'skipped', label: 'Skipped' }, { id: 'confident', label: 'Confident mistakes' }, { id: 'lucky', label: 'Lucky guesses' },
])

export const OUTCOME_LABELS = /** @type {Record<QuestionAnalysis['outcome'], string>} */ ({ correct: 'Correct', wrong: 'Wrong', skipped: 'Skipped' })

/** @param {number} value */
export function signedMarks(value) {
  if (value > 0) return `+${formatNumber(value)}`
  if (value < 0) return `−${formatNumber(Math.abs(value))}`
  return '0'
}

/** @param {QuestionAnalysis} row @param {string[]} answer */
export function answerLabel(row, answer) {
  if (answer.length === 0) return 'Skipped'
  return answer.join(', ')
}

/** @param {MistakeCategory | null} category @returns {'danger'|'review'|'info'|'idle'|'ember'|'neutral'} */
export function mistakeTone(category) {
  switch (category) {
    case 'conceptual': return 'danger'
    case 'careless': return 'review'
    case 'time_pressure': return 'info'
    case 'misread': return 'idle'
    case 'guess': return 'ember'
    default: return 'neutral'
  }
}

/** @param {number} index */
export function difficultyLabel(index) {
  if (index < 40) return 'Hard'
  if (index < 70) return 'Medium'
  return 'Easy'
}
