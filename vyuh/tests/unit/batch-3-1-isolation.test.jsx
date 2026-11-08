/**
 * BATCH 3.1 — focused remediation tests (WS1 / WS6 / WS9 / WS10 / WS11).
 *
 * D-1: issued students must never receive the demo seats' academic records on
 * the five learning routes, nor through direct service/deep-link calls. The
 * demo seats `stu-ananya` / `fac-snehasish` must stay byte-for-byte unchanged.
 *
 * jsdom only. No real browser, viewport, console, clipboard, download, media,
 * cross-tab or real-browser axe result is claimed here.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { adminService } from '@/services/mock/admin.js'
import { authService } from '@/services/mock/auth.js'
import { learningService } from '@/services/mock/learning.js'
import { liveService } from '@/services/mock/live.js'
import { courseService, questionService } from '@/services/mock/courses.js'
import { analysisService } from '@/services/mock/analysis.js'
import { examFlowService } from '@/services/mock/examFlow.js'
import { studentService, assessmentService } from '@/services/mock/students.js'
import { facultyService } from '@/services/mock/faculty.js'
import {
  accountWorkspace, sessionWorkspace, requireStudentWorkspace,
  studentWorkspace, facultyWorkspace,
} from '@/services/mock/ownWorkspace.js'
import {
  liveSessions, recordings, doubts as doubtFixtures, studyRooms, exams,
  configureInstituteIds, loadAccountsDb,
} from '@/mock-data/index.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { renderRoute, screen } from './helpers.jsx'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

const ADMIN_ID = 'adm-pratibha'
const DEMO_STUDENT = 'stu-ananya'
const source = (relative) => readFileSync(resolve(process.cwd(), relative), 'utf8')

async function asAdmin() {
  const session = await authService.login({ email: 'academic.office@vidyutacademy.in', password: 'vyuh2026' })
  useSessionStore.getState().setSession(session)
  return session
}

/** Create a REAL institute-issued student and finish the mandatory first-login
 *  setup so the route guards allow the student workspace. No session is forged. */
async function issuedStudent() {
  await asAdmin()
  const created = await adminService.createUser(ADMIN_ID, {
    role: 'student',
    name: 'Isolation Student',
    email: `isolation.${Date.now()}${Math.random().toString(36).slice(2, 7)}@vidyutacademy.in`,
    phone: '9876501234',
    rollNumber: `ISO-${Math.floor(1000 + Math.random() * 8999)}`,
    batchId: 'bat-prayas-m',
  })
  const { instituteId } = created.account
  const temporaryPassword = created.credentials[0].temporaryPassword
  const first = await authService.login({ email: instituteId, password: temporaryPassword })
  useSessionStore.getState().setSession(first)
  expect(first.mustChangePassword).toBe(true)
  const chosen = 'IsolationNew2026x'
  await authService.changePasswordWithSetup({ newPassword: chosen, confirmPassword: chosen })
  const session = await authService.login({ email: instituteId, password: chosen })
  useSessionStore.getState().setSession(session)
  expect(session.mustChangePassword).toBe(false)
  return { instituteId, session, created }
}

async function demoStudentSession() {
  const session = await authService.login({ email: 'ananya.sahoo@vidyutacademy.in', password: 'vyuh2026' })
  useSessionStore.getState().setSession(session)
  return session
}

/** BATCH 3.2: the demo faculty seat also needs its own valid matching session. */
async function demoFacultySession() {
  const session = await authService.login({ email: 'snehasish@vidyutacademy.in', password: 'vyuh2026' })
  useSessionStore.getState().setSession(session)
  return session
}

beforeEach(async () => {
  localStorage.clear()
  useSessionStore.getState().clear()
  /* '99' is TEST FIXTURE DATA, not institute policy. Batch 2 ships year:null. */
  configureInstituteIds({ year: '99' })
  await asAdmin()
})

/* ── WS1 — the single shared eligibility helper ─────────────────────────── */

