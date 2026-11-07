import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FlaskConical, Mail } from 'lucide-react'
import { Button, Input } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { AuthService } from '@/services/AuthService.js'
import { forgotPasswordSchema } from '@/services/authSchemas.js'
import { isMockMode } from '@/shared/lib/services.js'
import { useZodForm } from '../hooks/useZodForm.js'
import { AuthHeading } from '../components/AuthHeading.jsx'
import { AuthErrorNotice, AuthNotice } from '../components/AuthNotice.jsx'
import { AuthLink } from '../components/AuthLink.jsx'

export function ForgotPasswordPage() {
  useDocumentTitle('Forgot password')
  const location = useLocation()
  const { registerForm, ...form } = useZodForm(forgotPasswordSchema, { email: location.state?.email ?? '' })
  const mutation = useMutation({ mutationFn: AuthService.requestReset })
  const [requestedEmail, setRequestedEmail] = useState('')

  /** @param {{ email: string }} values */
  async function submit(values) {
    if (mutation.isPending) return
    setRequestedEmail(values.email)
    try { await mutation.mutateAsync(values) } catch { /* Inline error; no account enumeration. */ }
  }

  return (
    <>
      <AuthHeading eyebrow="A way back in" title={mutation.data ? 'Check your inbox.' : 'Forgot your password?'} description={mutation.data ? <>We’ve processed a reset request for <strong className="break-all font-[560] text-heading">{requestedEmail}</strong>.</> : 'It happens. Enter your account email and we’ll send a link to help you set a new password.'} />
      {mutation.data ? (
        <div className="space-y-5">
          <AuthNotice title="Password reset requested" message={mutation.data.message} tone="success" />
          {isMockMode && mutation.data.demoResetPath ? (
            <section aria-labelledby="reset-inbox-heading" className="rounded-md border border-line bg-surface-sunken p-4">
              <h2 id="reset-inbox-heading" className="flex items-center gap-2 text-xs font-[600] text-heading"><FlaskConical className="size-4" aria-hidden="true" />Demo inbox</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted">This shortcut appears only when a demo account matches. No email leaves your browser.</p>
              <AuthLink to={mutation.data.demoResetPath} className="mt-1 gap-2">Open your demo reset link <ArrowRight className="size-3.5" aria-hidden="true" /></AuthLink>
            </section>
          ) : null}
          <p className="text-xs leading-relaxed text-muted">The link expires in 15 minutes and can be used once. Check your spam folder, too.</p>
          <Button variant="secondary" full disabled={mutation.isPending} onClick={() => { mutation.reset(); void submit({ email: requestedEmail }) }}>Send another request</Button>
        </div>
      ) : (
        <form ref={registerForm} noValidate aria-label="Request password reset" aria-busy={mutation.isPending} onSubmit={(event) => form.handleSubmit(event, submit)} className="space-y-5">
          <Input id="email" name="email" label="Account email" type="email" inputMode="email" autoComplete="email" placeholder="you@vidyutacademy.in" icon={<Mail strokeWidth={1.5} />} className="min-h-12 text-sm" value={form.values.email} onChange={(event) => { form.setValue('email', event.target.value); mutation.reset() }} onBlur={() => form.onBlur('email')} error={form.errors.email} disabled={mutation.isPending} required aria-required="true" />
          {mutation.error ? <AuthErrorNotice error={mutation.error} /> : null}
          <Button type="submit" variant="primary" size="lg" full loading={mutation.isPending} trailingIcon={<ArrowRight strokeWidth={1.5} />}>{mutation.isPending ? 'Sending reset link' : 'Send reset link'}</Button>
        </form>
      )}
      <AuthLink to="/login" state={{ email: requestedEmail || form.values.email }} className="mt-6 gap-2 text-muted"><ArrowLeft className="size-3.5" aria-hidden="true" />Back to sign in</AuthLink>
    </>
  )
}
