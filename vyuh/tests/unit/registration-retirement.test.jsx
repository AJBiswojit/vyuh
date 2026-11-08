import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute, screen, waitFor } from './helpers.jsx'
import { authService } from '@/services/mock/auth.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { signupSchema } from '@/services/authSchemas.js'
import { V2_ROUTE_MATRIX } from '@/app/routes/v2RouteTable.js'
import { loadAccountsDb } from '@/mock-data/accounts.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

const NOTICE = /Accounts are issued by your academic office/
const SIGNUP = {
  name: 'Prospective Student', email: 'prospective@example.com', password: 'NewStudent2026!',
  confirmPassword: 'NewStudent2026!', instituteCode: 'VYUH2026', batchId: 'b-jee-2026',
  termsConsent: true, attendanceConsent: true,
}

beforeEach(() => {
  localStorage.clear()
  useSessionStore.getState().clear()
})

describe('Batch 2 retirement of public registration', () => {
  it.each([
    ['/signup', 'signup'],
    ['/verify-otp?challenge=demo-signup', 'OTP verification'],
    ['/join/VYUH-FACULTY-2026', 'invitation'],
  ])('%s is redirected to /login with an out-of-band provisioning notice', async (path) => {
    await renderRoute(path)
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/login'))
    expect(await screen.findByText(NOTICE)).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Create your account/i })).toBeNull()
    expect(useSessionStore.getState().status).toBe('anonymous')
    /* Anonymous bootstrap writes an empty session envelope, never an account. */
    expect(JSON.parse(localStorage.getItem('vyuh.session') ?? '{}').state.session).toBeNull()
  })

  it('exposes no public signup CTA on the login page', async () => {
    await renderRoute('/login')
    expect(await screen.findByRole('heading', { name: 'Welcome back.', level: 1 })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Create your account/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /sample faculty invitation/i })).toBeNull()
    expect(screen.getByLabelText('Email address').type).toBe('text')
    expect(screen.getByText(/You can also sign in with the Institute ID/)).toBeTruthy()
  })

  it('retired service entry points create no account, no challenge and no session', async () => {
    const signup = await authService.signup(SIGNUP).catch((error) => error)
    expect(signup.code).toBe('registration_retired')
    const invite = await authService.acceptInvite({ inviteCode: 'VYUH-FACULTY-2026', password: 'Faculty2026!' }).catch((error) => error)
    expect(invite.code).toBe('registration_retired')
    const login = await authService.login({ email: SIGNUP.email, password: SIGNUP.password }).catch((error) => error)
    expect(login.code).toBe('invalid_credentials')
    const authDb = JSON.parse(localStorage.getItem('vyuh.mock.auth.v1') ?? '{}')
    expect(Object.keys(authDb.challenges ?? {})).toEqual([])
    expect(Object.keys(authDb.accounts ?? {})).toEqual([])
    expect(loadAccountsDb().issuedInstituteIds).toEqual([])
    expect(localStorage.getItem('vyuh.session')).toBeNull()
  })

  it('keeps the pure signup schema validation for the retired form without provisioning anyone', () => {
    expect(signupSchema.safeParse({ ...SIGNUP, termsConsent: false }).success).toBe(false)
    expect(signupSchema.safeParse({ ...SIGNUP, attendanceConsent: false }).success).toBe(false)
    expect(signupSchema.safeParse({ ...SIGNUP, instituteCode: '' }).success).toBe(false)
    expect(signupSchema.safeParse({ ...SIGNUP, password: 'short' }).success).toBe(false)
    expect(signupSchema.safeParse(SIGNUP).success).toBe(true)
    expect(Object.keys(loadAccountsDb().accounts)).toHaveLength(4)
  })

  it('keeps invitation records read-only for status displays only', async () => {
    const expired = await authService.getInvite('EXPIRED-INVITE')
    expect(expired.status).toBe('expired')
    const unknown = await authService.getInvite('UNKNOWN').catch((error) => error)
    expect(unknown.code).toBe('invite_not_found')
    expect(loadAccountsDb().audit).toEqual([])
  })

  it('preserves all 33 Batch 1 aliases, the /sign-in legacy redirect and /app compatibility', async () => {
    expect(V2_ROUTE_MATRIX).toHaveLength(33)
    const session = await authService.login({ email: 'ananya.sahoo@vidyutacademy.in', password: 'vyuh2026' })
    const first = await renderRoute('/s/exams', { session })
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/student/exams'))
    first.unmount()
    const second = await renderRoute('/sign-in')
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/login'))
    second.unmount()
    await renderRoute('/app/account', { session })
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/student/account'))
  })
})
