/**
 * BATCH 3.2 — identity/session fail-closed regression suite (F-01 / F-02 / F-04).
 *
 * Reproduces the final acceptance review's binding violations as NEGATIVE
 * controls, then proves the four confirmed Batch 3.2 identity rulings plus the
 * two user safeguards:
 *
 *   1. Strict demo identity/session matching.
 *   2. NO production demo-preview capability or consumer.
 *   3. Frozen DEMO_IDENTITIES + mandatory valid matching demo-seat sessions;
 *      no production test-ID allowlist and no `fixture:` namespace.
 *   4. An issued identity is valid ONLY with a valid matching issued session;
 *      missing / expired / malformed / wrong-role / mismatched sessions resolve
 *      `invalid` and fail closed (no "or no conflicting session").
 *
 *   Safeguard 1: canonical identity ownership is verified across EVERY accepted
 *   identifier and alias form; no alternate identifier bypasses the matching
 *   session requirement.
 *
 * jsdom ONLY. No real browser, viewport, console, clipboard, download, media,
 * cross-tab or real-browser axe result is claimed here.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '@/services/mock/auth.js'
import { adminService } from '@/services/mock/admin.js'
import {
  DEMO_IDENTITIES, accountWorkspace, studentWorkspace, sessionWorkspace,
  requireStudentWorkspace, requireFacultyWorkspace, requireSessionWorkspace,
  demoStudentWorkspace, demoFacultyWorkspace, demoSessionWorkspace,
} from '@/services/mock/ownWorkspace.js'
import {
  configureInstituteIds, loadAccountsDb, accountByIdentifier,
  liveSessions, recordings, doubts as doubtFixtures, studyRooms,
  attendanceHistory, courses, questionSamples, exams,
} from '@/mock-data/index.js'
import { learningService } from '@/services/mock/learning.js'
import { liveService } from '@/services/mock/live.js'
import { courseService, questionService } from '@/services/mock/courses.js'
import { examFlowService } from '@/services/mock/examFlow.js'
import { analysisService } from '@/services/mock/analysis.js'
import { studentService, dashboardService, assessmentService } from '@/services/mock/students.js'
import { facultyService } from '@/services/mock/faculty.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import {
  DEMO_SEATS, signInDemoStudent, signInDemoFaculty, signInIssuedStudent, signInIssuedFaculty,
  signInAdmin, signOut, expirePersistedSession, malformedPersistedSession,
} from '../helpers/workspaceIdentity.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

const source = (relative) => readFileSync(resolve(process.cwd(), relative), 'utf8')
/** Source scans target executable code, not the explanatory prose that names
 *  the very patterns being forbidden. */
const codeOnly = (relative) => source(relative)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1')
const UNKNOWN = 'totally-unknown-id'
const FORGED = 'VYU-S-99-9999'
const SYNC_KEY = 'vyuh.mock.exam.sync'

beforeEach(() => {
  localStorage.clear()
  useSessionStore.getState().clear()
  /* '99' is TEST FIXTURE DATA, not institute policy. Batch 2 ships year:null. */
  configureInstituteIds({ year: '99' })
})

/** Resolve a service call to its thrown error (or undefined when it returned). */
async function failureOf(fn) {
  try { await fn(); return undefined } catch (error) { return error }
}

/* ── 1. Frozen demo set, no second identity system ───────────────────────── */

