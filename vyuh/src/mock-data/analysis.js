/**
 * Phase 5 analysis fixtures and the deterministic mock evaluator.
 *
 * The authored question bank supplies keys and explanations; this module adds
 * cohort response distributions, timing statistics, mistake categories, release
 * policy, and a published example sheet. Stored Phase 4 submissions are graded
 * with the same rules, so the result sheet can reflect a real completed attempt.
 * Historical trends are normalized from attempts.js, never duplicated here.
 */
import { chapters, subjects } from './academics.js'
import { attempts, scoreTrend } from './attempts.js'
import { authoredSections, buildQuestionBank, questions } from './questions.js'
import { calculateWhatIf, percent } from '../shared/lib/analysisMath.js'

/** @typedef {import('../contracts/analysis.js').QuestionAnalysis} QuestionAnalysis */
/** @typedef {import('../contracts/analysis.js').MistakeCategory} MistakeCategory */
/** @typedef {import('../contracts/analysis.js').MistakeDefinition} MistakeDefinition */
/** @typedef {import('../contracts/analysis.js').ResponseDistribution} ResponseDistribution */
/** @typedef {import('../contracts/analysis.js').AnalysisDetails} AnalysisDetails */
/** @typedef {import('../contracts/analysis.js').AnalysisTrendPoint} AnalysisTrendPoint */
/** @typedef {import('../contracts/analysis.js').AttemptVisit} AttemptVisit */
/** @typedef {import('../contracts/analysis.js').PacingPoint} PacingPoint */
/** @typedef {import('../contracts/analysis.js').HeatmapCell} HeatmapCell */
/** @typedef {import('../contracts/analysis.js').MistakeDnaSlice} MistakeDnaSlice */
/** @typedef {import('../contracts/analysis.js').AnalysisSummary} AnalysisSummary */
/** @typedef {import('../contracts/exam.js').ExamSubmissionInput} ExamSubmissionInput */
/** @typedef {import('../contracts/exam.js').ExamQuestion} ExamQuestion */
/** @typedef {ExamQuestion & { correctOptions: string[], correctNumeric: number | null, explanation: string }} AuthoredQuestion */
/** @typedef {import('../contracts/exam.js').Confidence} Confidence */
/** @typedef {import('../contracts/exam.js').MarkingScheme} MarkingScheme */

export const mistakeCategories = /** @type {MistakeDefinition[]} */ ([
  { id: 'conceptual', label: 'Conceptual', advice: 'Rebuild the underlying rule, then solve five untimed questions from the same topic.' },
  { id: 'careless', label: 'Careless', advice: 'Slow the final step: units, signs, and “not/except” wording deserve a second read.' },
  { id: 'time_pressure', label: 'Time pressure', advice: 'Practise the topic in short timed sets so recall survives the clock.' },
  { id: 'misread', label: 'Misread', advice: 'Underline the asked quantity before looking at the options.' },
  { id: 'guess', label: 'Guess', advice: 'Replace low-confidence guesses with elimination or a deliberate skip.' },
])

export const cohortDistribution = {
  batchId: 'batch-lakshya',
  batchSize: 134,
  rankCohortSize: 1042,
  fixturePercentile: 82.4,
  /** Score-percent bands used to place a stored submission in the mock cohort. */
  scorePercentiles: [
    { minPercent: 0, percentile: 8.2 }, { minPercent: 20, percentile: 24.6 }, { minPercent: 35, percentile: 41.8 },
    { minPercent: 50, percentile: 58.3 }, { minPercent: 65, percentile: 72.9 }, { minPercent: 80, percentile: 86.7 },
    { minPercent: 90, percentile: 94.8 }, { minPercent: 97, percentile: 99.1 },
  ],
}

export const timeStatistics = {
  baseStudentSeconds: 42, studentStepSeconds: 11, wrongExtraSeconds: 28, skippedSeconds: 9,
  cohortBaseSeconds: 48, cohortStepSeconds: 7, medianRatio: 0.96, bandLowRatio: 0.78, bandHighRatio: 1.22,
  rushedRatio: 0.55, stalledRatio: 1.6, rushedSeconds: 18, stalledSeconds: 176,
  rushedQuestionNumbers: [6, 28], stalledQuestionNumbers: [15, 37, 53],
}

export const releasePolicy = {
  rule: 'Results unlock after the paper window closes and the academic office publishes the verified answer key.',
  releaseAt: /** @type {string | null} */ (null),
  offsetMs: 0,
  lockedReleaseInSeconds: 7200,
}

export const analysisFixtureMeta = { attemptId: 'att-neet-practice-example', submittedAt: '2026-10-18T12:00:00.000Z' }

