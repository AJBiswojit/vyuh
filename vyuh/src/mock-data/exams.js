/**
 * Student exam fixtures. Dates are relative to module load so the demo always
 * has a future countdown, an open live window and a real past ledger.
 * @typedef {import('../contracts/student.js').Exam} Exam
 */
const base = Date.now()
const at = (/** @type {number} */ minutes) => new Date(base + minutes * 60_000).toISOString()
const instructions = [
  'Keep a government photo ID and your admit card on the desk.',
  'Rough work is allowed on blank paper; no external calculators.',
  'The paper submits automatically when the server clock reaches zero.',
]

/** @type {Exam[]} */
export const exams = [
  {
    id: 'exam-neet-practice', title: 'NEET Practice 01 — Physics, Chemistry, Biology', kind: 'mock', status: 'live', track: 'NEET',
    durationMinutes: 180, questionCount: 60, maxMarks: 240, totalMarksApplied: 0, scheduledFor: at(-5), endsAt: at(175),
    subjectIds: ['sub-phy', 'sub-che', 'sub-bio'], activeAttemptId: null, sectionCount: 3, negativeMarks: 1,
    instructions: [
      'The paper has three sections: Physics, Chemistry and Biology.',
      'Each correct response carries +4 marks; each incorrect response carries −1 mark.',
      'Use Save and next to move on. Mark for review keeps a question visible in the palette.',
    ],
  },
  {
    id: 'exam-mock-09', title: 'Full Syllabus Mock 09 — JEE Main pattern', kind: 'mock', status: 'scheduled', track: 'JEE',
    durationMinutes: 180, questionCount: 180, maxMarks: 720, totalMarksApplied: 0, scheduledFor: at(135), endsAt: at(315),
    subjectIds: ['sub-phy', 'sub-che', 'sub-mat'], activeAttemptId: null, sectionCount: 3, negativeMarks: 1, instructions,
  },
  {
    id: 'exam-rot-live', title: 'Rotational Motion — chapter test', kind: 'chapter', status: 'live', track: 'JEE',
    durationMinutes: 45, questionCount: 20, maxMarks: 80, totalMarksApplied: 0, scheduledFor: at(-20), endsAt: at(25),
    subjectIds: ['sub-phy'], activeAttemptId: 'att-rot-inflight', sectionCount: 1, negativeMarks: 1, instructions,
  },
  {
    id: 'exam-org-12', title: 'Organic mechanisms — assignment 12', kind: 'assignment', status: 'scheduled', track: 'JEE',
    durationMinutes: 30, questionCount: 15, maxMarks: 60, totalMarksApplied: 0, scheduledFor: at(60 * 26), endsAt: at(60 * 26 + 30),
    subjectIds: ['sub-che'], activeAttemptId: null, sectionCount: 1, negativeMarks: 0, instructions,
  },
  {
    id: 'exam-mock-08', title: 'Full Syllabus Mock 08 — JEE Main pattern', kind: 'mock', status: 'closed', track: 'JEE',
    durationMinutes: 180, questionCount: 180, maxMarks: 720, totalMarksApplied: 512, scheduledFor: at(-60 * 24 * 7), endsAt: at(-60 * 24 * 7 + 180),
    subjectIds: ['sub-phy', 'sub-che', 'sub-mat'], activeAttemptId: null, sectionCount: 3, negativeMarks: 1, instructions,
  },
  ...[7, 6, 5, 4, 3, 2, 1].map((n) => ({
    id: `exam-mock-0${n}`, title: `Full Syllabus Mock 0${n} — JEE Main pattern`, kind: /** @type {const} */ ('mock'), status: /** @type {const} */ ('closed'), track: /** @type {const} */ ('JEE'),
    durationMinutes: 180, questionCount: 180, maxMarks: 720, totalMarksApplied: 0, scheduledFor: at(-60 * 24 * 7 * n), endsAt: at(-60 * 24 * 7 * n + 180),
    subjectIds: ['sub-phy', 'sub-che', 'sub-mat'], activeAttemptId: null, sectionCount: 3, negativeMarks: 1, instructions,
  })),
]