describe('B3.2 ruling 3 — one frozen demo set, no production test-ID allowlist', () => {
  it('DEMO_IDENTITIES is deeply frozen and contains exactly the seeded seats', () => {
    expect(Object.isFrozen(DEMO_IDENTITIES)).toBe(true)
    expect(Object.isFrozen(DEMO_IDENTITIES.student)).toBe(true)
    expect(Object.isFrozen(DEMO_IDENTITIES.faculty)).toBe(true)
    expect(DEMO_IDENTITIES.student).toEqual(['stu-ananya'])
    expect(DEMO_IDENTITIES.faculty).toEqual(['fac-rituparna', 'fac-snehasish'])
    expect(JSON.stringify(DEMO_IDENTITIES)).not.toContain('adm-pratibha')
    expect(DEMO_SEATS.student.id).toBe('stu-ananya')
    expect(DEMO_SEATS.faculty.id).toBe('fac-snehasish')
  })

  it('demo seats are NOT canonical registry records, so no second identity store exists', () => {
    expect(accountByIdentifier('stu-ananya', loadAccountsDb())).toBeNull()
    expect(accountByIdentifier('fac-snehasish', loadAccountsDb())).toBeNull()
    expect(source('src/services/mock/ownWorkspace.js')).toContain("from '../../mock-data/index.js'")
    expect(source('src/services/mock/ownWorkspace.js')).toContain('readPersistedSession()')
  })

  it('mustChangePassword is NOT an identity criterion', async () => {
    const { instituteId, session } = await signInIssuedStudent()
    expect(session.mustChangePassword).toBe(true)
    expect(accountWorkspace(instituteId, 'student').kind).toBe('issued')
    expect(requireStudentWorkspace(instituteId).kind).toBe('issued')
  })

  it('no production test-ID allowlist, fixture namespace or preview token exists', () => {
    const files = [
      'src/services/mock/ownWorkspace.js', 'src/services/mock/learning.js',
      'src/services/mock/live.js', 'src/services/mock/courses.js',
      'src/services/mock/examFlow.js', 'src/services/mock/analysis.js',
      'src/services/mock/students.js', 'src/services/mock/faculty.js',
    ]
    for (const file of files) {
      const text = codeOnly(file)
      expect(text).not.toContain('fixture:')
      expect(text).not.toContain('DEMO_PREVIEW')
      expect(text).not.toContain('isMockMode')
      expect(text).not.toContain('stu-test')
      expect(text).not.toContain('stu-imp-')
    }
    /* No production demo-preview consumer: the design-preview page imports no
       student/faculty service at all. */
    const preview = source('src/features/design-preview/pages/DesignPreviewPage.jsx')
    expect(preview).not.toContain('@/services')
    expect(preview).not.toContain('services/mock')
    expect(preview).not.toContain('services.learning')
    expect(preview).not.toContain('services.students')
  })
})

/* ── 2. The 13-case decision table (R1–R8 / S1–S4) ───────────────────────── */

