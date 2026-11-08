import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService, provisionInstituteAccount } from '@/services/mock/auth.js'
import { configureInstituteIds, transitionAccountStatus, loadAccountsDb, listAccounts } from '@/mock-data/accounts.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { readPersistedSession, SESSION_STORAGE_KEY } from '@/shared/lib/sessionPersistence.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

const NEW_PASSWORD = 'FocusedMind2026!'
const FACULTY = { role: 'faculty', name: 'Institute Faculty', email: 'institute.faculty@example.com' }

beforeEach(() => {
  localStorage.clear()
  useSessionStore.getState().clear()
})

/** @returns {Promise<{ instituteId: string, temporaryPassword: string }>} */
async function issueFaculty() {
  const { credentials } = await provisionInstituteAccount(FACULTY)
  return credentials
}

describe('Batch 2 institute authentication', () => {
  it('provisions an account and signs in with its Institute ID, carrying the first-login flag', async () => {
    const { instituteId, temporaryPassword } = await issueFaculty()
    expect(instituteId).toBe('VYU-F-0043')
    expect(temporaryPassword).toHaveLength(12)
    const session = await authService.loginByInstituteId({ instituteId, password: temporaryPassword })
    expect(session.user.role).toBe('faculty')
    expect(session.user.instituteId).toBe(instituteId)
    expect(session.instituteId).toBe(instituteId)
    expect(session.mustChangePassword).toBe(true)
    expect(session.user.mustChangePassword).toBe(true)
    expect(JSON.stringify(session)).not.toContain(temporaryPassword)
    /* The single `login` resolver accepts the same identifier. */
    expect((await authService.login({ email: instituteId, password: temporaryPassword })).user.instituteId).toBe(instituteId)
  })

  it('uses one generic error for unknown IDs and wrong passwords (no account enumeration)', async () => {
    const { instituteId } = await issueFaculty()
    const wrong = await authService.login({ email: instituteId, password: 'wrong-password' }).catch((error) => error)
    const unknown = await authService.login({ email: 'VYU-F-9999', password: 'wrong-password' }).catch((error) => error)
    expect(wrong.code).toBe('invalid_credentials')
    expect(unknown.code).toBe('invalid_credentials')
    expect(wrong.message).toBe(unknown.message)
    expect(JSON.stringify(wrong)).not.toContain('does not exist')
  })

  it('rejects suspended, archived and locked accounts with distinct notices', async () => {
    for (const [status, code] of [['suspended', 'account_suspended'], ['archived', 'account_archived'], ['locked', 'account_locked']]) {
      const { instituteId, temporaryPassword } = await issueFaculty()
      expect(transitionAccountStatus(instituteId, status).ok).toBe(true)
      const error = await authService.login({ email: instituteId, password: temporaryPassword }).catch((value) => value)
      expect(error.code).toBe(code)
      /* A wrong password for a suspended account stays generic. */
      const generic = await authService.login({ email: instituteId, password: 'wrong-password' }).catch((value) => value)
      expect(generic.code).toBe('invalid_credentials')
    }
  })

  it('revalidates account status during session restoration', async () => {
    const { instituteId, temporaryPassword } = await issueFaculty()
    const session = await authService.login({ email: instituteId, password: temporaryPassword })
    useSessionStore.getState().setSession(session)
    expect(readPersistedSession()?.mustChangePassword).toBe(true)
    expect(transitionAccountStatus(instituteId, 'suspended').ok).toBe(true)
    expect(readPersistedSession()).toBeNull()
    await expect(authService.getSession()).resolves.toBeNull()
  })

  it('refuses Admin-created Admin accounts in Batch 2 while keeping the admin ID shape available', async () => {
    const error = await provisionInstituteAccount({ role: 'admin', name: 'Office Admin', email: 'office.admin@example.com' }).catch((value) => value)
    expect(error.code).toBe('admin_provisioning_not_available')
    expect(loadAccountsDb().issuedInstituteIds).toEqual([])
  })

  it('requires an institute-supplied year token before any student identity is issued', async () => {
    const error = await provisionInstituteAccount({ role: 'student', name: 'Institute Student', email: 'institute.student@example.com' }).catch((value) => value)
    expect(error.code).toBe('institute_year_not_configured')
    expect(loadAccountsDb().issuedInstituteIds).toEqual([])
    /* Test-only configuration value; NOT institute policy, never derived from Date. */
    configureInstituteIds({ year: '99' })
    const { credentials, account } = await provisionInstituteAccount({ role: 'student', name: 'Institute Student', email: 'institute.student@example.com' })
    expect(credentials.instituteId).toBe('VYU-S-99-0232')
    expect(account.instituteId).toBe(credentials.instituteId)
    expect(account.mustChangePassword).toBe(true)
  })

  it('rejects the temporary password as the replacement and invalidates it after setup', async () => {
    const { instituteId, temporaryPassword } = await issueFaculty()
    const gated = await authService.login({ email: instituteId, password: temporaryPassword })
    useSessionStore.getState().setSession(gated)

    const reuse = await authService.changePasswordWithSetup({ newPassword: temporaryPassword, confirmPassword: temporaryPassword }).catch((error) => error)
    expect(reuse.code).toBe('password_reuse_rejected')

    const mismatch = await authService.changePasswordWithSetup({ newPassword: NEW_PASSWORD, confirmPassword: 'Different2026!' }).catch((error) => error)
    expect(mismatch.name).toBe('ZodError')

    const refreshed = await authService.changePasswordWithSetup({ newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD })
    expect(refreshed.mustChangePassword).toBe(false)
    expect(refreshed.user.mustChangePassword).toBe(false)
    useSessionStore.getState().setSession(refreshed)
    expect(readPersistedSession()?.mustChangePassword).toBe(false)

    const oldCredential = await authService.login({ email: instituteId, password: temporaryPassword }).catch((error) => error)
    expect(oldCredential.code).toBe('invalid_credentials')
    const newSession = await authService.login({ email: instituteId, password: NEW_PASSWORD })
    expect(newSession.mustChangePassword).toBe(false)
    expect(newSession.user.mustChangePassword).toBe(false)
    const repeat = await authService.changePasswordWithSetup({ newPassword: 'AnotherFocused2026!', confirmPassword: 'AnotherFocused2026!' }).catch((error) => error)
    expect(repeat.code).toBe('setup_not_required')
  })

  it('exposes no plaintext password or hash through sessions, lists, logs or status responses', async () => {
    const logs = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warns = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { instituteId, temporaryPassword } = await issueFaculty()
    const session = await authService.login({ email: instituteId, password: temporaryPassword })
    useSessionStore.getState().setSession(session)
    const status = await authService.getAccountStatus()
    const rows = listAccounts()
    const stores = [localStorage.getItem('vyuh.mock.auth.v1'), localStorage.getItem('vyuh.mock.accounts.v1'), localStorage.getItem(SESSION_STORAGE_KEY)]
    const logged = [...logs.mock.calls, ...warns.mock.calls, ...errors.mock.calls].map((call) => JSON.stringify(call)).join(' ')
    expect(JSON.stringify(session)).not.toContain(temporaryPassword)
    expect(JSON.stringify(status)).not.toMatch(/passwordHash|salt|temporaryPassword"/)
    expect(JSON.stringify(rows)).not.toContain(temporaryPassword)
    for (const store of stores) {
      expect(store ?? '').not.toContain(temporaryPassword)
      expect(store ?? '').not.toContain(NEW_PASSWORD)
    }
    expect(logged).not.toContain(temporaryPassword)
    logs.mockRestore(); warns.mockRestore(); errors.mockRestore()
  })

  it('keeps the three seeded demo email seats working with their existing credentials', async () => {
    for (const [email, role] of [
      ['ananya.sahoo@vidyutacademy.in', 'student'],
      ['snehasish@vidyutacademy.in', 'faculty'],
      ['academic.office@vidyutacademy.in', 'admin'],
    ]) {
      const session = await authService.login({ email, password: 'vyuh2026' })
      expect(session.user.role).toBe(role)
      expect(session.mustChangePassword).toBe(false)
      expect(session.user.mustChangePassword).toBe(false)
    }
  })

  it('excludes Institute-ID accounts from the demo self-service reset workflow', async () => {
    await issueFaculty()
    const demo = await authService.requestReset({ email: 'ananya.sahoo@vidyutacademy.in' })
    expect(demo.demoResetPath).toBeTruthy()
    const institute = await authService.requestReset({ email: FACULTY.email })
    expect(institute.demoResetPath).toBeUndefined()
    expect(institute.message).toBe(demo.message)
    const stored = JSON.parse(localStorage.getItem('vyuh.mock.auth.v1'))
    expect(Object.values(stored.resets).some((entry) => entry.email === FACULTY.email)).toBe(false)
  })
})