/** Zero-based fixture outcomes. The remaining questions are correct. */
export const analysisOutcomes = {
  wrong: [2, 5, 11, 14, 23, 27, 33, 36, 44, 47, 52, 55],
  skipped: [7, 18, 29, 40, 51, 58],
  confidentWrong: [5, 14, 27, 36, 47],
  luckyCorrect: [3, 16, 31, 49],
}

const wrongCategoryOrder = /** @type {MistakeCategory[]} */ (['conceptual', 'careless', 'conceptual', 'time_pressure', 'conceptual', 'careless', 'misread', 'conceptual', 'guess', 'careless', 'time_pressure', 'conceptual'])

/** @param {string} id */
function categoryLabel(id) {
  return mistakeCategories.find((category) => category.id === id)?.label ?? id
}
/** @param {AuthoredQuestion} question */
function correctAnswer(question) {
  return question.type === 'numeric' && question.correctNumeric !== null ? [String(question.correctNumeric)] : [...question.correctOptions]
}
/** @param {number} index @param {'correct'|'wrong'|'skipped'} outcome */
function fixtureSeconds(index, outcome) {
  const number = index + 1
  if (outcome === 'skipped') return timeStatistics.skippedSeconds
  if (timeStatistics.rushedQuestionNumbers.includes(number)) return timeStatistics.rushedSeconds
  if (timeStatistics.stalledQuestionNumbers.includes(number)) return timeStatistics.stalledSeconds
  return timeStatistics.baseStudentSeconds + (index % 7) * timeStatistics.studentStepSeconds + (outcome === 'wrong' ? timeStatistics.wrongExtraSeconds : 0)
}
/** @param {number} index */
function cohortSeconds(index) {
  const average = timeStatistics.cohortBaseSeconds + (index % 5) * timeStatistics.cohortStepSeconds
  return { average, median: Math.round(average * timeStatistics.medianRatio), low: Math.round(average * timeStatistics.bandLowRatio), high: Math.round(average * timeStatistics.bandHighRatio) }
}
/** @param {AuthoredQuestion} question @param {string[]} studentAnswer @param {number} index */
function responseDistribution(question, studentAnswer, index) {
  const difficultyIndex = 52 + (index % 4) * 9
  const correctCount = Math.round((cohortDistribution.batchSize * difficultyIndex) / 100)
  const remaining = cohortDistribution.batchSize - correctCount
  if (question.type === 'numeric') {
    const value = question.correctNumeric ?? 0
    const tolerance = question.numericTolerance ?? 0
    const below = Math.round(remaining * 0.55)
    const selectedBand = studentAnswer.length === 0 ? null : Math.abs(Number(studentAnswer[0]) - value) <= tolerance ? 'correct' : Number(studentAnswer[0]) < value ? 'below' : 'above'
    return [
      { key: 'below', label: `Below ${value}`, count: below, percent: percent(below, cohortDistribution.batchSize), correct: false, selectedByStudent: selectedBand === 'below' },
      { key: 'correct', label: `${value} ± ${tolerance}`, count: correctCount, percent: percent(correctCount, cohortDistribution.batchSize), correct: true, selectedByStudent: selectedBand === 'correct' },
      { key: 'above', label: `Above ${value}`, count: remaining - below, percent: percent(remaining - below, cohortDistribution.batchSize), correct: false, selectedByStudent: selectedBand === 'above' },
    ]
  }
  const keys = question.options.map((option) => /** @type {string} */ (option.key))
  const correctKeys = question.correctOptions
  const wrongKeys = keys.filter((key) => !correctKeys.includes(key))
  const weights = [0.45, 0.33, 0.22]
  /** @type {Record<string, number>} */
  const counts = Object.fromEntries(keys.map((key) => [key, 0]))
  correctKeys.forEach((key) => { counts[key] = Math.round(correctCount / correctKeys.length) })
  let assigned = correctKeys.reduce((sum, key) => sum + counts[key], 0)
  wrongKeys.forEach((key, position) => {
    const count = position === wrongKeys.length - 1 ? cohortDistribution.batchSize - assigned : Math.round(remaining * (weights[position] ?? 0.2))
    counts[key] = count
    assigned += count
  })
  const selectedWrong = studentAnswer.find((key) => wrongKeys.includes(key))
  if (selectedWrong && counts[selectedWrong] === 0) {
    const donor = wrongKeys.reduce((largest, key) => counts[key] > counts[largest] ? key : largest, wrongKeys[0])
    counts[donor] -= 1
    counts[selectedWrong] += 1
  }
  return keys.map((key) => ({ key, label: key, count: counts[key], percent: percent(counts[key], cohortDistribution.batchSize), correct: correctKeys.includes(key), selectedByStudent: studentAnswer.includes(key) }))
}