describe('WS1 — one shared own-workspace eligibility mechanism (D-1)', () => {
  it('classification is fail-closed for missing identity and forged Institute IDs', async () => {
    expect(accountWorkspace('', 'student').kind).toBe('invalid')
    expect(accountWorkspace(undefined, 'student').kind).toBe('invalid')
    expect(accountWorkspace('   ', 'student').kind).toBe('invalid')
    expect(accountWorkspace('VYU-S-99-9999', 'student').kind).toBe('invalid')
    /* BATCH 3.2 / F-01: an arbitrary non-Institute-ID identifier is invalid. */
    expect(accountWorkspace('totally-unknown-id', 'student').kind).toBe('invalid')
    expect(() => requireStudentWorkspace('')).toThrow(/not_found|could not find/i)
    expect(() => requireStudentWorkspace('VYU-S-99-9999')).toThrow(/not_found|could not find/i)
  })

  it('demo seats stay in the demo workspace and issued seats resolve canonically', async () => {
    const { instituteId } = await issuedStudent()
    expect(studentWorkspace(instituteId).kind).toBe('issued')
    expect(studentWorkspace(instituteId).record.source).toBe('institute_issued')
    expect(sessionWorkspace('student').kind).toBe('issued')
    /* BATCH 3.2: each demo seat requires its OWN valid matching session. */
    await demoStudentSession()
    expect(studentWorkspace(DEMO_STUDENT).kind).toBe('demo')
    expect(sessionWorkspace('student').kind).toBe('demo')
    await demoFacultySession()
    expect(facultyWorkspace('fac-snehasish').kind).toBe('demo')
  })

  it('an issued account cannot address another issued account through a direct service call', async () => {
    const first = await issuedStudent()
    await asAdmin()
    const second = await adminService.createUser(ADMIN_ID, {
      role: 'student', name: 'Other Student',
      email: `other.${Date.now()}@vidyutacademy.in`, batchId: 'bat-prayas-m',
    })
    const session = await authService.login({
      email: first.instituteId,
      password: 'IsolationNew2026x',
    })
    useSessionStore.getState().setSession(session)
    expect(studentWorkspace(second.account.instituteId).kind).toBe('invalid')
    expect(() => requireStudentWorkspace(second.account.instituteId)).toThrow(/not_found|could not find/i)
  })

  it('the helper is the single boundary consulted by every student service', () => {
    const files = [
      'src/services/mock/learning.js', 'src/services/mock/live.js',
      'src/services/mock/examFlow.js', 'src/services/mock/analysis.js',
      'src/services/mock/courses.js', 'src/services/mock/students.js',
      'src/services/mock/faculty.js',
    ]
    for (const file of files) {
      expect(source(file)).toContain("from './ownWorkspace.js'")
    }
    /* No duplicated session/registry resolver left in students/faculty. */
    expect(source('src/services/mock/students.js')).not.toContain('loadAccountsDb()')
    expect(source('src/services/mock/faculty.js')).not.toContain('accountByIdentifier(')
  })

  it('live classes are empty for an issued student and unchanged for the demo seat', async () => {
    const { instituteId } = await issuedStudent()
    expect(await learningService.listLiveSessions(instituteId)).toEqual([])
    expect(await liveService.listUpcoming(instituteId)).toEqual([])
    expect(await liveService.listUpcoming()).toEqual([])
    await demoStudentSession()
    expect((await learningService.listLiveSessions(DEMO_STUDENT)).length).toBe(liveSessions.length)
    expect((await liveService.listUpcoming(DEMO_STUDENT)).length).toBe(liveSessions.length)
  })

  it('recordings are empty for an issued student and unchanged for the demo seat', async () => {
    const { instituteId } = await issuedStudent()
    expect(await learningService.listRecordings(instituteId)).toEqual([])
    expect(await liveService.listRecordings(instituteId)).toEqual([])
    expect(await liveService.listRecordings()).toEqual([])
    await expect(learningService.getRecording(recordings[0].id, instituteId)).rejects.toMatchObject({ code: 'not_found' })
    await expect(learningService.savePlayback(recordings[0].id, instituteId, { positionSeconds: 10, watchedThroughSeconds: 10, ended: false, speed: 1 })).rejects.toMatchObject({ code: 'not_found' })
    await demoStudentSession()
    expect((await learningService.listRecordings(DEMO_STUDENT)).length).toBe(recordings.length)
  })

  it('attendance has no fabricated history or percentage for an issued student', async () => {
    const { instituteId } = await issuedStudent()
    const report = await learningService.getAttendance(instituteId)
    expect(report.sessions).toEqual([])
    expect(report.summary.total).toBe(0)
    expect(report.summary.present).toBe(0)
    expect(report.defaulter).toBe(false)
    const summary = await studentService.getAttendance(instituteId)
    expect(summary).toMatchObject({ present: 0, total: 0, percentage: 0 })
    await demoStudentSession()
    const demo = await learningService.getAttendance(DEMO_STUDENT)
    expect(demo.sessions.length).toBeGreaterThan(0)
  })

  it('doubts are own-only for an issued student and unchanged for the demo seat', async () => {
    const { instituteId } = await issuedStudent()
    expect(await learningService.listDoubts(instituteId)).toEqual([])
    expect(await studentService.listDoubts(instituteId)).toEqual([])
    await expect(learningService.getDoubt(doubtFixtures[0].id, instituteId)).rejects.toMatchObject({ code: 'not_found' })
    /* An issued account may create its OWN doubt, with no demo recording attached. */
    const own = await learningService.createDoubt({ studentId: instituteId, title: 'My own question', body: 'About my own work', recordingId: recordings[0].id })
    expect(own.recordingId).toBeNull()
    expect((await learningService.listDoubts(instituteId)).map((item) => item.id)).toEqual([own.id])
    await demoStudentSession()
    expect((await learningService.listDoubts(DEMO_STUDENT)).length).toBe(doubtFixtures.length)
  })

  it('study rooms are empty for an issued student and unchanged for the demo seat', async () => {
    const { instituteId } = await issuedStudent()
    expect(await learningService.listStudyRooms(instituteId)).toEqual([])
    expect(await studentService.listStudyRooms(instituteId)).toEqual([])
    await expect(learningService.getStudyRoom(studyRooms[0].id, instituteId)).rejects.toMatchObject({ code: 'not_found' })
    await expect(learningService.joinStudyRoom(studyRooms[0].id, instituteId)).rejects.toMatchObject({ code: 'not_found' })
    await demoStudentSession()
    expect((await learningService.listStudyRooms(DEMO_STUDENT)).length).toBe(studyRooms.length)
  })

  it('live-room deep links and realtime subscriptions fail closed for issued accounts', async () => {
    const { instituteId } = await issuedStudent()
    await expect(learningService.getLiveRoom(liveSessions[0].id, instituteId)).rejects.toMatchObject({ code: 'not_found' })
    await expect(learningService.joinLive(liveSessions[0].id, instituteId)).rejects.toMatchObject({ code: 'not_found' })
    await expect(learningService.sendChat(liveSessions[0].id, instituteId, 'hello')).rejects.toMatchObject({ code: 'not_found' })
    expect(learningService.subscribe(liveSessions[0].id, instituteId, () => {})).toBeTypeOf('function')
    expect(learningService.subscribeRoom(studyRooms[0].id, instituteId, () => {})).toBeTypeOf('function')
  })

  it('notifications, exams, attempts, performance and latest report are own-only', async () => {
    const { instituteId } = await issuedStudent()
    expect(await studentService.listNotifications(instituteId)).toEqual([])
    expect(await studentService.markNotificationsRead(instituteId)).toEqual([])
    expect(await assessmentService.listExams(instituteId)).toEqual([])
    expect(await assessmentService.listAttempts(instituteId)).toEqual([])
    expect(await assessmentService.getPerformance(instituteId)).toEqual({ attempts: [], scoreTrend: [], subjects: [] })
    expect(await assessmentService.getLatestReport(instituteId)).toBeNull()
    await demoStudentSession()
    expect((await assessmentService.listExams(DEMO_STUDENT)).length).toBeGreaterThan(0)
  })

  it('issued faculty keep their own workspace; demo faculty are unchanged', async () => {
    await asAdmin()
    const created = await adminService.createUser(ADMIN_ID, {
      role: 'faculty', name: 'Isolation Faculty', email: `isofac.${Date.now()}@vidyutacademy.in`,
    })
    const id = created.account.instituteId
    /* BATCH 3.2: the Admin session that created the record is NOT a valid
       matching issued faculty session. Sign in as that faculty. */
    const issuedFacultySession = await authService.login({ email: id, password: created.credentials[0].temporaryPassword })
    useSessionStore.getState().setSession(issuedFacultySession)
    expect(facultyWorkspace(id).kind).toBe('issued')
    const dashboard = await facultyService.getDashboard(id)
    expect(dashboard).toBeTruthy()
    expect(loadAccountsDb().accounts[id].source).toBe('institute_issued')
    await demoFacultySession()
    expect(facultyWorkspace('fac-snehasish').kind).toBe('demo')
  })
})

