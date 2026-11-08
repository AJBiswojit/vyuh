import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Button, Input } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { homeRouteFor, safeReturnPath } from '@/shared/lib/roles.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { setupAccountSchema } from '@/services/authSchemas.js'
import { useZodForm } from '../hooks/useZodForm.js'
import { useAccountSetup } from '../hooks/useSession.js'
import { AuthHeading } from '../components/AuthHeading.jsx'
import { AuthErrorNotice, AuthNotice } from '../components/AuthNotice.jsx'
import { PasswordField } from '../components/PasswordField.jsx'

/**
 * Batch 2 first-login PASSWORD step only.
 *
 * G5 is EXPLICITLY DEFERRED: the institute has not supplied approved policy
 * wording or a version identifier. There is no consent checkbox, no fabricated
 * legal text, no fake version and no automatic acceptance. The gate is driven
 * purely by `mustChangePassword`, so an approved acknowledgement step can be
 * added later without rebuilding authentication.
 */
export function SetupAccountPage() {
  useDocumentTitle('Set up your account')
  const navigate = useNavigate()
  const location = useLocation()
  const session = useSessionStore((state) => state.session)
  const user = useSessionStore((state) => state.user)
  const mustChangePassword = useSessionStore((state) => state.mustChangePassword)
  const { registerForm, ...form } = useZodForm(setupAccountSchema, { newPassword: '', confirmPassword: '' })
  const { setup, isPending, error, reset } = useAccountSetup()
  const [done, setDone] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const returnTo = safeReturnPath(location.state?.from)

  /* Already-configured accounts have nothing to do here; never loop back to login. */
  if (!session || !user) return <Navigate to="/login" replace />
  if (!mustChangePassword && !done) return <Navigate to={homeRouteFor(user.role)} replace />

  /** @param {{ newPassword: string, confirmPassword: string }} values */
  async function submit(values) {
    if (isPending || done) return
    try {
      const refreshed = await setup(values)
      /* Clear sensitive component state immediately after a successful write.
         `reset()` also drops the mutation's in-memory variables, so neither the
         form state nor the mutation cache retains the submitted password. */
      form.setValue('newPassword', '')
      form.setValue('confirmPassword', '')
      form.setErrors({})
      reset()
      setDone(true)
      setCapsLock(false)
      /* Let the success state render, then go to the correct role workspace. */
      requestAnimationFrame(() => {
        navigate(returnTo ?? homeRouteFor(refreshed.user.role), { replace: true })
      })
    } catch { /* The mutation error is rendered inline, next to the form. */ }
  }

  /** @param {React.KeyboardEvent<HTMLInputElement>} event */
  function detectCapsLock(event) {
    if (typeof event.getModifierState === 'function') setCapsLock(event.getModifierState('CapsLock'))
  }

  return (
    <>
      <AuthHeading eyebrow="First-time setup" title="Choose your own password." description="Your academic office issued a temporary password. Replace it now with one only you know before you open your workspace." />
      <div className="mb-5 space-y-3" aria-live="polite">
        {done ? <AuthNotice title="Password updated" message="Your temporary password no longer works. Taking you to your workspace." tone="success" /> : null}
        {!done && !isPending ? <AuthNotice title="This step is required" message="You cannot open your dashboard until the temporary password has been replaced." tone="warning" /> : null}
      </div>
      {session.instituteId ? (
        <div className="mb-5">
          <Input id="institute-id" label="Institute ID" name="instituteId" value={session.instituteId} readOnly hint="This is the identity issued to you by your academic office." className="min-h-12 font-mono text-sm" />
        </div>
      ) : null}
      <form ref={registerForm} noValidate aria-label="Set up your account" aria-busy={isPending} onSubmit={(event) => form.handleSubmit(event, submit)} className="flex flex-col gap-4">
        <div>
          <PasswordField id="newPassword" name="newPassword" label="New password" autoComplete="new-password" placeholder="At least 10 characters" strength value={form.values.newPassword} onChange={(event) => { form.setValue('newPassword', event.target.value); reset() }} onBlur={() => form.onBlur('newPassword')} onKeyUp={detectCapsLock} error={form.errors.newPassword} disabled={isPending || done} required aria-required="true" />
          {capsLock ? <p className="mt-1 text-xs text-muted" role="status">Caps Lock is on.</p> : null}
        </div>
        <PasswordField id="confirmPassword" name="confirmPassword" label="Confirm new password" autoComplete="new-password" placeholder="Enter it once more" value={form.values.confirmPassword} onChange={(event) => form.setValue('confirmPassword', event.target.value)} onBlur={() => form.onBlur('confirmPassword')} error={form.errors.confirmPassword} disabled={isPending || done} required aria-required="true" />
        <p className="text-xs leading-relaxed text-muted">Use at least 10 characters with a letter and a number. Your new password must be different from the temporary one.</p>
        {error ? <AuthErrorNotice error={error} /> : null}
        <Button type="submit" variant="primary" size="lg" full loading={isPending} disabled={done} trailingIcon={<ArrowRight strokeWidth={1.5} />}>{isPending ? 'Updating password' : done ? 'Password updated' : 'Save password & continue'}</Button>
      </form>
      <p className="mt-5 flex items-start gap-2 text-2xs leading-relaxed text-faint"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />Institute policy acknowledgement is not enabled yet: the institute has not supplied approved wording or a version identifier. No policy text is shown here.</p>
      <p className="mt-4 text-xs leading-relaxed text-muted">Lost your temporary password? Contact your academic office; they will issue a new one.</p>
      <p className="mt-5 border-t border-line pt-4 text-2xs leading-relaxed text-faint">Prototype only: credentials are demonstration data kept in this browser. Salted SHA-256 is not a password KDF and is not production-grade credential security.</p>
    </>
  )
}
