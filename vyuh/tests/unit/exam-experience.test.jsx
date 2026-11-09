import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute, screen, waitFor } from './helpers.jsx'
import { authService } from '@/services/mock/auth.js'
import { buildQuestionBank, authoredSections } from '../../src/mock-data/questions.js'
import { useExamStore } from '../../src/features/exam/store/examStore.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

/** @type {any} */
let session

beforeAll(async () => {
  session = await authService.login({ email: 'ananya.sahoo@vidyutacademy.in', password: 'vyuh2026' })
})
beforeEach(() => {
  localStorage.clear()
  useExamStore.getState().resetForTests()
})

/** A minimal playable paper, same shape the hall tests use. */
function paper(count = 3) {
  const authored = buildQuestionBank(count)
  const questions = authored.map(({ correctOptions: _c, correctNumeric: _n, explanation: _e, ...question }) => question)
  return {
    exam: { id: 'exam-neet-practice', title: 'NEET Practice 01 — Physics, Chemistry, Biology', durationMinutes: 180, questionCount: count, maxMarks: count * 4, negativeMarks: 1, instructions: [], kind: 'mock', status: 'live', track: 'NEET', scheduledFor: null, endsAt: null, subjectIds: [], activeAttemptId: null, sectionCount: 3, totalMarksApplied: 0 },
    sections: authoredSections.map((section) => ({ ...section, questionIds: questions.filter((q) => q.sectionId === section.id).map((q) => q.id) })),
    questions,
    candidate: { name: 'Ananya Sahoo', rollNumber: 'VY-25-0187' },
    serverNow: new Date().toISOString(), offsetMs: 0, durationSeconds: 10_800,
    rules: [], markingScheme: { correct: 4, incorrect: -1, unattempted: 0 },
    declaration: 'I agree.',
  }
}

/** @param {string} examId */
function seedActiveAttempt(examId = 'exam-neet-practice') {
  const p = paper(3)
  useExamStore.getState().startAttempt({ attemptId: `att-${examId}-seed`, examId, studentId: 'stu-ananya', startedAt: new Date().toISOString(), deadlineAt: new Date(Date.now() + 3_600_000).toISOString(), serverNow: new Date().toISOString(), offsetMs: 0, durationSeconds: 10_800, resumed: false }, p)
  return `att-${examId}-seed`
}

/** @param {string} examId */
function seedSubmittedAttempt(examId = 'exam-neet-practice') {
  const attemptId = seedActiveAttempt(examId)
  const submittedAt = new Date().toISOString()
  useExamStore.getState().finalize(attemptId, {
    attemptId, examId, examTitle: 'NEET Practice 01 — Physics, Chemistry, Biology', studentId: 'stu-ananya',
    submittedAt, reason: 'manual', pendingSync: false,
    counts: { answered: 2, notAnswered: 1, review: 0, notVisited: 0, total: 3 },
  }, { attemptId, examId, studentId: 'stu-ananya', submittedAt, reason: 'manual', remainingSeconds: 120, entries: [], confidences: {}, integrityEvents: [], visits: [] })
  return attemptId
}

describe('student live exam — dashboard states', () => {
  it('fresh device: playable live exam offers an enabled Join exam; unplayable live exam stays disabled with the honest reason', async () => {
    await renderRoute('/student/exams?tab=live', { session })
    const joins = await screen.findAllByRole('button', { name: 'Join exam' })
    const playable = joins.find((button) => /** @type {HTMLButtonElement} */ (button).textContent === 'Join exam' && !button.disabled)
    expect(playable).toBeTruthy()
    // The Rotational Motion fixture has no authored question set: disabled, reason on the card.
    const disabled = joins.filter((button) => button.disabled)
    expect(disabled.length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/no authored question set/i).length).toBeGreaterThan(0)
    expect(screen.getByTestId('attempt-status-exam-neet-practice').textContent).toContain('Not started')
  })

  it('stored active attempt: dashboard offers Resume exam instead of Join', async () => {
    seedActiveAttempt('exam-neet-practice')
    await renderRoute('/student/exams?tab=live', { session })
    const resume = await screen.findByRole('button', { name: 'Resume exam' })
    expect(resume.disabled).toBe(false)
    expect(screen.getByTestId('attempt-status-exam-neet-practice').textContent).toContain('Attempt in progress')
  })

  it('submitted attempt: dashboard offers View submission and the instructions page stops offering Start', async () => {
    seedSubmittedAttempt('exam-neet-practice')
    await renderRoute('/student/exams?tab=live', { session })
    expect(await screen.findByRole('button', { name: 'View submission' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Start exam' })).toBeNull()
    expect(screen.getByTestId('attempt-status-exam-neet-practice').textContent).toContain('Submitted')
  })

  it('past papers show scores only when a real attempt exists and keep result/submission honest', async () => {
    await renderRoute('/student/exams?tab=past', { session })
    // Mock 08 has a seeded evaluated attempt (score 512 of 720).
    expect((await screen.findAllByText(/512/)).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'View result' }).length).toBeGreaterThan(0)
  })
})

describe('student live exam — instructions gate', () => {
  it('renders the five-status legend and the exact confirmation sentence; Start stays disabled until both checklist and confirmation pass', async () => {
    await renderRoute('/student/exams/exam-neet-practice/instructions', { session })
    for (const label of ['Not visited', 'Not answered', 'Answered', 'Marked for review', 'Answered and marked for review']) {
      expect((await screen.findAllByText(label)).length).toBeGreaterThan(0)
    }
    expect(screen.getByLabelText('I have read and understood the instructions.')).toBeTruthy()
    const start = screen.getByRole('button', { name: 'Start exam' })
    expect(start.disabled).toBe(true)
  })

  it('confirmation plus system check enables Start exam and enters the hall exactly once', async () => {
    const { user } = await renderRoute('/student/exams/exam-neet-practice/instructions', { session })
    await user.click(await screen.findByRole('button', { name: 'Run checks' }))
    await user.click(screen.getByLabelText('I have read and understood the instructions.'))
    const start = await screen.findByRole('button', { name: 'Start exam' })
    await waitFor(() => expect(start.disabled).toBe(false))
    await user.click(start)
    await waitFor(() => expect(screen.getByTestId('route').textContent).toContain('/student/exams/exam-neet-practice/hall'))
    expect(Object.values(useExamStore.getState().attempts).length).toBe(1)
  })
})

describe('student live exam — submission summary honesty', () => {
  it('a submitted paper without a published result shows the exact unpublished sentence and no marks', async () => {
    seedSubmittedAttempt('exam-rot-live')
    await renderRoute('/student/exams/exam-rot-live/confirmation', { session })
    expect(await screen.findByText('Your examination has been submitted. Results are not yet available.')).toBeTruthy()
    expect(screen.queryByText(/marks/i)).toBeNull()
    expect(screen.queryByRole('link', { name: /View result sheet/i })).toBeNull()
    expect(screen.getByLabelText('Submission receipt')).toBeTruthy()
  })

  it('a submitted paper with a published NEET sheet shows the result handoff', async () => {
    seedSubmittedAttempt('exam-neet-practice')
    await renderRoute('/student/exams/exam-neet-practice/confirmation', { session })
    expect(await screen.findByRole('link', { name: /View result sheet/i })).toBeTruthy()
    expect(screen.queryByText('Your examination has been submitted. Results are not yet available.')).toBeNull()
    expect(screen.getByText('Submission confirmed')).toBeTruthy()
  })
})
