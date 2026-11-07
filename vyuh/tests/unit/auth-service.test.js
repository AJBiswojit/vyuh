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

  it('requires signup consent and a valid institute/batch, then verifies OTP', async () => {
    await expect(auth.signup({ ...signup, termsConsent: false })).rejects.toThrow()
    await expect(auth.signup({ ...signup, instituteCode: 'WRONG' })).rejects.toMatchObject({ code: 'invalid_institute' })
    const challenge = await auth.signup(signup)
    expect(challenge.demoCode).toBe('123456')
    await expect(auth.login({ email: signup.email, password: signup.password })).rejects.toMatchObject({ code: 'email_unverified' })
    await expect(auth.verifyOtp({ challengeId: challenge.id, code: '000000' })).rejects.toMatchObject({ code: 'otp_expired' })
    const session = await auth.verifyOtp({ challengeId: challenge.id, code: '123456' })
    expect(session.user.role).toBe('student')
    expect(session.user.batchId).toBe(signup.batchId)
    expect((await auth.login({ email: signup.email, password: signup.password })).user.email).toBe(signup.email)
    expect(localStorage.getItem('vyuh.mock.auth.v1')).not.toContain(signup.password)
  })

  it('enforces resend cooldown and invalidates the old code', async () => {
    const challenge = await auth.signup(signup)
    await expect(auth.resendOtp(challenge.id)).rejects.toMatchObject({ code: 'resend_too_soon' })
    vi.setSystemTime(Date.now() + 31_000)
    const next = await auth.resendOtp(challenge.id)
    expect(next.id).not.toBe(challenge.id)
    await expect(auth.verifyOtp({ challengeId: challenge.id, code: '123456' })).rejects.toMatchObject({ code: 'challenge_not_found' })
    expect((await auth.verifyOtp({ challengeId: next.id, code: '123456' })).user.email).toBe(signup.email)
  })

  it('expires OTPs after ten minutes without extending them on read', async () => {
    const challenge = await auth.signup(signup)
    vi.setSystemTime(challenge.expiresAt + 1)
    await expect(auth.verifyOtp({ challengeId: challenge.id, code: '123456' })).rejects.toMatchObject({ code: 'otp_expired' })
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

  it('accepts a faculty invitation once and rejects expired/unknown codes', async () => {
    const session = await auth.acceptInvite({ inviteCode: 'VYUH-FACULTY-2026', password: 'FacultyFocus2026!' })
    expect(session.user.role).toBe('faculty')
    await expect(auth.acceptInvite({ inviteCode: 'VYUH-FACULTY-2026', password: 'FacultyFocus2026!' })).rejects.toMatchObject({ code: 'invite_accepted' })
    await expect(auth.getInvite('EXPIRED-INVITE')).resolves.toMatchObject({ status: 'expired' })
    await expect(auth.getInvite('missing')).rejects.toMatchObject({ code: 'invite_not_found' })
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