/* ── WS6 — direct-service / deep-link ownership ────────────────────────── */

describe('WS6 — direct service access is scoped, no navigation-hiding workaround', () => {
  it('analysis returns an honest unpublished result with no borrowed score sheet', async () => {
    const { instituteId } = await issuedStudent()
    const examId = exams[0].id
    const result = await analysisService.getAnalysis(examId, instituteId)
    expect(result.source).toBe('unpublished')
    expect(result.scoreSummary).toBeNull()
    expect(result.details).toBeNull()
    expect(result.notice).toMatch(/No result sheet is available/)
    expect(result.candidateName).toBe('Isolation Student')
    expect(result.studentId).toBe(instituteId)
    await expect(analysisService.getRevision(instituteId, 'topic-1')).rejects.toMatchObject({ code: 'revision_unavailable' })
  })

  it('exam flow refuses to hand a demo paper or submission to an issued student', async () => {
    const { instituteId } = await issuedStudent()
    const examId = exams[0].id
    await expect(examFlowService.getPaper(examId, instituteId)).rejects.toMatchObject({ code: 'exam_unavailable' })
    await expect(examFlowService.startAttempt({ examId, studentId: instituteId, declarationAccepted: true, systemCheckPassed: true })).rejects.toMatchObject({ code: 'exam_unavailable' })
    await expect(examFlowService.submitAttempt({ examId, studentId: instituteId, attemptId: 'a', submittedAt: '', reason: 'manual', remainingSeconds: 0, entries: [], confidences: {}, integrityEvents: [] })).rejects.toMatchObject({ code: 'exam_unavailable' })
  })

  it('course and question catalogues are empty for an issued student session', async () => {
    const { session } = await issuedStudent()
    useSessionStore.getState().setSession(session)
    expect(await courseService.listCourses()).toEqual([])
    expect(await questionService.listSamples()).toEqual([])
    const demo = await demoStudentSession()
    useSessionStore.getState().setSession(demo)
    expect((await courseService.listCourses()).length).toBeGreaterThan(0)
    expect((await questionService.listSamples()).length).toBeGreaterThan(0)
  })

  it('the gate lives in the services, not in route visibility', () => {
    const routes = source('src/app/routes/AppRoutes.jsx')
    expect(routes).toContain('path="/student/live"')
    expect(routes).toContain('path="/student/attendance"')
    /* BATCH 3.2: every fixture-serving consumer uses a THROWING getter from
       the single fail-closed boundary (the exact getter varies by service). */
    const consumers = {
      'src/services/mock/learning.js': 'demoStudentWorkspace',
      'src/services/mock/analysis.js': 'requireStudentWorkspace',
      'src/services/mock/examFlow.js': 'requireSessionWorkspace',
      'src/services/mock/live.js': 'demoSessionWorkspace',
      'src/services/mock/courses.js': 'demoSessionWorkspace',
      'src/services/mock/students.js': 'requireStudentWorkspace',
      'src/services/mock/faculty.js': 'requireFacultyWorkspace',
    }
    for (const [file, getter] of Object.entries(consumers)) {
      expect(source(file)).toContain(getter)
    }
  })
})

