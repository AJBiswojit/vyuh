import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute, screen, waitFor } from './helpers.jsx'
import { authService } from '@/services/mock/auth.js'
import { useExamStore } from '../../src/features/exam/store/examStore.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

// The loading state fires while the shell has not resolved a student id yet.
// A partial mock keeps every other hook in the module intact.
let mockedStudentId = /** @type {string | undefined} */ ('stu-ananya')
vi.mock('../../src/features/student/hooks/useStudentWorkspace.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useStudentId: () => mockedStudentId }
})

const CONFIRMATION = '/student/exams/exam-neet-practice/confirmation'
/** @type {any} */
let session
beforeAll(async () => {
  session = await authService.login({ email: 'ananya.sahoo@vidyutacademy.in', password: 'vyuh2026' })
})
beforeEach(() => {
  localStorage.clear()
  mockedStudentId = 'stu-ananya'
  useExamStore.getState().resetForTests()
})
afterEach(() => { useExamStore.getState().resetForTests() })

const receipt = {
  attemptId: 'att-confirmation-1', examId: 'exam-neet-practice', examTitle: 'NEET Practice 01',
  studentId: 'stu-ananya', submittedAt: '2026-11-07T04:00:00.000Z', reason: 'manual',
  counts: { answered: 5, notAnswered: 1, review: 0, notVisited: 0, total: 6 }, pendingSync: false,
}

/** @param {{ receipt?: boolean }} [options] */
function seedSubmitted({ receipt: withReceipt = true } = {}) {
  useExamStore.setState({
    activeAttemptId: null,
    attempts: {
      'att-confirmation-1': {
        attemptId: 'att-confirmation-1', examId: 'exam-neet-practice', studentId: 'stu-ananya',
        status: 'submitted', examTitle: 'NEET Practice 01', questionIds: [], entries: {},
        confidences: {}, integrityEvents: [], sections: [],
        receipt: withReceipt ? receipt : null, submissionInput: null,
      },
    },
  })
}

describe('exam confirmation page data states (D-18)', () => {
  it('shows a labelled loading state while the student id is unresolved', async () => {
    mockedStudentId = undefined
    await renderRoute(CONFIRMATION, { session })
    expect(await screen.findByText('Restoring your submission')).toBeTruthy()
    expect(screen.getByRole('status', { busy: true })).toBeTruthy()
  })

  it('shows an empty state on a direct URL instead of silently redirecting', async () => {
    await renderRoute(CONFIRMATION, { session })
    expect(await screen.findByText('No submission to confirm here')).toBeTruthy()
    expect(screen.getByText('0 SUBMISSIONS')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to exams' }).getAttribute('href')).toBe('/student/exams')
    expect(screen.getByRole('link', { name: 'Open exam detail' }).getAttribute('href')).toBe('/student/exams/exam-neet-practice')
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe(CONFIRMATION))
  })

  it('shows an error state when the attempt has no readable receipt', async () => {
    seedSubmitted({ receipt: false })
    await renderRoute(CONFIRMATION, { session })
    expect(await screen.findByText('The submission receipt could not be read')).toBeTruthy()
    expect(screen.getByText('E_RECEIPT')).toBeTruthy()
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Open result sheet' }).getAttribute('href')).toBe('/student/exams/exam-neet-practice/result')
  })

  it('shows the receipt and result-sheet handoff on success', async () => {
    seedSubmitted()
    await renderRoute(CONFIRMATION, { session })
    expect(await screen.findByText('NEET Practice 01')).toBeTruthy()
    expect(screen.getByRole('list', { name: 'Submission receipt' }).textContent).toContain('Answered')
    expect(screen.getByRole('link', { name: 'View result sheet' }).getAttribute('href')).toBe('/student/exams/exam-neet-practice/result?attempt=att-confirmation-1')
    expect(screen.getByText('Submitted')).toBeTruthy()
  })

  it('disables the result-sheet handoff while the final receipt is still syncing', async () => {
    seedSubmitted()
    useExamStore.setState((store) => ({ attempts: { ...store.attempts, 'att-confirmation-1': { ...store.attempts['att-confirmation-1'], receipt: { ...receipt, pendingSync: true } } } }))
    await renderRoute(CONFIRMATION, { session })
    expect(await screen.findByText('Sync pending')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'View result sheet' })).toBeNull()
    expect(screen.getByText('View result sheet').closest('[aria-disabled="true"]')).toBeTruthy()
  })
})