/**
 * @param {AuthoredQuestion} question
 * @param {number} index
 * @param {{ outcome: 'correct'|'wrong'|'skipped', confidence: Confidence | null, studentAnswer: string[], timeSpentSeconds: number, mistakeCategory?: MistakeCategory | null }} input
 * @returns {QuestionAnalysis}
 */
export function buildQuestionAnalysis(question, index, input) {
  const cohort = cohortSeconds(index)
  const answer = correctAnswer(question)
  const difficultyIndex = 52 + (index % 4) * 9
  const distribution = responseDistribution(question, input.studentAnswer, index)
  const mistakeCategory = input.outcome === 'wrong' ? input.mistakeCategory ?? 'conceptual' : null
  const marksDelta = input.outcome === 'correct' ? question.marks : input.outcome === 'wrong' ? -question.negativeMarks : 0
  return {
    id: question.id, number: question.number, sectionId: question.sectionId, sectionName: authoredSections.find((section) => section.id === question.sectionId)?.name ?? question.sectionId,
    subjectId: question.subjectId, topicId: question.chapterId, topicName: chapters.find((chapter) => chapter.id === question.chapterId)?.name ?? question.chapterId, question,
    studentAnswer: input.studentAnswer, correctAnswer: answer, outcome: input.outcome, confidence: input.confidence,
    confidentMistake: input.outcome === 'wrong' && input.confidence === 'sure', luckyGuess: input.outcome === 'correct' && input.confidence === 'guessing',
    mistakeCategory, mistakeLabel: mistakeCategory ? categoryLabel(mistakeCategory) : input.outcome === 'correct' ? 'Correct' : 'Skipped',
    marksDelta, timeSpentSeconds: input.timeSpentSeconds, cohortAverageSeconds: cohort.average, cohortMedianSeconds: cohort.median,
    difficultyIndex, responseDistribution: distribution, explanation: question.explanation,
  }
}

/** Published example sheet for the NEET practice paper. @type {QuestionAnalysis[]} */
export const perQuestionAnalysis = buildQuestionBank(60).map((question, index) => {
  const outcome = analysisOutcomes.skipped.includes(index) ? 'skipped' : analysisOutcomes.wrong.includes(index) ? 'wrong' : 'correct'
  const confidence = outcome === 'skipped' ? null : analysisOutcomes.confidentWrong.includes(index) ? 'sure' : analysisOutcomes.luckyCorrect.includes(index) ? 'guessing' : outcome === 'wrong' ? 'unsure' : index % 3 === 0 ? 'sure' : 'unsure'
  const wrongPosition = analysisOutcomes.wrong.indexOf(index)
  const mistakeCategory = outcome === 'wrong' ? wrongCategoryOrder[wrongPosition] ?? 'conceptual' : null
  const studentAnswer = outcome === 'skipped' ? [] : outcome === 'correct' ? correctAnswer(question) : question.type === 'numeric' ? [String((question.correctNumeric ?? 0) + 3)] : [question.options.find((option) => !question.correctOptions.includes(option.key))?.key ?? 'A']
  return buildQuestionAnalysis(question, index, { outcome, confidence, studentAnswer, timeSpentSeconds: fixtureSeconds(index, outcome), mistakeCategory })
})

/** @param {QuestionAnalysis[]} rows @returns {PacingPoint[]} */
export function buildPacing(rows) {
  return rows.map((row) => {
    const cohort = cohortSeconds(row.number - 1)
    const flag = row.timeSpentSeconds < cohort.median * timeStatistics.rushedRatio ? 'rushed' : row.timeSpentSeconds > cohort.high * timeStatistics.stalledRatio ? 'stalled' : null
    return { questionNumber: row.number, questionId: row.id, studentSeconds: row.timeSpentSeconds, cohortAverageSeconds: row.cohortAverageSeconds, cohortMedianSeconds: row.cohortMedianSeconds, cohortBand: [cohort.low, cohort.high], flag }
  })
}

