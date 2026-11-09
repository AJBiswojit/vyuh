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

function paper(count = 6) {
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

function seedAttempt() {
  const p = paper(6)
  useExamStore.getState().startAttempt({ attemptId: 'att-hall-layout', examId: 'exam-neet-practice', studentId: 'stu-ananya', startedAt: new Date().toISOString(), deadlineAt: new Date(Date.now() + 3_600_000).toISOString(), serverNow: new Date().toISOString(), offsetMs: 0, durationSeconds: 10_800, resumed: false }, p)
}

describe('exam hall single-screen layout contract', () => {
  it('locks the page to the viewport with no document-level scroll', async () => {
    seedAttempt()
    const { container } = await renderRoute('/student/exams/exam-neet-practice/hall', { session })
    await waitFor(() => expect(container.querySelector('[data-exam-hall]')).toBeTruthy())
    const hall = container.querySelector('[data-exam-hall]')
    expect(hall?.className).toContain('h-dvh')
    expect(hall?.className).toContain('overflow-hidden')
    expect(hall?.className).not.toContain('min-h-dvh')
  })

  it('orders the regions: header → tools toolbar → question workspace → bottom navigation', async () => {
    seedAttempt()
    const { container } = await renderRoute('/student/exams/exam-neet-practice/hall', { session })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save and next' })).toBeTruthy())
    const tools = container.querySelector('[aria-label="Exam tools"]')
    const workspace = container.querySelector('section[aria-label="Question area"]')
    const nav = screen.getByRole('button', { name: 'Save and next' }).closest('footer')
    const header = container.querySelector('header')
    expect(tools && workspace && nav && header).toBeTruthy()
    expect(header?.compareDocumentPosition(/** @type {Element} */ (tools))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(tools?.compareDocumentPosition(/** @type {Element} */ (workspace))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(workspace?.compareDocumentPosition(/** @type {Element} */ (nav))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('keeps the palette independently scrollable and visible only at lg+ (drawer below)', async () => {
    seedAttempt()
    const { container } = await renderRoute('/student/exams/exam-neet-practice/hall', { session })
    await waitFor(() => expect(container.querySelector('aside[aria-label="Question palette"]')).toBeTruthy())
    const aside = container.querySelector('aside[aria-label="Question palette"]')
    expect(aside?.className).toContain('overflow-y-auto')
    expect(aside?.className).toContain('min-h-0')
    const wrapper = aside?.parentElement
    expect(wrapper?.className).toContain('hidden')
    expect(wrapper?.className).toContain('lg:block')
    // Bottom navigation remains available in every viewport.
    expect(screen.getByRole('button', { name: 'Clear response' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mark for review and next' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Save and next' })).toBeTruthy()
    expect(screen.getByTestId('exam-timer')).toBeTruthy()
  })
})
