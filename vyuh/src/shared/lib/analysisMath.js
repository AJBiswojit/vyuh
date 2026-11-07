/**
 * Pure result-sheet arithmetic shared by the mock analysis builder and the UI.
 * No React, storage, or presentation constants: the same rules can be tested
 * against fixture rows and stored submissions.
 *
 * @typedef {import('../../contracts/analysis.js').QuestionAnalysis} QuestionAnalysis
 * @typedef {import('../../contracts/analysis.js').LedgerFilter} LedgerFilter
 * @typedef {import('../../contracts/analysis.js').WhatIfSummary} WhatIfSummary
 */

/** @param {number} part @param {number} total @param {number} [digits] */
export function percent(part, total, digits = 1) {
  if (total <= 0) return 0
  const factor = 10 ** digits
  return Math.round((part / total) * 100 * factor) / factor
}

/** @param {QuestionAnalysis} row */
export function isConfidentMistake(row) {
  return row.outcome === 'wrong' && row.confidence === 'sure'
}
/** @param {QuestionAnalysis} row */
export function isLuckyGuess(row) {
  return row.outcome === 'correct' && row.confidence === 'guessing'
}

/** @param {QuestionAnalysis[]} rows @param {LedgerFilter} filter */
export function filterQuestions(rows, filter) {
  switch (filter) {
    case 'correct': return rows.filter((row) => row.outcome === 'correct')
    case 'wrong': return rows.filter((row) => row.outcome === 'wrong')
    case 'skipped': return rows.filter((row) => row.outcome === 'skipped')
    case 'confident': return rows.filter(isConfidentMistake)
    case 'lucky': return rows.filter(isLuckyGuess)
    default: return rows
  }
}

/** @param {QuestionAnalysis[]} rows @returns {Record<LedgerFilter, number>} */
export function countFilters(rows) {
  return {
    all: rows.length,
    correct: filterQuestions(rows, 'correct').length,
    wrong: filterQuestions(rows, 'wrong').length,
    skipped: filterQuestions(rows, 'skipped').length,
    confident: filterQuestions(rows, 'confident').length,
    lucky: filterQuestions(rows, 'lucky').length,
  }
}

/** Removing negative marking keeps every positive award and zeroes penalties. @param {QuestionAnalysis[]} rows @returns {WhatIfSummary} */
export function calculateWhatIf(rows) {
  const actualScore = rows.reduce((sum, row) => sum + row.marksDelta, 0)
  const scoreWithoutNegative = rows.reduce((sum, row) => sum + Math.max(0, row.marksDelta), 0)
  const negativeMarksLost = rows.reduce((sum, row) => sum + Math.max(0, -row.marksDelta), 0)
  return { actualScore, scoreWithoutNegative, difference: scoreWithoutNegative - actualScore, wrongCount: rows.filter((row) => row.outcome === 'wrong').length, negativeMarksLost }
}

/** Shared scale so the student bar and cohort marker are comparable. @param {number} studentSeconds @param {number} cohortSeconds */
export function timeScale(studentSeconds, cohortSeconds) {
  return Math.max(studentSeconds, cohortSeconds, 1)
}
