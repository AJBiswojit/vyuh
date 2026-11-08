import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import axe from 'axe-core'
import { renderRoute, screen, waitFor } from './helpers.jsx'
import { authService, provisionInstituteAccount } from '@/services/mock/auth.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { readPersistedSession, SESSION_STORAGE_KEY } from '@/shared/lib/sessionPersistence.js'
import { loadAccountsDb } from '@/mock-data/accounts.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

const NEW_PASSWORD = 'FocusedMind2026!'
const source = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')

beforeEach(() => {
  localStorage.clear()
  useSessionStore.getState().clear()
})

/** Provision a real Institute-ID account and return its gated session + credentials. */
async function gatedFaculty() {
  const { credentials } = await provisionInstituteAccount({ role: 'faculty', name: 'Setup Faculty', email: 'setup.faculty@example.com' })
  const session = await authService.login({ email: credentials.instituteId, password: credentials.temporaryPassword })
  return { session, ...credentials }
}

describe('Batch 2 first-login setup', () => {
  it('forces an issued account to /setup-account from every protected URL', async () => {
    const { session } = await gatedFaculty()
    const first = await renderRoute('/faculty', { session })
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/setup-account'))
    expect(await screen.findByRole('heading', { name: 'Choose your own password.', level: 1 })).toBeTruthy()
    first.unmount()
    await renderRoute('/faculty/account', { session })
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/setup-account'))
  })

  it('preserves the first-login requirement across a refresh (no bypass by direct URL)', async () => {
    const { session } = await gatedFaculty()
    useSessionStore.getState().setSession(session)
    const restored = readPersistedSession()
    expect(restored?.mustChangePassword).toBe(true)
    expect(restored?.user?.mustChangePassword).toBe(true)
    await renderRoute('/faculty', { session: restored })
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/setup-account'))
    expect(JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)).state.session.mustChangePassword).toBe(true)
  })

  it('shows the issued Institute ID, validates, rejects the temporary password, then reaches the role dashboard', async () => {
    const { session, instituteId, temporaryPassword } = await gatedFaculty()
    const { user } = await renderRoute('/setup-account', { session })
    expect(await screen.findByRole('heading', { name: 'Choose your own password.', level: 1 })).toBeTruthy()
    expect(screen.getByLabelText('Institute ID').value).toBe(instituteId)

    /* Inline Zod validation: the confirmation field must match. */
    await user.type(screen.getByLabelText('New password'), NEW_PASSWORD)
    await user.type(screen.getByLabelText('Confirm new password'), 'Different2026!')
    await user.click(screen.getByRole('button', { name: 'Save password & continue' }))
    expect(await screen.findByText('The passwords do not match.')).toBeTruthy()

    /* Service-level rule: the current temporary password is not a valid replacement. */
    let newField = screen.getByLabelText('New password')
    let confirmField = screen.getByLabelText('Confirm new password')
    await user.clear(newField); await user.type(newField, temporaryPassword)
    await user.clear(confirmField); await user.type(confirmField, temporaryPassword)
    await user.click(screen.getByRole('button', { name: 'Save password & continue' }))
    expect(await screen.findByText(/different from your temporary password/)).toBeTruthy()

    newField = screen.getByLabelText('New password')
    confirmField = screen.getByLabelText('Confirm new password')
    await user.clear(newField); await user.type(newField, NEW_PASSWORD)
    await user.clear(confirmField); await user.type(confirmField, NEW_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Save password & continue' }))
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/faculty'))
    expect(useSessionStore.getState().mustChangePassword).toBe(false)
    /* Sensitive component state is cleared and no plaintext reaches storage. */
    expect(screen.queryByLabelText('New password')?.value ?? '').toBe('')
    for (const key of ['vyuh.mock.auth.v1', 'vyuh.mock.accounts.v1', SESSION_STORAGE_KEY]) {
      expect(localStorage.getItem(key) ?? '').not.toContain(temporaryPassword)
      expect(localStorage.getItem(key) ?? '').not.toContain(NEW_PASSWORD)
    }
  })

  it('keeps demo seats out of the setup flow and on their own dashboards', async () => {
    const session = await authService.login({ email: 'academic.office@vidyutacademy.in', password: 'vyuh2026' })
    expect(session.mustChangePassword).toBe(false)
    const first = await renderRoute('/admin', { session })
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/admin'))
    expect(await screen.findByRole('navigation', { name: 'Academic office' })).toBeTruthy()
    first.unmount()
    await renderRoute('/setup-account', { session })
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/admin'))
  })

  it('never places a plaintext credential in storage, logs, audit entries or the session', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { session, temporaryPassword } = await gatedFaculty()
    const { user } = await renderRoute('/setup-account', { session })
    await user.type(screen.getByLabelText('New password'), NEW_PASSWORD)
    await user.type(screen.getByLabelText('Confirm new password'), NEW_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Save password & continue' }))
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/faculty'))
    const logged = [...log.mock.calls, ...warn.mock.calls, ...error.mock.calls].map((call) => JSON.stringify(call)).join(' ')
    const stores = ['vyuh.mock.auth.v1', 'vyuh.mock.accounts.v1', SESSION_STORAGE_KEY].map((key) => localStorage.getItem(key) ?? '').join(' ')
    for (const value of [temporaryPassword, NEW_PASSWORD]) {
      expect(stores).not.toContain(value)
      expect(logged).not.toContain(value)
      expect(JSON.stringify(useSessionStore.getState().session)).not.toContain(value)
      expect(JSON.stringify(loadAccountsDb().audit)).not.toContain(value)
    }
    expect(JSON.stringify(loadAccountsDb().audit)).not.toMatch(/temporaryPassword|passwordHash/)
    log.mockRestore(); warn.mockRestore(); error.mockRestore()
  })

  it('keeps G5 consent explicitly deferred: no checkbox, no invented policy text or version', async () => {
    const { session } = await gatedFaculty()
    await renderRoute('/setup-account', { session })
    expect(await screen.findByRole('heading', { name: 'Choose your own password.', level: 1 })).toBeTruthy()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByText(/I accept the Terms/)).toBeNull()
    expect(screen.queryByText(/I agree to the attendance data policy/)).toBeNull()
    const page = source('src/features/auth/pages/SetupAccountPage.jsx')
    expect(page).not.toMatch(/ConsentFields|termsConsent|attendanceConsent/)
    expect(page).not.toMatch(/ATT-\d|policyVersion\s*[:=]\s*['"]|currentPolicyVersion/)
    expect(page).toMatch(/has not supplied approved wording or a version identifier/)
    expect(page).toMatch(/not a password KDF/)
    /* Loading / error / success branches are wired, not just copy. */
    expect(page).toMatch(/aria-busy=\{isPending\}/)
    expect(page).toMatch(/loading=\{isPending\}/)
    expect(page).toMatch(/<AuthErrorNotice error=\{error\}/)
    expect(page).toMatch(/done \? <AuthNotice/)
    /* Sensitive form state AND in-memory mutation variables are cleared. */
    expect(page).toMatch(/\breset\(\)/)
    expect(page).toMatch(/form\.setValue\('newPassword', ''\)/)
  })

  it('login and setup-account pass automated WCAG A/AA checks', async () => {
    const { session } = await gatedFaculty()
    const first = await renderRoute('/login')
    expect(await screen.findByRole('heading', { name: 'Welcome back.', level: 1 })).toBeTruthy()
    let results = await axe.run(document.body, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })
    expect(results.violations.map((violation) => violation.id)).toEqual([])
    first.unmount()
    await renderRoute('/setup-account', { session })
    expect(await screen.findByRole('heading', { name: 'Choose your own password.', level: 1 })).toBeTruthy()
    results = await axe.run(document.body, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })
    expect(results.violations.map((violation) => violation.id)).toEqual([])
  })
})
