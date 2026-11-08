import { beforeAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute, screen, waitFor } from './helpers.jsx'
import { authService } from '@/services/mock/auth.js'
import { V2_ROUTE_MATRIX, V2_NAMESPACES } from '@/app/routes/v2RouteTable.js'
import { useExamStore } from '../../src/features/exam/store/examStore.js'
import { buildQuestionBank, authoredSections } from '../../src/mock-data/questions.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

const PARAMS = {
  examId: 'exam-neet-practice', sessionId: 'ses-rot-b', recordingId: 'rec-rot-b',
  batchId: 'bat-prayas-m', questionId: 'qb-001', doubtId: 'doubt-torque-axis',
  topicId: 'ch-rot', roomId: 'room-torque', inviteCode: 'demo',
}
/** @param {string} pattern */
const fill = (pattern) => pattern.replace(/:([A-Za-z]+)/g, (_match, key) => PARAMS[key] ?? key)

/** @type {Record<string, any>} */
const sessions = {}
beforeAll(async () => {
  sessions.student = await authService.login({ email: 'ananya.sahoo@vidyutacademy.in', password: 'vyuh2026' })
  sessions.faculty = await authService.login({ email: 'snehasish@vidyutacademy.in', password: 'vyuh2026' })
  sessions.admin = await authService.login({ email: 'academic.office@vidyutacademy.in', password: 'vyuh2026' })
})
beforeEach(() => { localStorage.clear(); useExamStore.getState().resetForTests() })
afterEach(() => { useExamStore.getState().resetForTests() })

/** The hall redirects away when no attempt exists, so give it a real one. */
function seedExamAttempt() {
  const authored = buildQuestionBank(6)
  const publicQuestions = authored.map(({ correctOptions: _c, correctNumeric: _n, explanation: _e, ...question }) => question)
  const paper = {
    exam: { id: 'exam-neet-practice', title: 'NEET Practice 01', durationMinutes: 180, questionCount: 6, maxMarks: 24, negativeMarks: 1, instructions: [], kind: 'mock', status: 'live', track: 'NEET', scheduledFor: null, endsAt: null, subjectIds: [], activeAttemptId: null, sectionCount: 3, totalMarksApplied: 0 },
    sections: authoredSections.map((section) => ({ ...section, questionIds: publicQuestions.filter((q) => q.sectionId === section.id).map((q) => q.id) })),
    questions: publicQuestions,
    candidate: { name: 'Ananya Sahoo', rollNumber: 'VY-25-0187' },
    serverNow: new Date(Date.now() - 60_000).toISOString(), offsetMs: 0, durationSeconds: 10_800,
    rules: [], markingScheme: { correct: 4, incorrect: -1, unattempted: 0 }, declaration: 'I accept.',
  }
  const receipt = {
    attemptId: 'att-v2-hall', examId: 'exam-neet-practice', studentId: 'stu-ananya',
    startedAt: new Date(Date.now() - 60_000).toISOString(), deadlineAt: new Date(Date.now() + 3_600_000).toISOString(),
    serverNow: new Date(Date.now() - 60_000).toISOString(), offsetMs: 0, durationSeconds: 10_800, resumed: false,
  }
  useExamStore.getState().startAttempt(receipt, paper)
}

describe('v2 alias layer — every reference path resolves', () => {
  for (const alias of V2_ROUTE_MATRIX) {
    it(`${alias.path} (${alias.role}) -> ${alias.to}`, async () => {
      if (alias.path === '/s/exams/:examId/hall') seedExamAttempt()
      await renderRoute(fill(alias.path), { session: sessions[alias.role] })
      await waitFor(() => expect(screen.getByTestId('route').textContent).toBe(fill(alias.to)))
    })
  }

  it('preserves query and hash through an alias redirect', async () => {
    await renderRoute('/s/recordings/rec-rot-b?t=12#notes', { session: sessions.student })
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/student/recordings/rec-rot-b?t=12#notes'))
  })

  /* Batch 3 (WS12): /a/people stays a redirect to the SINGLE canonical People
     implementation; deep links must keep their query and hash unchanged. This
     is the only assertion added to this suite; all 33 aliases and role guards
     are otherwise untouched (C1). */
  it('keeps the /a/people redirect to /admin/users with query and hash intact', async () => {
    await renderRoute('/a/people?tab=faculty&status=locked#row-4', { session: sessions.admin })
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/admin/users?tab=faculty&status=locked#row-4'))
    expect(screen.getByRole('heading', { level: 1, name: 'User management' })).toBeTruthy()
  })

  it('catches unlisted v2 sub-paths inside the right canonical namespace', async () => {
    expect(V2_NAMESPACES.map((entry) => entry.from)).toEqual(['/s', '/f', '/a'])
    await renderRoute('/s/exams/exam-neet-practice/instructions', { session: sessions.student })
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/student/exams/exam-neet-practice/instructions'))
  })
})

const WRONG_ROLE = /** @type {const} */ ({ student: 'faculty', faculty: 'admin', admin: 'student' })

describe('v2 alias layer — role guards', () => {
  // Every alias, not just a sample, must refuse a session from another role.
  for (const alias of V2_ROUTE_MATRIX) {
    it(`${alias.path} denies a ${WRONG_ROLE[alias.role]} session`, async () => {
      await renderRoute(fill(alias.path), { session: sessions[WRONG_ROLE[alias.role]] })
      await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/access-denied'))
    })
  }

  it('sends an anonymous visitor to /login instead of a workspace page', async () => {
    await renderRoute('/s/exams')
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/login'))
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back.' })).toBeTruthy()
  })

  it.each([
    ['student', '/f/questions', 'Student workspace'],
    ['faculty', '/a/people', 'Faculty workspace'],
    ['admin', '/s/profile', 'Academic office'],
  ])('denies a %s on another role v2 path without leaking the other role chrome', async (role, path, navigation) => {
    await renderRoute(path, { session: sessions[role] })
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/access-denied'))
    expect(screen.getByRole('navigation', { name: navigation })).toBeTruthy()
  })

  it('renders a canonical page for each role through its v2 entry point', async () => {
    await renderRoute('/f/questions', { session: sessions.faculty })
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/faculty/bank'))
    expect(await screen.findByRole('heading', { level: 1, name: /Question bank/i })).toBeTruthy()
  })
})

describe('canonical and legacy routes still work', () => {
  it('/sign-in still redirects to /login', async () => {
    await renderRoute('/sign-in?next=%2Fstudent#top')
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/login?next=%2Fstudent#top'))
  })

  it('/app/profile still redirects into the student namespace', async () => {
    await renderRoute('/app/profile', { session: sessions.student })
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/student/profile'))
  })

  it('/student/papers and /student/account keep their compatibility pages', async () => {
    await renderRoute('/student/papers?filter=live#top', { session: sessions.student })
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/student/papers?filter=live#top'))
    expect(await screen.findByRole('heading', { level: 1, name: 'Exams' })).toBeTruthy()
  })

  it('an unknown path keeps the student chrome instead of the public 404', async () => {
    await renderRoute('/student/does-not-exist', { session: sessions.student })
    expect(await screen.findByRole('navigation', { name: 'Student workspace' })).toBeTruthy()
  })
})