/** @param {QuestionAnalysis[]} rows @param {import('../contracts/exam.js').QuestionVisit[]} [visits] @param {string} [submittedAt] @returns {AttemptVisit[]} */
export function buildAttemptPath(rows, visits, submittedAt) {
  const byId = new Map(rows.map((row) => [row.id, row]))
  if (visits && visits.length > 0) {
    return visits.flatMap((visit, index) => {
      const row = byId.get(visit.questionId)
      if (!row) return []
      return [{ sequence: index + 1, questionId: row.id, questionNumber: row.number, sectionName: row.sectionName, enteredAt: visit.enteredAt, durationSeconds: visit.durationSeconds }]
    })
  }
  const base = submittedAt ? Date.parse(submittedAt) - rows.reduce((sum, row) => sum + row.timeSpentSeconds, 0) * 1000 : Date.parse('2026-10-18T09:00:00.000Z')
  let cursor = base
  return rows.map((row, index) => {
    const enteredAt = new Date(cursor).toISOString()
    cursor += row.timeSpentSeconds * 1000
    return { sequence: index + 1, questionId: row.id, questionNumber: row.number, sectionName: row.sectionName, enteredAt, durationSeconds: row.timeSpentSeconds }
  })
}

/** @param {QuestionAnalysis[]} rows @returns {{ slices: MistakeDnaSlice[], dominant: MistakeCategory | null, advice: string }} */
export function buildMistakeDna(rows) {
  const wrong = rows.filter((row) => row.outcome === 'wrong')
  const slices = mistakeCategories.map((category) => {
    const count = wrong.filter((row) => row.mistakeCategory === category.id).length
    return { id: category.id, label: category.label, count, percent: percent(count, wrong.length), advice: category.advice }
  }).filter((slice) => slice.count > 0)
  const dominantSlice = slices.reduce((largest, slice) => slice.count > largest.count ? slice : largest, slices[0] ?? null)
  return { slices, dominant: dominantSlice?.id ?? null, advice: dominantSlice?.advice ?? 'No mistakes recorded — keep the same checking routine.' }
}

/** @param {QuestionAnalysis[]} rows @returns {HeatmapCell[]} */
export function buildHeatmap(rows) {
  /** @type {Map<string, HeatmapCell>} */
  const cells = new Map()
  rows.forEach((row) => {
    const key = `${row.sectionId}:${row.topicId}`
    const cell = cells.get(key) ?? { sectionId: row.sectionId, sectionName: row.sectionName, topicId: row.topicId, topicName: row.topicName, attempted: 0, correct: 0, accuracy: 0 }
    if (row.outcome !== 'skipped') cell.attempted += 1
    if (row.outcome === 'correct') cell.correct += 1
    cells.set(key, cell)
  })
  return [...cells.values()].map((cell) => ({ ...cell, accuracy: percent(cell.correct, cell.attempted) }))
}

/** @param {number} score @param {number} maxMarks */
export function percentileForScore(score, maxMarks) {
  const scorePercent = percent(score, maxMarks)
  const band = [...cohortDistribution.scorePercentiles].reverse().find((entry) => scorePercent >= entry.minPercent)
  return band?.percentile ?? cohortDistribution.scorePercentiles[0].percentile
}
/** @param {number} percentile */
export function rankForPercentile(percentile) {
  return Math.max(1, Math.round(((100 - percentile) / 100) * cohortDistribution.rankCohortSize) + 1)
}

/** @param {QuestionAnalysis[]} rows @param {MarkingScheme} markingScheme @param {number} [percentile] @returns {AnalysisSummary} */
export function summarizeAnalysis(rows, markingScheme, percentile = cohortDistribution.fixturePercentile) {
  const correct = rows.filter((row) => row.outcome === 'correct').length
  const wrong = rows.filter((row) => row.outcome === 'wrong').length
  const skipped = rows.filter((row) => row.outcome === 'skipped').length
  const attempted = correct + wrong
  const score = rows.reduce((sum, row) => sum + row.marksDelta, 0)
  const maxMarks = rows.reduce((sum, row) => sum + row.question.marks, 0)
  return {
    score, maxMarks, rank: rankForPercentile(percentile), cohortSize: cohortDistribution.rankCohortSize, percentile,
    accuracy: percent(correct, attempted), attempted, correct, wrong, skipped,
    durationSeconds: rows.reduce((sum, row) => sum + row.timeSpentSeconds, 0),
    cost: { negativeMarksLost: wrong * Math.abs(markingScheme.incorrect), timeOnWrongSeconds: rows.filter((row) => row.outcome === 'wrong').reduce((sum, row) => sum + row.timeSpentSeconds, 0), confidentMistakes: rows.filter((row) => row.confidentMistake).length },
  }
}

