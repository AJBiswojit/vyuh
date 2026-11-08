import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readPersistedSession, SESSION_LIFETIME_MS, SESSION_STORAGE_KEY } from '@/shared/lib/sessionPersistence.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})
let auth
const signup = { name: 'Test Student', email: 'test.student@example.com', instituteCode: 'VYUH2026', batchId: 'bat-prayas-m', password: 'FocusedMind2026!', termsConsent: true, attendanceConsent: true }
beforeEach(async () => {
  vi.useRealTimers()
  localStorage.clear()
  vi.resetModules()
  auth = (await import('@/services/mock/auth.js')).authService
})

describe('mock AuthService', () => {
  it.each([
    ['ananya.sahoo@vidyutacademy.in', 'student'],
    ['snehasish@vidyutacademy.in', 'faculty'],
    ['academic.office@vidyutacademy.in', 'admin'],
  ])('signs in %s as %s with an absolute eight-hour expiry', async (email, role) => {
    const now = Date.now()
    const session = await auth.login({ email, password: 'vyuh2026' })
    expect(session.user.role).toBe(role)
    expect(session.expiresAt - session.issuedAt).toBe(SESSION_LIFETIME_MS)
    expect(session.expiresAt).toBeGreaterThanOrEqual(now + SESSION_LIFETIME_MS)
    expect(JSON.stringify(session)).not.toContain('vyuh2026')
  })

  it('locks on the fifth failure, persists it, and rejects even the correct password', async () => {
    const email = 'ananya.sahoo@vidyutacademy.in'
    for (let attempt = 1; attempt <= 4; attempt++) await expect(auth.login({ email, password: 'wrong' })).rejects.toMatchObject({ code: 'invalid_credentials', remainingAttempts: 5 - attempt })
    await expect(auth.login({ email, password: 'wrong' })).rejects.toMatchObject({ code: 'account_locked' })
    await expect(auth.login({ email, password: 'vyuh2026' })).rejects.toMatchObject({ code: 'account_locked' })
    const fresh = (await import('@/services/mock/auth.js')).authService
    await expect(fresh.login({ email, password: 'vyuh2026' })).rejects.toMatchObject({ code: 'account_locked' })
    await fresh.unlockDemo(email)
    expect((await fresh.login({ email, password: 'vyuh2026' })).user.role).toBe('student')
  })

  it('keeps locked and network failures distinct and does not count network failures', async () => {
    await expect(auth.login({ email: 'locked.student@vidyutacademy.in', password: 'vyuh2026' })).rejects.toMatchObject({ code: 'account_locked' })
    await expect(auth.login({ email: 'offline@vidyutacademy.in', password: 'wrong' })).rejects.toMatchObject({ code: 'network_unavailable', status: 0 })
    expect(JSON.parse(localStorage.getItem('vyuh.mock.auth.v1') ?? '{"attempts":{}}').attempts['offline@vidyutacademy.in']).toBeUndefined()
  })

  /* C1 rewrite: consent/institute/batch validation still exists as a pure schema
     (see registration-retirement.test.jsx), but the service no longer provisions
     anyone. C1's no-plaintext assertion is preserved here AND ported into the
     first-login flow in first-login.test.jsx. */
  it('retires signup: schema input still validates, but no account, OTP or plaintext can be stored', async () => {
    await expect(auth.signup({ ...signup, termsConsent: false })).rejects.toThrow()
    await expect(auth.signup({ ...signup, instituteCode: 'WRONG' })).rejects.toMatchObject({ code: 'registration_retired' })
    await expect(auth.signup(signup)).rejects.toMatchObject({ code: 'registration_retired' })
    await expect(auth.login({ email: signup.email, password: signup.password })).rejects.toMatchObject({ code: 'invalid_credentials' })
    const stored = JSON.parse(localStorage.getItem('vyuh.mock.auth.v1') ?? '{}')
    expect(Object.keys(stored.challenges ?? {})).toEqual([])
    expect(stored.accounts?.[signup.email]).toBeUndefined()
    expect(localStorage.getItem('vyuh.mock.auth.v1') ?? '').not.toContain(signup.password)
    expect(localStorage.getItem('vyuh.mock.accounts.v1') ?? '').not.toContain(signup.password)
    expect(localStorage.getItem(SESSION_STORAGE_KEY) ?? '').not.toContain(signup.password)
  })

  /* C1 rewrite: with signup retired there is no OTP challenge to resend. */
  it('a resend cannot recreate a retired signup challenge', async () => {
    await expect(auth.signup(signup)).rejects.toMatchObject({ code: 'registration_retired' })
    await expect(auth.resendOtp('missing-signup-challenge')).rejects.toMatchObject({ code: 'challenge_not_found' })
    await expect(auth.getChallenge('missing-signup-challenge')).rejects.toMatchObject({ code: 'challenge_not_found' })
    const stored = JSON.parse(localStorage.getItem('vyuh.mock.auth.v1') ?? '{}')
    expect(Object.keys(stored.challenges ?? {})).toEqual([])
  })

  /* C1 rewrite: the ten-minute OTP expiry case is retired with documentation
     (no challenge can be created). A stale legacy challenge is still refused. */
  it('no OTP challenge exists to expire, and a stale legacy challenge cannot activate an account', async () => {
    await expect(auth.signup(signup)).rejects.toMatchObject({ code: 'registration_retired' })
    await expect(auth.verifyOtp({ challengeId: 'legacy-signup', code: '000000' })).rejects.toMatchObject({ code: 'challenge_not_found' })
    /* Simulate localStorage written by an older build: verification must still fail. */
    const legacy = {
      accounts: {}, attempts: {}, resets: {}, acceptedInvites: [],
      challenges: { 'legacy-signup': { id: 'legacy-signup', email: signup.email, purpose: 'signup', code: '123456', expiresAt: Date.now() + 600_000, resendAvailableAt: Date.now(), attempts: 0, demoCode: '123456' } },
    }
    localStorage.setItem('vyuh.mock.auth.v1', JSON.stringify(legacy))
    await expect(auth.verifyOtp({ challengeId: 'legacy-signup', code: '123456' })).rejects.toMatchObject({ code: 'registration_retired' })
    expect(JSON.parse(localStorage.getItem('vyuh.mock.auth.v1')).challenges['legacy-signup']).toBeUndefined()
    expect(localStorage.getItem(SESSION_STORAGE_KEY) ?? '').not.toContain(signup.password)
  })

  it('returns a generic reset response, consumes reset tokens, and clears lockout', async () => {
    const known = await auth.requestReset({ email: 'ananya.sahoo@vidyutacademy.in' })
    const unknown = await auth.requestReset({ email: 'nobody@example.com' })
    expect(known.message).toBe(unknown.message)
    expect(unknown.demoResetPath).toBeUndefined()
    const token = new URL(known.demoResetPath, 'http://localhost').searchParams.get('token')
    await auth.resetPassword({ token, password: 'NewFocused2026!' })
    await expect(auth.resetPassword({ token, password: 'AnotherFocused2026!' })).rejects.toMatchObject({ code: 'reset_invalid' })
    expect((await auth.login({ email: 'ananya.sahoo@vidyutacademy.in', password: 'NewFocused2026!' })).user.role).toBe('student')
  })

  /* C1 rewrite: invitations are read-only status records; activation is retired. */
  it('keeps invitation records read-only and refuses account activation', async () => {
    await expect(auth.acceptInvite({ inviteCode: 'VYUH-FACULTY-2026', password: 'FacultyFocus2026!' })).rejects.toMatchObject({ code: 'registration_retired' })
    await expect(auth.getInvite('EXPIRED-INVITE')).resolves.toMatchObject({ status: 'expired' })
    await expect(auth.getInvite('missing')).rejects.toMatchObject({ code: 'invite_not_found' })
    expect(JSON.parse(localStorage.getItem('vyuh.mock.auth.v1') ?? '{}').acceptedInvites ?? []).toEqual([])
    expect(localStorage.getItem('vyuh.mock.auth.v1') ?? '').not.toContain('FacultyFocus2026!')
    expect(useSessionStore.getState().user).toBeNull()
  })
})

describe('persisted session', () => {
  it('restores the original deadline and rejects expired or malformed envelopes', async () => {
    const session = await auth.login({ email: 'ananya.sahoo@vidyutacademy.in', password: 'vyuh2026' })
    useSessionStore.getState().setSession(session)
    expect(readPersistedSession()?.expiresAt).toBe(session.expiresAt)
    vi.setSystemTime(session.expiresAt + 1)
    expect(readPersistedSession()).toBeNull()
    useSessionStore.getState().initialize()
    expect(useSessionStore.getState().user).toBeNull()
    localStorage.setItem(SESSION_STORAGE_KEY, '{bad json')
    expect(readPersistedSession()).toBeNull()
    useSessionStore.getState().setSession({ ...session, issuedAt: Date.now(), expiresAt: Date.now() + SESSION_LIFETIME_MS })
    useSessionStore.getState().clear()
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })
})
