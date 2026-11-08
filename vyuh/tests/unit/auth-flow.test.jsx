import { beforeEach, describe, expect, it, vi } from 'vitest'
import axe from 'axe-core'
import { renderRoute, screen, waitFor } from './helpers.jsx'
import { authService } from '@/services/mock/auth.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { SESSION_STORAGE_KEY } from '@/shared/lib/sessionPersistence.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})
beforeEach(() => { localStorage.clear(); useSessionStore.getState().clear() })
const heading = (name) => screen.findByRole('heading', { name, level: 1 })
const alertText = async (text) => waitFor(() => expect(screen.getAllByRole('alert').some((node) => node.textContent.includes(text))).toBe(true))

describe('authentication acceptance flows', () => {
  it.each([
    ['Student', '/student', 'Student workspace'],
    ['Faculty', '/faculty', 'Faculty workspace'],
    ['Academic office', '/admin', 'Academic office'],
  ])('quick-login reaches the %s layout', async (role, path, navigation) => {
    const { user } = await renderRoute('/login')
    await heading('Welcome back.')
    await user.click(screen.getByRole('button', { name: `Quick demo login as ${role}` }))
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe(path))
    expect(screen.getByRole('navigation', { name: navigation })).toBeTruthy()
    expect(useSessionStore.getState().user?.role).toBe(path === '/student' ? 'student' : path === '/faculty' ? 'faculty' : 'admin')
  })

  it('preserves a deep link including query and hash through login', async () => {
    const { user } = await renderRoute('/student/papers?filter=live#top')
    await heading('Welcome back.')
    expect(screen.getByTestId('route').textContent).toBe('/login')
    expect(useSessionStore.getState().status).toBe('anonymous')
    // Router history state survives a reload; the guard captured search + hash.
    await user.type(screen.getByLabelText('Email address'), 'ananya.sahoo@vidyutacademy.in')
    await user.type(screen.getByLabelText('Password', { exact: true }), 'vyuh2026')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/student/papers?filter=live#top'))
  })

  it('shows inline Zod errors and focuses the first invalid field', async () => {
    const { user } = await renderRoute('/login')
    await heading('Welcome back.')
    await user.click(screen.getByRole('button', { name: 'Sign in', exact: true }))
    await alertText('Enter a valid email address.')
    const email = screen.getByLabelText('Email address')
    expect(email.getAttribute('aria-invalid')).toBe('true')
    expect(email.getAttribute('aria-describedby')).toContain('email-error')
    await waitFor(() => expect(document.activeElement).toBe(email))
  })

  it.each([
    ['wrong-password', 'ananya.sahoo@vidyutacademy.in', 'Wrong email or password'],
    ['locked', 'locked.student@vidyutacademy.in', 'Account temporarily locked'],
    ['network', 'offline@vidyutacademy.in', 'Connection interrupted'],
  ])('renders a distinct %s error', async (_kind, email, title) => {
    const { user } = await renderRoute('/login')
    await heading('Welcome back.')
    await user.type(screen.getByLabelText('Email address'), email)
    await user.type(screen.getByLabelText('Password', { exact: true }), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in', exact: true }))
    await alertText(title)
  })

  it('locks after five wrong passwords and keeps the submit action locked', async () => {
    const { user } = await renderRoute('/login')
    await heading('Welcome back.')
    await user.type(screen.getByLabelText('Email address'), 'lock-ui@example.com')
    await user.type(screen.getByLabelText('Password', { exact: true }), 'wrong')
    for (let i = 0; i < 5; i++) {
      await user.click(screen.getByRole('button', { name: 'Sign in', exact: true }))
      await screen.findByRole('button', { name: i === 4 ? 'Account temporarily locked' : 'Sign in' })
    }
    await alertText('Account temporarily locked')
    expect(screen.getByRole('button', { name: 'Account temporarily locked' }).disabled).toBe(true)
    expect(screen.getByRole('link', { name: 'Reset your password' })).toBeTruthy()
  })

  it('shows access denied in the user’s own layout for a mismatched route', async () => {
    const session = await authService.login({ email: 'ananya.sahoo@vidyutacademy.in', password: 'vyuh2026' })
    await renderRoute('/faculty', { session })
    await heading(/A different seat/)
    expect(screen.getByTestId('route').textContent).toBe('/access-denied')
    expect(screen.getByRole('navigation', { name: 'Student workspace' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Go to your student workspace/ }).getAttribute('href')).toBe('/student')
  })

  /* C1 rewrite: the public signup journey no longer exists. The former
     consent/dialog/OTP-paste case now asserts route retirement and that a
     visitor cannot create an account or leave a plaintext credential behind. */
  it('public signup is retired: no self-created account and no plaintext credential', async () => {
    await renderRoute('/signup')
    await heading('Welcome back.')
    expect(screen.getByTestId('route').textContent).toBe('/login')
    expect(await screen.findByText(/Accounts are issued by your academic office/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Create your account/i })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Create account & verify email' })).toBeNull()
    const input = { name: 'Kiran Mishra', email: 'kiran@example.com', instituteCode: 'VYUH2026', batchId: 'bat-prayas-m', password: 'FocusedMind2026!', termsConsent: true, attendanceConsent: true }
    await expect(authService.signup(input)).rejects.toMatchObject({ code: 'registration_retired' })
    await expect(authService.login({ email: input.email, password: input.password })).rejects.toMatchObject({ code: 'invalid_credentials' })
    expect(useSessionStore.getState().user).toBeNull()
    for (const key of [SESSION_STORAGE_KEY, 'vyuh.mock.auth.v1', 'vyuh.mock.accounts.v1']) {
      expect(localStorage.getItem(key) ?? '').not.toContain(input.password)
    }
  })

  /* C1 rewrite: OTP is no longer a registration mechanism, so no challenge
     exists to expire or resend. Expired-code/resend coverage is retired with
     documentation instead of being silently deleted. */
  it('the OTP verification route is retired and leaves no challenge state', async () => {
    await expect(authService.signup({ name: 'Expired Test', email: 'expired@example.com', instituteCode: 'VYUH2026', batchId: 'bat-prayas-m', password: 'FocusedMind2026!', termsConsent: true, attendanceConsent: true })).rejects.toMatchObject({ code: 'registration_retired' })
    await renderRoute('/verify-otp?challenge=demo-signup')
    await heading('Welcome back.')
    expect(await screen.findByText(/Accounts are issued by your academic office/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Resend in/ })).toBeNull()
    await expect(authService.verifyOtp({ challengeId: 'demo-signup', code: '000000' })).rejects.toMatchObject({ code: 'challenge_not_found' })
    await expect(authService.verifyOtp({ challengeId: 'demo-signup', code: '123456' })).rejects.toMatchObject({ code: 'challenge_not_found' })
    const stored = JSON.parse(localStorage.getItem('vyuh.mock.auth.v1') ?? '{}')
    expect(Object.keys(stored.challenges ?? {})).toEqual([])
    expect(localStorage.getItem(SESSION_STORAGE_KEY) ?? '').not.toContain('FocusedMind2026!')
  })

  it('requests a reset, opens the mock inbox link, and signs in with the new password', async () => {
    const { user } = await renderRoute('/forgot-password')
    await heading('Forgot your password?')
    await user.type(screen.getByLabelText('Account email'), 'ananya.sahoo@vidyutacademy.in')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))
    const link = await screen.findByRole('link', { name: /Open your demo reset link/ })
    await user.click(link)
    await heading('A new password. A clean slate.')
    await user.type(screen.getByLabelText('New password'), 'NewFocused2026!')
    await user.type(screen.getByLabelText('Confirm new password'), 'NewFocused2026!')
    await user.click(screen.getByRole('button', { name: 'Set new password' }))
    await heading('Welcome back.')
    expect(screen.getByLabelText('Email address').value).toBe('ananya.sahoo@vidyutacademy.in')
    await user.type(screen.getByLabelText('Password', { exact: true }), 'NewFocused2026!{Enter}')
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/student'))
  })

  /* C1 rewrite: invitations cannot activate an account or reach a faculty UI. */
  it('the invitation route cannot activate an account or reach the faculty layout', async () => {
    await renderRoute('/join/VYUH-FACULTY-2026')
    await heading('Welcome back.')
    expect(screen.getByTestId('route').textContent).toBe('/login')
    expect(screen.queryByRole('navigation', { name: 'Faculty workspace' })).toBeNull()
    await expect(authService.acceptInvite({ inviteCode: 'VYUH-FACULTY-2026', password: 'FacultyFocus2026!' })).rejects.toMatchObject({ code: 'registration_retired' })
    await expect(authService.getInvite('EXPIRED-INVITE')).resolves.toMatchObject({ status: 'expired' })
    expect(useSessionStore.getState().user).toBeNull()
    for (const key of [SESSION_STORAGE_KEY, 'vyuh.mock.auth.v1', 'vyuh.mock.accounts.v1']) {
      expect(localStorage.getItem(key) ?? '').not.toContain('FacultyFocus2026!')
    }
  })

  it('logout clears persisted session and returns to the landing page', async () => {
    const session = await authService.login({ email: 'snehasish@vidyutacademy.in', password: 'vyuh2026' })
    const { user } = await renderRoute('/faculty/account', { session })
    await heading('Account and preferences')
    await user.click(screen.getAllByRole('button', { name: 'Sign out' })[0])
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/'))
    await waitFor(() => expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull())
    expect(useSessionStore.getState().user).toBeNull()
  })

  /* C1 rewrite: the second axe target is now the retirement notice on /login
     reached from /signup; the first-login page is axe-tested in first-login.test.jsx. */
  it('login and the retired-signup notice pass automated WCAG A/AA checks', async () => {
    const first = await renderRoute('/login')
    await heading('Welcome back.')
    let results = await axe.run(document.body, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })
    expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) }))).toEqual([])
    first.unmount()
    await renderRoute('/signup')
    await heading('Welcome back.')
    await screen.findByText(/Accounts are issued by your academic office/)
    results = await axe.run(document.body, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })
    expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) }))).toEqual([])
  })
})