describe('B3.2 — identity/session decision table', () => {
  it('R1: blank, non-string and whitespace identifiers are invalid', async () => {
    await signInDemoStudent()
    for (const value of ['', '   ', undefined, null, 17, {}]) {
      expect(accountWorkspace(value, 'student').kind).toBe('invalid')
    }
  })

  it('R2: a canonical record of the wrong role is invalid', async () => {
    const { instituteId, session } = await signInIssuedFaculty()
    expect(session.user.role).toBe('faculty')
    expect(accountWorkspace(instituteId, 'student').kind).toBe('invalid')
    expect(() => requireStudentWorkspace(instituteId)).toThrow(/could not find/i)
  })

  it('R3: issued record + valid matching issued session resolves issued', async () => {
    const { instituteId, session } = await signInIssuedStudent()
    expect(session.user.id).toBe(instituteId)
    expect(accountWorkspace(instituteId, 'student').kind).toBe('issued')
    expect(studentWorkspace(instituteId).record.source).toBe('institute_issued')
    expect(sessionWorkspace('student').kind).toBe('issued')
  })

  it('R4: ANY issued/session mismatch resolves invalid and fails closed', async () => {
    const first = await signInIssuedStudent()
    const firstId = first.instituteId
    /* Issued A requested while issued B is signed in. */
    const second = await signInIssuedStudent()
    expect(accountWorkspace(firstId, 'student').kind).toBe('invalid')
    expect(() => requireStudentWorkspace(firstId)).toThrow(/could not find/i)
    expect(second.instituteId).not.toBe(firstId)
    /* A demo identity requested under an issued session is invalid too. */
    expect(accountWorkspace(DEMO_SEATS.student.id, 'student').kind).toBe('invalid')
  })

  it('R5: a forged Institute ID with no issued record is invalid', async () => {
    await signInIssuedStudent()
    expect(accountWorkspace(FORGED, 'student').kind).toBe('invalid')
    expect(() => requireStudentWorkspace(FORGED)).toThrow(/could not find/i)
  })

  it('R6: a recognized demo id + exact matching demo session resolves demo', async () => {
    const session = await signInDemoStudent()
    expect(session.user.id).toBe('stu-ananya')
    expect(accountWorkspace('stu-ananya', 'student').kind).toBe('demo')
    expect(sessionWorkspace('student').kind).toBe('demo')
    const faculty = await signInDemoFaculty()
    expect(faculty.user.id).toBe('fac-snehasish')
    expect(accountWorkspace('fac-snehasish', 'faculty').kind).toBe('demo')
    expect(sessionWorkspace('faculty').kind).toBe('demo')
  })

  it('R7: a demo id under a missing / foreign / wrong-role session is invalid', async () => {
    signOut()
    expect(accountWorkspace('stu-ananya', 'student').kind).toBe('invalid')
    await signInIssuedStudent()
    expect(accountWorkspace('stu-ananya', 'student').kind).toBe('invalid')
    await signInAdmin()
    expect(accountWorkspace('stu-ananya', 'student').kind).toBe('invalid')
    expect(accountWorkspace('fac-snehasish', 'faculty').kind).toBe('invalid')
  })

  it('R8: every other identifier — arbitrary unknown, legacy test id, email alias of a demo seat — is invalid', async () => {
    await signInDemoStudent()
    for (const value of [UNKNOWN, 'stu-test', 'stu-imp-0001', 'ananya.sahoo@vidyutacademy.in', 'fac-pooja']) {
      expect(accountWorkspace(value, 'student').kind).toBe('invalid')
    }
  })

  it('S1–S4: sessionWorkspace derives identity ONLY from a valid matching session', async () => {
    /* S1 — null session */
    signOut()
    expect(sessionWorkspace('student').kind).toBe('invalid')
    expect(() => requireSessionWorkspace('student')).toThrow(/could not find/i)
    /* S2 — wrong role */
    await signInAdmin()
    expect(sessionWorkspace('student').kind).toBe('invalid')
    /* S3 — valid matching session delegates through accountWorkspace */
    await signInDemoStudent()
    expect(sessionWorkspace('student').kind).toBe('demo')
    expect(sessionWorkspace('faculty').kind).toBe('invalid')
    /* S4 — expired / malformed session */
    const session = useSessionStore.getState().session
    expirePersistedSession(session)
    expect(sessionWorkspace('student').kind).toBe('invalid')
    malformedPersistedSession()
    expect(sessionWorkspace('student').kind).toBe('invalid')
  })

  it('the full 13-case matrix resolves exactly as ruled', async () => {
    const issued = await signInIssuedStudent()
    const A = issued.instituteId
    /* A foreign issued account created under a real Admin session. */
    await signInAdmin()
    const createdB = await adminService.createUser('adm-pratibha', {
      role: 'student', name: 'Foreign Student', email: `b32.foreign.${Date.now()}@vidyutacademy.in`, batchId: 'bat-prayas-m',
    })
    const B = createdB.account.instituteId
    const B_SECRET = createdB.credentials[0].temporaryPassword

    /** @type {Array<[string, string, string]>} */
    const cases = [
      ['valid demo student + own id', 'demo-student', 'stu-ananya', 'demo'],
      ['valid issued student + own id', 'issued-A', A, 'issued'],
      ['missing session + demo id', 'none', 'stu-ananya', 'invalid'],
      ['expired session + demo id', 'expired', 'stu-ananya', 'invalid'],
      ['malformed session + demo id', 'malformed', 'stu-ananya', 'invalid'],
      ['wrong-role Admin session + demo id', 'admin', 'stu-ananya', 'invalid'],
      ['arbitrary unknown id + valid issued session', 'issued-A', UNKNOWN, 'invalid'],
      ['forged Institute ID + valid issued session', 'issued-A', FORGED, 'invalid'],
      ['issued A requested under issued B', 'issued-B', A, 'invalid'],
      ['no demo-preview context (no session) + issued id', 'none', A, 'invalid'],
      ['issued id with no session', 'none', B, 'invalid'],
      ['issued id under Admin session', 'admin', A, 'invalid'],
      ['demo id under issued session', 'issued-A', 'stu-ananya', 'invalid'],
      ['demo id under Admin session', 'admin', 'stu-ananya', 'invalid'],
    ]
    const demoSession = await signInDemoStudent()
    const issuedA = await authService.login({ email: A, password: issued.temporaryPassword })
    useSessionStore.getState().setSession(issuedA)
    const issuedB = await authService.login({ email: B, password: B_SECRET })

    for (const [label, context, id, expected] of cases) {
      if (context === 'demo-student') useSessionStore.getState().setSession(demoSession)
      else if (context === 'issued-A') useSessionStore.getState().setSession(issuedA)
      else if (context === 'issued-B') {
        expect(issuedB).toBeTruthy()
        useSessionStore.getState().setSession(issuedB)
      } else if (context === 'admin') await signInAdmin()
      else if (context === 'none') signOut()
      else if (context === 'expired') {
        useSessionStore.getState().setSession(demoSession)
        expirePersistedSession(demoSession)
      } else if (context === 'malformed') {
        useSessionStore.getState().setSession(demoSession)
        malformedPersistedSession()
      }
      expect(accountWorkspace(id, 'student').kind, label).toBe(expected)
    }
  })

  it('Safeguard 1: canonical ownership is enforced for EVERY accepted identifier/alias form', async () => {
    const { instituteId, session, email } = await signInIssuedStudent()
    const forms = [instituteId, instituteId.toLowerCase(), email, email.toUpperCase()]
    for (const form of forms) {
      expect(accountWorkspace(form, 'student').kind, form).toBe('issued')
      expect(requireStudentWorkspace(form).record.key, form).toBe(loadAccountsDb().accounts[instituteId].key)
    }
    /* A foreign issued session owns NONE of those aliases. */
    await signInAdmin()
    const createdForeign = await adminService.createUser('adm-pratibha', {
      role: 'student', name: 'Alias Foreign', email: `b32.alias.${Date.now()}@vidyutacademy.in`, batchId: 'bat-prayas-m',
    })
    const foreignSession = await authService.login({
      email: createdForeign.account.instituteId,
      password: createdForeign.credentials[0].temporaryPassword,
    })
    /* A foreign issued session must not authorize ANY alias form of A. */
    useSessionStore.getState().setSession(foreignSession)
    for (const form of forms) expect(accountWorkspace(form, 'student').kind, form).toBe('invalid')
    /* No session at all. */
    signOut()
    for (const form of forms) expect(accountWorkspace(form, 'student').kind, form).toBe('invalid')
    expect(session.user.id).toBe(instituteId)
  })

  it('every throwing getter throws not_found for invalid and never silently returns a fixture flag', async () => {
    signOut()
    expect(() => requireStudentWorkspace(UNKNOWN)).toThrow(/could not find/i)
    expect(() => requireFacultyWorkspace(UNKNOWN)).toThrow(/could not find/i)
    expect(() => requireSessionWorkspace('student')).toThrow(/could not find/i)
    expect(() => demoStudentWorkspace(UNKNOWN)).toThrow(/could not find/i)
    expect(() => demoFacultyWorkspace(UNKNOWN)).toThrow(/could not find/i)
    expect(() => demoSessionWorkspace('student')).toThrow(/could not find/i)
    await signInDemoStudent()
    expect(demoStudentWorkspace('stu-ananya')).toBe(true)
    expect(demoSessionWorkspace('student')).toBe(true)
    expect(() => demoFacultyWorkspace('fac-snehasish')).toThrow(/could not find/i)
    await signInIssuedStudent()
    expect(demoStudentWorkspace(useSessionStore.getState().session.user.id)).toBe(false)
    expect(demoSessionWorkspace('student')).toBe(false)
  })
})

