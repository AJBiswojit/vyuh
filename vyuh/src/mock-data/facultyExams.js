/**
 * Faculty-scoped papers and the pattern presets the builder starts from.
 *
 * Five papers cover the whole lifecycle: a draft being assembled, one sitting in
 * the academic office's approval queue, one approved and scheduled, one live now
 * (the monitor's subject), and the completed NEET practice paper that the item
 * analysis reads. Timestamps are relative to load so the demo never looks stale.
 *
 * @typedef {import('../contracts/faculty.js').FacultyExam} FacultyExam
 * @typedef {import('../contracts/faculty.js').ExamPattern} ExamPattern
 * @typedef {import('../contracts/faculty.js').ExamSectionDraft} ExamSectionDraft
 */
import { questionBank } from './questionBank.js'
import { authoredSections, questions as authoredQuestions } from './questions.js'

export const FACULTY_ID = 'fac-snehasish'
export const FACULTY_NAME = 'Dr. Snehasish Mohapatra'

const now = Date.now()
/** @param {number} minutes */ function fromNow(minutes) { return new Date(now + minutes * 60_000).toISOString() }
/** @param {number} days */ function daysAgo(days) { return new Date(now - days * 86_400_000).toISOString() }

/**
 * Pattern presets. Counts are a starting point, not a rule: the builder lets
 * every section be re-counted, re-marked and time-boxed.
 * @type {ExamPattern[]}
 */
export const examPatterns = [
  {
    id: 'NEET', label: 'NEET', description: '180 questions, +4/−1, 200 minutes across four subjects.',
    durationMinutes: 200, marksPerQuestion: 4, negativeMarks: 1,
    sections: [
      { name: 'Physics', subjectId: 'sub-phy', count: 45, timeLimitMinutes: 0 },
      { name: 'Chemistry', subjectId: 'sub-che', count: 45, timeLimitMinutes: 0 },
      { name: 'Botany', subjectId: 'sub-bio', count: 45, timeLimitMinutes: 0 },
      { name: 'Zoology', subjectId: 'sub-bio', count: 45, timeLimitMinutes: 0 },
    ],
  },
  {
    id: 'JEE_MAIN', label: 'JEE Main', description: '75 questions, +4/−1, 180 minutes: three subjects, five numerical each.',
    durationMinutes: 180, marksPerQuestion: 4, negativeMarks: 1,
    sections: [
      { name: 'Physics', subjectId: 'sub-phy', count: 25, timeLimitMinutes: 0 },
      { name: 'Chemistry', subjectId: 'sub-che', count: 25, timeLimitMinutes: 0 },
      { name: 'Mathematics', subjectId: 'sub-mat', count: 25, timeLimitMinutes: 0 },
    ],
  },
  {
    id: 'JEE_ADVANCED', label: 'JEE Advanced', description: '54 questions, variable marking, 180 minutes, three parts.',
    durationMinutes: 180, marksPerQuestion: 4, negativeMarks: 2,
    sections: [
      { name: 'Physics', subjectId: 'sub-phy', count: 18, timeLimitMinutes: 60 },
      { name: 'Chemistry', subjectId: 'sub-che', count: 18, timeLimitMinutes: 60 },
      { name: 'Mathematics', subjectId: 'sub-mat', count: 18, timeLimitMinutes: 60 },
    ],
  },
  {
    id: 'GATE', label: 'GATE', description: '65 questions, 100 marks, 180 minutes, general aptitude included.',
    durationMinutes: 180, marksPerQuestion: 1, negativeMarks: 0.33,
    sections: [
      { name: 'General Aptitude', subjectId: 'sub-mat', count: 10, timeLimitMinutes: 25 },
      { name: 'Core', subjectId: 'sub-phy', count: 55, timeLimitMinutes: 0 },
    ],
  },
  {
    id: 'CUSTOM', label: 'Custom', description: 'Start empty. Sections, marks and limits are all yours.',
    durationMinutes: 90, marksPerQuestion: 4, negativeMarks: 1,
    sections: [{ name: 'Section 1', subjectId: 'sub-phy', count: 0, timeLimitMinutes: 0 }],
  },
]

/** @param {string} subjectId @param {number} take @param {number} [offset] */
function pick(subjectId, take, offset = 0) {
  const pool = questionBank.filter((question) => question.subjectId === subjectId)
  return pool.slice(offset, offset + take).map((question) => question.id)
}

