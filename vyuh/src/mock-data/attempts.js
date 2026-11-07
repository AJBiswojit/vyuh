/**
 * Past attempts for the demo student. Eight evaluated papers give the trend
 * enough history to read; the dashboard ledger shows the newest five.
 * @typedef {import('../contracts/student.js').AttemptSummary} AttemptSummary
 * @typedef {import('../contracts/assessment.js').ScoreReport} ScoreReport
 * @typedef {import('../contracts/assessment.js').TrendPoint} TrendPoint
 */
const base = Date.now()
const at = (/** @type {number} */ days) => new Date(base - days * 86_400_000).toISOString()
const scores = [312, 338, 356, 384, 402, 428, 466, 512]
const percentiles = [71.2, 74.8, 77.5, 80.1, 83.4, 86.9, 90.2, 94.2]
const averages = [302, 315, 326, 340, 352, 365, 382, 398]
const subjectSplit = [
  [0.31, 0.34, 0.35], [0.32, 0.34, 0.34], [0.32, 0.35, 0.33], [0.33, 0.35, 0.32],
  [0.33, 0.36, 0.31], [0.34, 0.36, 0.30], [0.34, 0.37, 0.29], [0.35, 0.37, 0.28],
]
const names = [['sub-phy', 'Physics'], ['sub-che', 'Chemistry'], ['sub-mat', 'Mathematics']]

/** @type {AttemptSummary[]} Newest first. */
export const attempts = scores.map((score, index) => {
  const number = index + 1
  const split = subjectSplit[index]
  return {
    id: `att-mock-${String(number).padStart(2, '0')}`,
    examId: `exam-mock-${String(number).padStart(2, '0')}`,
    title: `Full Syllabus Mock ${String(number).padStart(2, '0')}`,
    submittedAt: at((8 - number) * 7 + 1),
    score,
    maxMarks: 720,
    percentile: percentiles[index],
    accuracy: Math.round((score / 720) * 1000) / 10,
    sparkline: scores.slice(Math.max(0, index - 5), index + 1),
    subjects: names.map(([subjectId, subjectName], s) => ({
      subjectId, subjectName,
      scored: Math.round(score * split[s]), max: 240,
      accuracy: Math.round(((score * split[s]) / 240) * 1000) / 10,
    })),
  }
}).reverse()

/** @type {TrendPoint[]} Oldest first. */
export const scoreTrend = attempts.slice().reverse().map((attempt, index) => ({
  label: `Mock ${String(index + 1).padStart(2, '0')}`,
  date: attempt.submittedAt.slice(0, 10),
  score: attempt.score,
  percentile: attempt.percentile,
  cohortAverage: averages[index],
}))

const latest = attempts[0]
/** @type {ScoreReport} */
export const lastReport = {
  attemptId: latest.id, score: latest.score, maxMarks: latest.maxMarks, percentile: latest.percentile,
  rank: 61, cohortSize: 1042, accuracy: latest.accuracy, attempted: 168, correct: 132, wrong: 36, unattempted: 12,
  durationSeconds: 10_380, subjects: latest.subjects,
}
