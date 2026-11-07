export { exams, exams as tests } from './exams.js'
export { attempts, lastReport, scoreTrend } from './attempts.js'

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
