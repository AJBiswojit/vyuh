import { useEffect, useId, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { Input } from '@/shared/ui/Input.jsx'
import { Button } from '@/shared/ui/Button.jsx'
import { Badge } from '@/shared/ui/Badge.jsx'
import { IconButton } from '@/shared/ui/IconButton.jsx'
import { cn } from '@/shared/lib/cn.js'
import { durations, easeEntrance } from '@/shared/lib/motion.js'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { demoSeats, isMockMode } from '@/shared/lib/services.js'
import { roleLabel } from '@/shared/lib/roles.js'
import { useSignIn } from '../hooks/useSession.js'

/**
 * Sign-in. Two panes on desktop: the form on paper, and an ink panel that states
 * what the product will and will not do with the account. On mobile the ink pane
 * collapses to a single line of context above the form.
 *
 * Demo seats are listed because this build reads fixtures; each one fills the
 * form rather than submitting it, so the reader still sees the validation path.
 * In API mode the list does not render at all.
 */
const DEMO_PASSWORD = 'vyuh2026'

export function SignInPage() {
  useDocumentTitle('Sign in')
  const navigate = useNavigate()
  const location = useLocation()
  const formId = useId()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState(false)
  const { signIn, isPending, error, reset } = useSignIn()

  /** @type {string | undefined} */
  const redirectTo = location.state?.from

  useEffect(() => {
    if (!error) return
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password])

  const emailMissing = touched && email.trim().length === 0
  const passwordMissing = touched && password.length === 0
  const canSubmit = email.trim().length > 0 && password.length > 0 && !isPending

  /** @param {React.FormEvent<HTMLFormElement>} event */
  function onSubmit(event) {
    event.preventDefault()
    setTouched(true)
    if (!email.trim() || !password) return
    signIn(
      { email: email.trim(), password },
      {
        onSuccess: () => navigate(redirectTo ?? '/app', { replace: true }),
      },
    )
  }

  /** @param {{ email: string }} seat */
  function fillSeat(seat) {
    setEmail(seat.email)
    setPassword(DEMO_PASSWORD)
    setTouched(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durations.standard, ease: easeEntrance }}
      className="w-full max-w-[26rem]"
    >
      <p className="rule-label">Vidyut Academy · Bhubaneswar</p>
      <h1 className="mt-3 text-3xl leading-[1.1] tracking-tighter">Sign in</h1>
      <p className="mt-2 text-sm text-muted">
        Use the institute address on your admit slip. Accounts are issued at enrolment.
      </p>

      <form id={formId} onSubmit={onSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        <Input
          label="Institute email"
          type="email"
          name="email"
          autoComplete="username"
          inputMode="email"
          placeholder="name@vidyutacademy.in"
          icon={<Mail strokeWidth={1.5} />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailMissing ? 'Enter the email the academic office has on file.' : undefined}
          hint="Student, faculty and office accounts share this field."
          required
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          icon={<Lock strokeWidth={1.5} />}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={passwordMissing ? 'Enter your password. The office can reset it if you have lost it.' : undefined}
          required
          trailing={
            <IconButton
              icon={showPassword ? <EyeOff strokeWidth={1.5} /> : <Eye strokeWidth={1.5} />}
              label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((value) => !value)}
              aria-pressed={showPassword}
            />
          }
        />

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 border-l-2 border-l-danger bg-[color-mix(in_oklab,var(--color-danger)_8%,transparent)] py-2.5 pl-3 pr-3"
          >
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-danger-fg" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="text-xs font-[560] text-danger-fg">
                {error.code === 'invalid_credentials' ? 'Sign-in rejected' : 'Sign-in failed'}
              </p>
              <p className="mt-0.5 text-xs text-body">{error.message}</p>
            </div>
          </div>
        ) : null}

        <Button type="submit" variant="primary" size="lg" full loading={isPending} disabled={!canSubmit} trailingIcon={<ArrowRight strokeWidth={1.5} />}>
          {isPending ? 'Signing in' : 'Sign in'}
        </Button>
      </form>

      {isMockMode ? (
        <section aria-labelledby="seats-heading" className="mt-8 border-t border-line pt-5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="seats-heading" className="rule-label">
              Demo seats
            </h2>
            <span className="font-mono text-2xs tabular-nums text-faint">password {DEMO_PASSWORD}</span>
          </div>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {demoSeats.map((seat) => (
              <li key={seat.email}>
                <button
                  type="button"
                  onClick={() => fillSeat(seat)}
                  className={cn(
                    'group flex min-h-12 w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-surface-sunken',
                    email === seat.email && 'bg-surface-sunken',
                  )}
                >
                  <Badge tone={seat.role === 'student' ? 'ember' : 'neutral'} variant="outline" className="w-[5.25rem] justify-center uppercase">
                    {roleLabel(seat.role)}
                  </Badge>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-[560] text-heading">{seat.label.split('· ')[1]}</span>
                    <span className="block truncate font-mono text-2xs text-faint">{seat.email}</span>
                  </span>
                  <span className="shrink-0 text-2xs text-faint transition-colors group-hover:text-ember-press">Use</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-2xs leading-relaxed text-faint">
            Choosing a seat fills the form; it does not sign you in. The build reads local fixtures,
            so nothing you type leaves this browser.
          </p>
        </section>
      ) : (
        <p className="mt-6 border-t border-line pt-5 text-2xs leading-relaxed text-faint">
          Cannot sign in? The academic office issues and resets accounts on +91 674 250 1180, Monday to
          Saturday, 09:00–17:00.
        </p>
      )}
    </motion.div>
  )
}