/** Historical track normalized from the single attempts.js source. @type {AnalysisTrendPoint[]} */
export const attemptTrend = attempts.slice().reverse().map((attempt, index) => ({
  label: attempt.title.replace('Full Syllabus ', ''), date: attempt.submittedAt, track: 'JEE',
  score: attempt.score, maxMarks: attempt.maxMarks, scorePercent: percent(attempt.score, attempt.maxMarks),
  percentile: attempt.percentile, cohortAveragePercent: percent(scoreTrend[index].cohortAverage, attempt.maxMarks),
}))

/** @type {MarkingScheme} */
export const analysisMarkingScheme = { correct: 4, incorrect: -1, unattempted: 0 }

/** @param {QuestionAnalysis[]} rows @param {import('../contracts/exam.js').QuestionVisit[]} [visits] @param {string} [submittedAt] @param {number} [percentile] @returns {AnalysisDetails} */
export function buildAnalysisDetails(rows, visits, submittedAt, percentile) {
  const dna = buildMistakeDna(rows)
  return {
    summary: summarizeAnalysis(rows, analysisMarkingScheme, percentile), questions: rows, pacing: buildPacing(rows),
    path: buildAttemptPath(rows, visits, submittedAt), mistakeDna: dna.slices, dominantMistake: dna.dominant, mistakeAdvice: dna.advice,
    heatmap: buildHeatmap(rows), whatIf: calculateWhatIf(rows), attemptTrend, markingScheme: analysisMarkingScheme,
  }
}

/** Published fixture used before a student has submitted this paper. */
export const analysisFixture = buildAnalysisDetails(perQuestionAnalysis)

/** @param {AuthoredQuestion} question @param {string[]} selected */
export function isCorrectResponse(question, selected) {
  if (selected.length === 0) return false
  if (question.type === 'numeric') {
    const value = Number(selected[0])
    return Number.isFinite(value) && question.correctNumeric !== null && Math.abs(value - question.correctNumeric) <= (question.numericTolerance ?? 0)
  }
  const actual = [...selected].sort().join('|')
  const expected = [...question.correctOptions].sort().join('|')
  return actual === expected
}

/** @param {QuestionAnalysis} row @returns {MistakeCategory} */
export function classifyMistake(row) {
  if (row.confidence === 'guessing') return 'guess'
  if (row.timeSpentSeconds > row.cohortAverageSeconds * timeStatistics.stalledRatio) return 'time_pressure'
  if (row.confidence === 'sure') return 'conceptual'
  if (row.confidence === 'unsure') return 'careless'
  return 'misread'
}

/** Grade a stored Phase 4 submission against the authored bank. @param {ExamSubmissionInput} input @returns {AnalysisDetails} */
export function buildAnalysisFromSubmission(input) {
  const bank = new Map(questions.map((question) => [question.id, question]))
  const rows = input.entries.flatMap((entry, index) => {
    const question = bank.get(entry.questionId)
    if (!question) return []
    const answered = entry.selected.length > 0 && (question.type !== 'numeric' || Number.isFinite(Number(entry.selected[0])))
    const outcome = !answered ? 'skipped' : isCorrectResponse(question, entry.selected) ? 'correct' : 'wrong'
    const confidence = input.confidences[entry.questionId] ?? null
    const row = buildQuestionAnalysis(question, index, { outcome, confidence, studentAnswer: entry.selected, timeSpentSeconds: entry.timeSpentSeconds })
    if (outcome === 'wrong') {
      const mistakeCategory = classifyMistake(row)
      return [{ ...row, mistakeCategory, mistakeLabel: categoryLabel(mistakeCategory), confidentMistake: confidence === 'sure' }]
    }
    return [row]
  })
  const score = rows.reduce((sum, row) => sum + row.marksDelta, 0)
  const maxMarks = rows.reduce((sum, row) => sum + row.question.marks, 0)
  return buildAnalysisDetails(rows, input.visits, input.submittedAt, percentileForScore(score, maxMarks))
}

/** @param {string} topicId */
export function buildTopicRevision(topicId) {
  const rows = perQuestionAnalysis.filter((row) => row.topicId === topicId)
  const first = rows[0]
  const chapter = chapters.find((item) => item.id === topicId)
  const subject = subjects.find((item) => item.id === first?.subjectId)
  const cell = buildHeatmap(perQuestionAnalysis).find((item) => item.topicId === topicId)
  return {
    topicId, topicName: first?.topicName ?? chapter?.name ?? topicId, subjectName: subject?.name ?? 'Topic',
    mastery: cell?.accuracy ?? chapter?.mastery ?? 0, weightage: chapter?.weightage ?? 0,
    advice: buildMistakeDna(rows).advice,
    questions: rows.map((row) => ({ id: row.id, number: row.number, body: row.question.body, correctAnswer: row.correctAnswer, explanation: row.explanation })),
  }
}