/** @param {Partial<ExamSectionDraft> & { id: string, name: string, subjectId: string }} section @returns {ExamSectionDraft} */
function section(section_) {
  return {
    id: section_.id,
    name: section_.name,
    subjectId: section_.subjectId,
    marksPerQuestion: section_.marksPerQuestion ?? 4,
    negativeMarks: section_.negativeMarks ?? 1,
    timeLimitMinutes: section_.timeLimitMinutes ?? 0,
    questionIds: section_.questionIds ?? [],
  }
}

const standardIntegrity = {
  webcam: false, tabLock: true, copyBlock: true, ipLock: false, questionShuffle: true, optionShuffle: false,
}

/** @type {FacultyExam[]} */
export const facultyExams = [
  {
    id: 'exam-neet-mock-07',
    title: 'NEET Mock 07 — Full Syllabus',
    preset: 'NEET', presetLabel: 'NEET',
    ownerId: FACULTY_ID, ownerName: FACULTY_NAME,
    batchId: 'bat-neet-12', batchName: 'Aarogyam NEET 2026 — Morning',
    status: 'live',
    sections: [
      section({ id: 's7-phy', name: 'Physics', subjectId: 'sub-phy', marksPerQuestion: 4, negativeMarks: 1, questionIds: pick('sub-phy', 12) }),
      section({ id: 's7-che', name: 'Chemistry', subjectId: 'sub-che', marksPerQuestion: 4, negativeMarks: 1, questionIds: pick('sub-che', 12) }),
      section({ id: 's7-bio', name: 'Biology', subjectId: 'sub-bio', marksPerQuestion: 4, negativeMarks: 1, questionIds: pick('sub-bio', 12) }),
    ],
    durationMinutes: 200,
    scheduleStart: fromNow(-45), scheduleEnd: fromNow(155),
    resultReleaseRule: 'after_window', resultReleaseAt: null,
    integrityMode: 'strict',
    integrity: { ...standardIntegrity, webcam: true, ipLock: true },
    instructions: 'Section order is fixed. The hall locks tabs and blocks copy; webcam presence is logged.',
    totalQuestions: 36, totalMarks: 144,
    createdAt: daysAgo(12), updatedAt: daysAgo(1), approvedAt: daysAgo(2),
  },
  {
    id: 'exam-jee-main-11',
    title: 'JEE Main 11 — Part Test (Mechanics & Organic)',
    preset: 'JEE_MAIN', presetLabel: 'JEE Main',
    ownerId: FACULTY_ID, ownerName: FACULTY_NAME,
    batchId: 'bat-prayas-m', batchName: 'Prayas JEE 2027 — Morning',
    status: 'pending_approval',
    sections: [
      section({ id: 's11-phy', name: 'Physics', subjectId: 'sub-phy', questionIds: pick('sub-phy', 8, 5) }),
      section({ id: 's11-che', name: 'Chemistry', subjectId: 'sub-che', questionIds: pick('sub-che', 8, 2) }),
      section({ id: 's11-mat', name: 'Mathematics', subjectId: 'sub-mat', questionIds: pick('sub-mat', 8, 3) }),
    ],
    durationMinutes: 180,
    scheduleStart: fromNow(3 * 1440), scheduleEnd: fromNow(3 * 1440 + 180),
    resultReleaseRule: 'after_window', resultReleaseAt: null,
    integrityMode: 'standard',
    integrity: standardIntegrity,
    instructions: 'Part test over Mechanics and Organic Chemistry. Numerical answers to two decimals.',
    totalQuestions: 24, totalMarks: 96,
    createdAt: daysAgo(9), updatedAt: daysAgo(1), submittedAt: daysAgo(1),
    reviewNote: 'Sections re-balanced after the blueprint review: Physics gained two numericals.',
  },
  {
    id: 'exam-jee-adv-04',
    title: 'JEE Advanced 04 — Paper 1 Rehearsal',
    preset: 'JEE_ADVANCED', presetLabel: 'JEE Advanced',
    ownerId: FACULTY_ID, ownerName: FACULTY_NAME,
    batchId: 'bat-shikhar', batchName: 'Shikhar Droppers — Full day',
    status: 'scheduled',
    sections: [
      section({ id: 's4-phy', name: 'Physics', subjectId: 'sub-phy', marksPerQuestion: 4, negativeMarks: 2, timeLimitMinutes: 60, questionIds: pick('sub-phy', 10, 9) }),
      section({ id: 's4-che', name: 'Chemistry', subjectId: 'sub-che', marksPerQuestion: 4, negativeMarks: 2, timeLimitMinutes: 60, questionIds: pick('sub-che', 10, 8) }),
      section({ id: 's4-mat', name: 'Mathematics', subjectId: 'sub-mat', marksPerQuestion: 4, negativeMarks: 2, timeLimitMinutes: 60, questionIds: pick('sub-mat', 10, 5) }),
    ],
    durationMinutes: 180,
    scheduleStart: fromNow(6 * 60), scheduleEnd: fromNow(6 * 60 + 180),
    resultReleaseRule: 'scheduled', resultReleaseAt: fromNow(6 * 60 + 300),
    integrityMode: 'strict',
    integrity: { ...standardIntegrity, webcam: true, tabLock: true, ipLock: true },
    instructions: 'Section limits are enforced. A section locks when its clock runs out.',
    totalQuestions: 30, totalMarks: 120,
    createdAt: daysAgo(21), updatedAt: daysAgo(3), approvedAt: daysAgo(4),
  },
  {
    id: 'exam-neet-mock-08',
    title: 'NEET Mock 08 — Full Syllabus',
    preset: 'NEET', presetLabel: 'NEET',
    ownerId: FACULTY_ID, ownerName: FACULTY_NAME,
    batchId: 'bat-neet-12', batchName: 'Aarogyam NEET 2026 — Morning',
    status: 'draft',
    sections: [
      section({ id: 's8-phy', name: 'Physics', subjectId: 'sub-phy', marksPerQuestion: 4, negativeMarks: 1, questionIds: pick('sub-phy', 6, 12) }),
      section({ id: 's8-che', name: 'Chemistry', subjectId: 'sub-che', marksPerQuestion: 4, negativeMarks: 1, questionIds: pick('sub-che', 4, 12) }),
      section({ id: 's8-bio', name: 'Biology', subjectId: 'sub-bio', marksPerQuestion: 4, negativeMarks: 1, questionIds: [] }),
    ],
    durationMinutes: 200,
    scheduleStart: fromNow(9 * 1440), scheduleEnd: null,
    resultReleaseRule: 'immediate', resultReleaseAt: null,
    integrityMode: 'standard',
    integrity: standardIntegrity,
    instructions: '',
    totalQuestions: 10, totalMarks: 40,
    createdAt: daysAgo(2), updatedAt: daysAgo(0),
  },
  {
    id: 'exam-neet-practice',
    title: 'NEET Practice 01 — cohort sitting',
    preset: 'NEET', presetLabel: 'NEET',
    ownerId: FACULTY_ID, ownerName: FACULTY_NAME,
    batchId: 'bat-neet-12', batchName: 'Aarogyam NEET 2026 — Morning',
    status: 'completed',
    sections: authoredSections.map((authored) => ({
      id: authored.id,
      name: authored.name,
      subjectId: authored.subjectId,
      marksPerQuestion: 4,
      negativeMarks: 1,
      timeLimitMinutes: 0,
      questionIds: authoredQuestions.filter((question) => question.sectionId === authored.id).map((question) => question.id),
    })),
    durationMinutes: 200,
    scheduleStart: daysAgo(6), scheduleEnd: daysAgo(6),
    resultReleaseRule: 'immediate', resultReleaseAt: daysAgo(6 - 1 / 24),
    integrityMode: 'standard',
    integrity: standardIntegrity,
    instructions: 'The same paper the student seat sat. Item analysis runs on this sitting.',
    totalQuestions: authoredQuestions.length, totalMarks: authoredQuestions.length * 4,
    createdAt: daysAgo(30), updatedAt: daysAgo(6), approvedAt: daysAgo(20),
  },
]

/** @param {string} examId @returns {FacultyExam | null} */
export function examById(examId) {
  return facultyExams.find((exam) => exam.id === examId) ?? null
}

/** @param {string} presetId */
export function patternById(presetId) {
  return examPatterns.find((pattern) => pattern.id === presetId) ?? null
}
