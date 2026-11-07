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

  it('signup validates consent, supports the Terms dialog, then paste-verifies OTP', async () => {
    const { user } = await renderRoute('/signup')
    await heading('Make room for progress.')
    await screen.findByLabelText('Your batch')
    await user.type(screen.getByLabelText('Full name'), 'Kiran Mishra')
    await user.type(screen.getByLabelText('Email address'), 'kiran@example.com')
    await user.type(screen.getByLabelText('Institute code'), 'VYUH2026')
    await user.selectOptions(screen.getByLabelText('Your batch'), 'bat-prayas-m')
    await user.type(screen.getByLabelText('Create a password'), 'FocusedMind2026!')
    await user.click(screen.getByRole('button', { name: 'Read the Terms' }))
    expect(await screen.findByRole('dialog')).toBeTruthy()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await user.click(screen.getByRole('button', { name: 'Create account & verify email' }))
    await alertText('Accept the Terms')
    expect(screen.getByLabelText(/I accept the Terms/).getAttribute('aria-describedby')).toContain('termsConsent-error')
    await user.click(screen.getByLabelText(/I accept the Terms/))
    await user.click(screen.getByLabelText(/I agree to the attendance/))
    await user.click(screen.getByRole('button', { name: 'Create account & verify email' }))
    await heading('A code. A fresh start.')
    expect((await screen.findByRole('button', { name: /Resend in/ })).disabled).toBe(true)
    const first = screen.getByRole('textbox', { name: 'Digit 1 of 6' })
    await user.click(first)
    await user.keyboard('1')
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Digit 2 of 6' }))
    await user.click(first)
    await user.paste('123456')
    expect(screen.getByRole('textbox', { name: 'Digit 6 of 6' }).value).toBe('6')
    await user.click(screen.getByRole('button', { name: 'Verify & continue' }))
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/student'))
    expect(useSessionStore.getState().user?.name).toBe('Kiran Mishra')
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).not.toContain('FocusedMind2026!')
  })

  it('shows an expired OTP message and offers resend', async () => {
    const challenge = await authService.signup({ name: 'Expired Test', email: 'expired@example.com', instituteCode: 'VYUH2026', batchId: 'bat-prayas-m', password: 'FocusedMind2026!', termsConsent: true, attendanceConsent: true })
    const { user } = await renderRoute(`/verify-otp?challenge=${challenge.id}`)
    await heading('A code. A fresh start.')
    await user.click(await screen.findByRole('button', { name: 'Try expired code (000000)' }))
    await user.click(screen.getByRole('button', { name: 'Verify & continue' }))
    await alertText('Verification code expired')
    expect(screen.getByRole('group', { name: 'Six-digit verification code' }).getAttribute('aria-describedby')).toContain('otp-service-error')
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

  it('accepts a faculty invite and reaches the faculty layout', async () => {
    const { user } = await renderRoute('/join/VYUH-FACULTY-2026')
    await heading('Your next chapter starts here.')
    await screen.findByLabelText('Create your password')
    await user.type(screen.getByLabelText('Create your password'), 'FacultyFocus2026!')
    await user.type(screen.getByLabelText('Confirm password'), 'FacultyFocus2026!')
    await user.click(screen.getByRole('button', { name: 'Accept invite & join' }))
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/faculty'))
    expect(screen.getByRole('navigation', { name: 'Faculty workspace' })).toBeTruthy()
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

  it('login and signup pass automated WCAG A/AA checks', async () => {
    await renderRoute('/login')
    await heading('Welcome back.')
    let results = await axe.run(document.body, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })
    expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) }))).toEqual([])
    await renderRoute('/signup')
    await heading('Make room for progress.')
    await screen.findByLabelText('Your batch')
    results = await axe.run(document.body, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })
    expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) }))).toEqual([])
  })
})
