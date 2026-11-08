import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Mail } from 'lucide-react'
import { Button, Input } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { homeRouteFor, safeReturnPath } from '@/shared/lib/roles.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { demoCredentials, isMockMode } from '@/shared/lib/services.js'
import { AuthService } from '@/services/AuthService.js'
import { loginSchema } from '@/services/authSchemas.js'
import { useZodForm } from '../hooks/useZodForm.js'
import { useLogin } from '../hooks/useSession.js'
import { useCountdown } from '../hooks/useCountdown.js'
import { describeAuthError } from '../lib/authErrors.js'
import { AuthHeading } from '../components/AuthHeading.jsx'
import { AuthErrorNotice, AuthNotice } from '../components/AuthNotice.jsx'
import { PasswordField } from '../components/PasswordField.jsx'
import { AuthLink } from '../components/AuthLink.jsx'
import { DemoAccounts } from '../components/DemoAccounts.jsx'

export function LoginPage() {
  useDocumentTitle('Sign in')
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const returnTo = safeReturnPath(location.state?.from)
  const { registerForm, ...form } = useZodForm(loginSchema, { email: location.state?.email ?? '', password: '' })
  const { login, isPending, error, reset } = useLogin()
  const notice = useSessionStore((state) => state.notice)
  const clearNotice = useSessionStore((state) => state.clearNotice)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [capsLock, setCapsLock] = useState(false)
  const errorInfo = error ? describeAuthError(error) : null
  const lockSeconds = useCountdown(errorInfo?.lockedUntil)
  const locked = Boolean(errorInfo?.lockedUntil && lockSeconds > 0)

  useEffect(() => { reset() }, [form.values.email, form.values.password, reset])

  /** @param {{ email: string, password: string }} values */
  async function submit(values) {
    if (isPending || locked) return
    clearNotice()
    setSubmittedEmail(values.email)
    try {
      const session = await login(values)
      /* A temporary credential must complete setup before any role dashboard. */
      if (session.mustChangePassword || session.user?.mustChangePassword) {
        navigate('/setup-account', { replace: true, state: { from: returnTo ?? undefined } })
        return
      }
      navigate(returnTo ?? homeRouteFor(session.user.role), { replace: true })
    } catch { /* The mutation error is rendered inline, next to the form. */ }
  }
  /** @param {{ email: string, role: import('@/contracts/user.js').Role }} seat */
  function quickLogin(seat) {
    form.setValue('email', seat.email)
    form.setValue('password', demoCredentials)
    void submit({ email: seat.email, password: demoCredentials })
  }
  async function unlockDemo() {
    if (!isMockMode) return
    await AuthService.unlockDemo?.(submittedEmail)
    reset()
  }
  /** @param {React.KeyboardEvent<HTMLInputElement>} event */
  function detectCapsLock(event) {
    if (typeof event.getModifierState === 'function') setCapsLock(event.getModifierState('CapsLock'))
  }

  return (
    <>
      <AuthHeading eyebrow="Your workspace awaits" title="Welcome back." description="Sign in to pick up where you left off. Your next step is waiting." />
      <div className="mb-5 space-y-3" aria-live="polite">
        {notice === 'expired' ? <AuthNotice title="Your session expired" message="For your privacy, sessions last eight hours. Sign in again to return to your workspace." tone="warning" /> : null}
        {params.get('reset') === 'success' ? <AuthNotice title="Password updated" message="Your new password is ready. Sign in to continue." tone="success" /> : null}
        {location.state?.registrationRetired ? <AuthNotice title="Accounts are issued by your academic office" message="Public sign-up and self-service invitations are closed. Sign in with the Institute ID and temporary password your academic office gave you." tone="info" /> : null}
      </div>
      <form ref={registerForm} noValidate aria-label="Sign in" aria-busy={isPending} onSubmit={(event) => form.handleSubmit(event, submit)} className="flex flex-col gap-4">
        <Input id="email" label="Email address" name="email" type="text" autoComplete="username" inputMode="email" placeholder="Email or Institute ID" hint="You can also sign in with the Institute ID issued by your academic office." icon={<Mail strokeWidth={1.5} />} className="min-h-12 text-sm" value={form.values.email} onChange={(event) => form.setValue('email', event.target.value)} onBlur={() => form.onBlur('email')} error={form.errors.email} disabled={isPending} required aria-required="true" />
        <div>
          <PasswordField id="password" label="Password" name="password" autoComplete="current-password" placeholder="Enter your password" value={form.values.password} onChange={(event) => form.setValue('password', event.target.value)} onBlur={() => form.onBlur('password')} onKeyUp={detectCapsLock} error={form.errors.password} disabled={isPending} required aria-required="true" />
          {capsLock ? <p className="mt-1 text-xs text-muted" role="status">Caps Lock is on.</p> : null}
          <div className="mt-1 flex justify-end"><AuthLink to="/forgot-password" state={{ email: form.values.email }}>Forgot password?</AuthLink></div>
        </div>
        {error ? (
          <AuthErrorNotice error={error}>
            <div className="mt-1 flex flex-wrap gap-x-4">
              {errorInfo?.code === 'account_locked' && isMockMode ? <AuthLink to="/forgot-password" state={{ email: submittedEmail }}>Reset your password</AuthLink> : null}
              {errorInfo?.code === 'account_locked' && isMockMode && errorInfo?.canUnlockDemo ? <button type="button" onClick={unlockDemo} className="min-h-11 rounded-xs text-xs text-muted underline underline-offset-4">Unlock demo attempt counter</button> : null}
              {errorInfo?.code === 'account_suspended' || errorInfo?.code === 'account_archived' || errorInfo?.code === 'registration_retired' ? <span className="text-xs text-muted">Need help? Contact your academic office.</span> : null}
            </div>
          </AuthErrorNotice>
        ) : null}
        <Button type="submit" variant="primary" size="lg" full loading={isPending} disabled={locked} trailingIcon={<ArrowRight strokeWidth={1.5} />}>{isPending ? 'Signing you in' : locked ? 'Account temporarily locked' : 'Sign in'}</Button>
      </form>
      <DemoAccounts onSelect={quickLogin} onScenario={(email) => { form.setValue('email', email); form.setValue('password', 'wrong-password'); reset() }} disabled={isPending || locked} />
      {!isMockMode ? <p className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-muted">Accounts are issued by your academic office. Need help? Contact them for your Institute ID.</p> : null}
    </>
  )
}