/* ── WS9 — no fabricated attendance for issued students ─────────────────── */

describe('WS9 — Admin batch detail attendance honesty (R-5)', () => {
  it('issued members report no records; demo members keep their seeded figures', async () => {
    const { instituteId } = await issuedStudent()
    await asAdmin()
    const detail = await adminService.getAdminBatch(ADMIN_ID, 'bat-prayas-m')
    const issued = detail.members.find((member) => member.id === instituteId)
    expect(issued).toBeTruthy()
    expect(issued.attendancePercent).toBeNull()
    expect(detail.summary.averageAttendance).toBeNull()
    /* Only members with a real numeric record can count as defaulters; the
       issued member with no records is NOT silently counted as 0%. */
    expect(detail.summary.defaulters).toBe(
      detail.members.filter((member) => typeof member.attendancePercent === 'number' && member.attendancePercent < 75).length,
    )
    const demo = detail.members.find((member) => member.attendancePercent !== null)
    expect(demo?.attendancePercent).toBeTypeOf('number')
    expect(source('src/features/admin/pages/AdminBatchDetailPage.jsx')).toContain('No records')
    expect(source('src/features/learning/pages/AttendancePage.jsx')).toContain('No attendance records yet')
  })
})

/* ── WS10 — latent hooks are scoped ─────────────────────────────────────── */

