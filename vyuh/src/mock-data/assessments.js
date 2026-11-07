/**
 * Papers, attempts and score history for the demo student.
 * The question bank itself ships with the exam runner phase; this file holds
 * what a dashboard and a results view need.
 *
 * @typedef {import('../contracts/assessment.js').Test} Test
 * @typedef {import('../contracts/assessment.js').ScoreReport} ScoreReport
 * @typedef {import('../contracts/assessment.js').TrendPoint} TrendPoint
 */

/** @type {Test[]} */
export const tests = [
  {
    id: 'tst-mock-04',
    title: 'Full Syllabus Mock 04 — JEE Main pattern',
    kind: 'mock',
    status: 'scheduled',
    track: 'JEE',
    durationMinutes: 180,
    questionCount: 75,
    maxMarks: 300,
    totalMarksApplied: 0,
    scheduledFor: '2026-11-08T09:00:00+05:30',
    subjectIds: ['sub-phy', 'sub-che', 'sub-mat'],
    activeAttemptId: null,
  },
  {
    id: 'tst-ch-rot',
    title: 'Rotational Motion — chapter test',
    kind: 'chapter',
    status: 'live',
    track: 'JEE',
    durationMinutes: 45,
    questionCount: 20,
    maxMarks: 80,
    totalMarksApplied: 0,
    scheduledFor: '2026-11-07T07:05:00+05:30',
    subjectIds: ['sub-phy'],
    activeAttemptId: 'att-rot-inflight',
  },
  {
    id: 'tst-assign-org',
    title: 'Organic mechanisms — assignment 12',
    kind: 'assignment',
    status: 'scheduled',
    track: 'JEE',
    durationMinutes: 30,
    questionCount: 15,
    maxMarks: 60,
    totalMarksApplied: 0,
    scheduledFor: '2026-11-10T18:00:00+05:30',
    subjectIds: ['sub-che'],
    activeAttemptId: null,
  },
  {
    id: 'tst-mock-03',
    title: 'Full Syllabus Mock 03 — JEE Main pattern',
    kind: 'mock',
    status: 'closed',
    track: 'JEE',
    durationMinutes: 180,
    questionCount: 75,
    maxMarks: 300,
    totalMarksApplied: 214,
    scheduledFor: '2026-10-26T09:00:00+05:30',
    subjectIds: ['sub-phy', 'sub-che', 'sub-mat'],
    activeAttemptId: null,
  },
]

/** @type {ScoreReport} */
export const lastReport = {
  attemptId: 'att-mock-03',
  score: 214,
  maxMarks: 300,
  percentile: 94.2,
  rank: 61,
  cohortSize: 1042,
  accuracy: 76.4,
  attempted: 70,
  correct: 53,
  wrong: 17,
  unattempted: 5,
  durationSeconds: 10_380,
  subjects: [
    { subjectId: 'sub-phy', subjectName: 'Physics', scored: 68, max: 100, accuracy: 71.0 },
    { subjectId: 'sub-che', subjectName: 'Chemistry', scored: 74, max: 100, accuracy: 82.1 },
    { subjectId: 'sub-mat', subjectName: 'Mathematics', scored: 72, max: 100, accuracy: 76.5 },
  ],
}

/** @type {TrendPoint[]} Last six mocks, oldest first. */
export const scoreTrend = [
  { label: 'Mock 01', date: '2026-08-17', score: 148, percentile: 78.4, cohortAverage: 141 },
  { label: 'Mock 02', date: '2026-09-07', score: 162, percentile: 82.1, cohortAverage: 146 },
  { label: 'Mock 03', date: '2026-09-21', score: 171, percentile: 84.6, cohortAverage: 151 },
  { label: 'Mock 04', date: '2026-10-05', score: 186, percentile: 88.0, cohortAverage: 158 },
  { label: 'Mock 05', date: '2026-10-19', score: 198, percentile: 90.7, cohortAverage: 163 },
  { label: 'Mock 06', date: '2026-10-26', score: 214, percentile: 94.2, cohortAverage: 166 },
]

/**
 * A handful of real questions. Not a bank: enough to prove how question text,
 * options and marking render. The exam runner will read from a larger fixture.
 * @type {import('../contracts/assessment.js').Question[]}
 */
export const questionSamples = [
  {
    id: 'q-phy-rot-01',
    number: 26,
    subjectId: 'sub-phy',
    chapterId: 'ch-rot',
    type: 'single',
    difficulty: 'medium',
    body: 'A uniform disc of mass $M$ and radius $R$ rolls without slipping down a plane inclined at $30^\\circ$. The linear acceleration of its centre of mass is',
    options: [
      { key: 'A', body: '$g/3$' },
      { key: 'B', body: '$2g/5$' },
      { key: 'C', body: '$g/2$' },
      { key: 'D', body: '$3g/7$' },
    ],
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 'q-che-eq-04',
    number: 41,
    subjectId: 'sub-che',
    chapterId: 'ch-eq',
    type: 'numeric',
    difficulty: 'hard',
    body: 'For the equilibrium $\\mathrm{N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g)}$, $K_p = 4.0 \\times 10^{-5}$ at $500\\ \\mathrm{K}$. The value of $K_c$ at the same temperature, in $\\mathrm{(mol\\,L^{-1})^{-2}}$, rounded to two significant figures, is',
    options: [],
    marks: 4,
    negativeMarks: 0,
  },
]