/* ── 3. F-01 / F-02 direct-service failure matrices ──────────────────────── */

describe('B3.2 F-01/F-02 — zero demo rows and zero writes for invalid identities', () => {
  /** Readers with NO id parameter derive identity from the session alone. */
  const parameterlessReads = () => [
    ['course.listCourses', () => courseService.listCourses()],
    ['question.listSamples', () => questionService.listSamples()],
    ['live.listUpcoming()', () => liveService.listUpcoming()],
    ['live.listRecordings()', () => liveService.listRecordings()],
  ]

  /** Every student/faculty fixture-serving reader, addressed by a caller id. */
  const serviceReads = (id) => [
    ['learning.listLiveSessions', () => learningService.listLiveSessions(id)],
    ['learning.listRecordings', () => learningService.listRecordings(id)],
    ['learning.listDoubts', () => learningService.listDoubts(id)],
    ['learning.listStudyRooms', () => learningService.listStudyRooms(id)],
    ['learning.getAttendance', () => learningService.getAttendance(id)],
    ['live.listUpcoming', () => liveService.listUpcoming(id)],
    ['live.listRecordings', () => liveService.listRecordings(id)],
    ['student.getById', () => studentService.getById(id)],
    ['student.getProfile', () => studentService.getProfile(id)],
    ['student.listNotifications', () => studentService.listNotifications(id)],
    ['assessment.listExams', () => assessmentService.listExams(id)],
    ['assessment.listAttempts', () => assessmentService.listAttempts(id)],
    ['assessment.getPerformance', () => assessmentService.getPerformance(id)],
    ['assessment.getLatestReport', () => assessmentService.getLatestReport(id)],
    ['dashboard.getStudentHome', () => dashboardService.getStudentHome(id)],
    ['analysis.getAnalysis', () => analysisService.getAnalysis(exams[0].id, id)],
    ['analysis.getRevision', () => analysisService.getRevision(id, 'topic-1')],
    ['examFlow.getPaper', () => examFlowService.getPaper(exams[0].id, id)],
    ['faculty.getDashboard', () => facultyService.getDashboard(id)],
    ['faculty.listClasses', () => facultyService.listClasses(id)],
  ]

  it('F-01: a valid issued session cannot read demo records through an arbitrary unknown id', async () => {
    const { instituteId } = await signInIssuedStudent()
    expect(instituteId).toMatch(/^VYU-S-/)
    for (const [label, call] of serviceReads(UNKNOWN)) {
      const error = await failureOf(call)
      expect(error?.code, label).toBe('not_found')
    }
    for (const [label, call] of serviceReads(FORGED)) {
      const error = await failureOf(call)
      expect(error?.code, label).toBe('not_found')
    }
    /* Parameterless readers derive identity from the valid issued session and
       must return ZERO demo rows (an honest empty workspace), never fixtures. */
    for (const [label, call] of parameterlessReads()) {
      expect(await call(), label).toEqual([])
    }
  })

  it('F-02: missing, expired, malformed and wrong-role sessions all fail closed', async () => {
    const demoSession = await signInDemoStudent()
    const contexts = [
      ['missing session', () => signOut()],
      ['expired session', () => expirePersistedSession(demoSession)],
      ['malformed session', () => malformedPersistedSession()],
      ['wrong-role Admin session', () => signInAdmin()],
    ]
    for (const [label, setup] of contexts) {
      useSessionStore.getState().setSession(demoSession)
      await setup()
      expect(sessionWorkspace('student').kind, label).toBe('invalid')
      for (const [name, call] of [...serviceReads('stu-ananya'), ...parameterlessReads()]) {
        const error = await failureOf(call)
        expect(error?.code, `${label} / ${name}`).toBe('not_found')
      }
    }
  })

  it('no demo rows are returned and no demo writes occur for any invalid identity', async () => {
    signOut()
    const before = JSON.stringify({ ...localStorage })
    for (const [label, call] of serviceReads(UNKNOWN)) {
      const error = await failureOf(call)
      expect(error?.code, label).toBe('not_found')
    }
    /* Realtime subscriptions are synchronous and must also throw. */
    expect(() => learningService.subscribe(liveSessions[0].id, UNKNOWN, () => {})).toThrow(/could not find/i)
    expect(() => learningService.subscribeRoom(studyRooms[0].id, UNKNOWN, () => {})).toThrow(/could not find/i)
    /* examFlow.syncAttempt must NOT write on an invalid identity. */
    const syncError = await failureOf(() => examFlowService.syncAttempt({ attemptId: 'att-b32', revision: 1, entries: [] }))
    expect(syncError?.code).toBe('not_found')
    expect(localStorage.getItem(SYNC_KEY)).toBeNull()
    /* No preference, notification or learning write was created. */
    expect(JSON.stringify({ ...localStorage })).toBe(before)
  })

  it('a valid matching demo session keeps the EXACT seeded counts (no fixture weakening)', async () => {
    const session = await signInDemoStudent()
    expect(session.user.id).toBe('stu-ananya')
    expect([liveSessions, recordings, doubtFixtures, studyRooms, attendanceHistory, courses, questionSamples].map((list) => list.length))
      .toEqual([6, 3, 3, 3, 8, 5, 2])
    expect(await learningService.listLiveSessions('stu-ananya')).toHaveLength(6)
    expect(await learningService.listRecordings('stu-ananya')).toHaveLength(3)
    expect(await learningService.listDoubts('stu-ananya')).toHaveLength(3)
    expect(await learningService.listStudyRooms('stu-ananya')).toHaveLength(3)
    expect((await learningService.getAttendance('stu-ananya')).sessions).toHaveLength(8)
    expect(await courseService.listCourses()).toHaveLength(5)
    expect(await questionService.listSamples()).toHaveLength(2)
    expect(await liveService.listUpcoming()).toHaveLength(6)
    expect(await liveService.listRecordings()).toHaveLength(3)
    expect((await assessmentService.listExams('stu-ananya')).length).toBeGreaterThan(0)
  })

  it('a valid matching issued session has honest EMPTY workspaces', async () => {
    const { instituteId } = await signInIssuedStudent()
    expect(await learningService.listLiveSessions(instituteId)).toEqual([])
    expect(await learningService.listRecordings(instituteId)).toEqual([])
    expect(await learningService.listDoubts(instituteId)).toEqual([])
    expect(await learningService.listStudyRooms(instituteId)).toEqual([])
    expect((await learningService.getAttendance(instituteId)).sessions).toEqual([])
    expect(await courseService.listCourses()).toEqual([])
    expect(await questionService.listSamples()).toEqual([])
    expect(await liveService.listUpcoming()).toEqual([])
    expect(await liveService.listRecordings()).toEqual([])
    expect(await assessmentService.listExams(instituteId)).toEqual([])
    expect(await assessmentService.listAttempts(instituteId)).toEqual([])
    expect(await assessmentService.getLatestReport(instituteId)).toBeNull()
  })

  it('all seven consumers use the ONE fail-closed boundary and a throwing getter', () => {
    const consumers = {
      'src/services/mock/learning.js': 'demoStudentWorkspace',
      'src/services/mock/live.js': 'demoSessionWorkspace',
      'src/services/mock/courses.js': 'demoSessionWorkspace',
      'src/services/mock/examFlow.js': 'requireSessionWorkspace',
      'src/services/mock/analysis.js': 'requireStudentWorkspace',
      'src/services/mock/students.js': 'requireStudentWorkspace',
      'src/services/mock/faculty.js': 'requireFacultyWorkspace',
    }
    for (const [file, getter] of Object.entries(consumers)) {
      const text = source(file)
      expect(text, file).toContain("from './ownWorkspace.js'")
      expect(text, file).toContain(getter)
      /* No fixture branch is guarded by an issued-only check on a non-throwing
         resolver: fixture access is mediated by a throwing getter instead. */
      expect(text, file).not.toMatch(/import \{[^}]*sessionWorkspace[^}]*\} from '\.\/ownWorkspace\.js'/)
    }
    const boundary = codeOnly('src/services/mock/ownWorkspace.js')
    expect(boundary).not.toContain('isMockMode')
    expect(boundary).not.toContain('DEMO_PREVIEW')
    expect(boundary).not.toContain('fixture:')
    expect(boundary).toContain('export const DEMO_IDENTITIES = Object.freeze(')
    /* `readPersistedSession()` is untouched and remains the only session read. */
    expect(source('src/shared/lib/sessionPersistence.js')).toContain('export function readPersistedSession(')
  })
})