describe('WS10 — useRecordings / useUpcomingSessions seat scoping', () => {
  it('both hooks pass the student id to the service and include it in the query key', () => {
    const hooks = source('src/features/student/hooks/useStudentWorkspace.js')
    expect(hooks).toMatch(/useRecordings\(studentId\)/)
    expect(hooks).toMatch(/queryKey: \[\.\.\.queryKeys\.recordings, studentId/)
    expect(hooks).toMatch(/services\.live\.listRecordings\(studentId\)/)
    expect(hooks).toMatch(/services\.live\.listUpcoming\(studentId\)/)
    expect(hooks).toContain('enabled: Boolean(studentId)')
  })

  it('the parameterless live service derives identity from the persisted session', async () => {
    const { session } = await issuedStudent()
    useSessionStore.getState().setSession(session)
    expect(sessionWorkspace('student').kind).toBe('issued')
    expect(await liveService.listUpcoming()).toEqual([])
    expect(await liveService.listRecordings()).toEqual([])
  })
})

/* ── WS11 — primary action consistency ─────────────────────────────────── */

describe('WS11 — dialog confirmation owns the primary action', () => {
  it('background PageHeader actions are disabled while the create dialog is open', async () => {
    const session = useSessionStore.getState().session
    const { user: actor } = await renderRoute('/admin/users', { session })
    const buttons = await screen.findAllByRole('button', { name: 'Create account' })
    expect(buttons).toHaveLength(1)
    expect(buttons[0].hasAttribute('disabled')).toBe(false)
    await actor.click(buttons[0])
    await waitFor(() => expect(screen.getByTestId('create-user-dialog')).toBeTruthy())
    const after = screen.getAllByRole('button', { name: 'Create account' })
    expect(after.length).toBeGreaterThanOrEqual(2)
    /* The page-level action is disabled; the dialog still owns the (primary)
       submit. The submit is also disabled until the form is valid, which is the
       existing form rule, not a weakened confirmation. */
    expect(after[0].hasAttribute('disabled')).toBe(true)
    const dialog = screen.getByTestId('create-user-dialog')
    expect(dialog.querySelector('button[type="submit"]')).toBeTruthy()
    expect(dialog.querySelector('button[type="submit"]')?.className).toMatch(/bg-ember/)
    const page = source('src/features/admin/pages/AdminUsersPage.jsx')
    expect(page).toContain('overlayOpen')
    expect(page).toContain('onDialogStateChange')
    expect(source('src/features/admin/pages/AdminImportPage.jsx')).toContain('disabled={credentials.length > 0}')
  })
})

/* ── Route-level U-3 acceptance: five honest empty states ───────────────── */

describe('route-level U-3 — five learning routes show honest empty states', () => {
  const cases = [
    ['/student/live', /No classes in this mode/i],
    ['/student/recordings', /No recordings match/i],
    ['/student/doubts', /No doubts here/i],
    ['/student/study-rooms', /No interactive rooms open/i],
    ['/student/attendance', /No attendance records yet/i],
  ]

  for (const [path, message] of cases) {
    it(`${path} shows no demo academic data for an issued student`, async () => {
      const { session, instituteId } = await issuedStudent()
      await renderRoute(path, { session })
      expect(await screen.findByText(message)).toBeTruthy()
      expect(screen.queryByText(/Ananya Sahoo/)).toBeNull()
      expect(screen.queryByText(/VY-25-0187/)).toBeNull()
      expect(screen.getByTestId('route').textContent).toBe(path)
      expect(loadAccountsDb().accounts[instituteId].source).toBe('institute_issued')
    })
  }

  it('demo student keep seeded content on /student/live and /student/attendance', async () => {
    const session = await demoStudentSession()
    await renderRoute('/student/live', { session })
    expect(await screen.findByRole('heading', { name: /Live classes/i })).toBeTruthy()
    await renderRoute('/student/attendance', { session })
    expect(await screen.findByText(/Monthly summary/)).toBeTruthy()
  })
})
