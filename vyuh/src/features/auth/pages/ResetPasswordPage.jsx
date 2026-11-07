import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { AuthService } from '@/services/AuthService.js'
import { resetPasswordSchema } from '@/services/authSchemas.js'
import { useZodForm } from '../hooks/useZodForm.js'
import { AuthHeading } from '../components/AuthHeading.jsx'
import { AuthErrorNotice, AuthNotice } from '../components/AuthNotice.jsx'
import { PasswordField } from '../components/PasswordField.jsx'
import { AuthLink } from '../components/AuthLink.jsx'

export function ResetPasswordPage() {
  useDocumentTitle('Set a new password')
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const { registerForm, ...form } = useZodForm(resetPasswordSchema, { token, password: '', confirmPassword: '' })
  const mutation = useMutation({ mutationFn: AuthService.resetPassword })

  /** @param {{ token: string, password: string, confirmPassword: string }} values */
  async function submit(values) {
    if (mutation.isPending) return
    try {
      const result = await mutation.mutateAsync(values)
      navigate('/login?reset=success', { replace: true, state: { email: result.email } })
    } catch { /* Invalid, used, and expired links have distinct inline messages. */ }
  }

  return (
    <>
      <AuthHeading eyebrow="Reset your password" title="A new password. A clean slate." description="Choose a password you haven’t used here before. Your papers and progress stay right where they are." />
      {!token ? (
        <div className="space-y-4"><AuthNotice title="This reset link is incomplete" message="Open the full link from your email, or request a new one below." tone="warning" /><AuthLink to="/forgot-password">Request a new reset link</AuthLink></div>
      ) : (
        <form ref={registerForm} noValidate aria-label="Set new password" aria-busy={mutation.isPending} onSubmit={(event) => form.handleSubmit(event, submit)} className="space-y-5">
          <PasswordField id="password" name="password" label="New password" autoComplete="new-password" placeholder="At least 10 characters" strength value={form.values.password} onChange={(event) => { form.setValue('password', event.target.value); mutation.reset() }} onBlur={() => form.onBlur('password')} error={form.errors.password || form.errors.token} disabled={mutation.isPending} required aria-required="true" />
          <PasswordField id="confirmPassword" name="confirmPassword" label="Confirm new password" autoComplete="new-password" placeholder="Enter it once more" value={form.values.confirmPassword} onChange={(event) => form.setValue('confirmPassword', event.target.value)} onBlur={() => form.onBlur('confirmPassword')} error={form.errors.confirmPassword} disabled={mutation.isPending} required aria-required="true" />
          {mutation.error ? <AuthErrorNotice error={mutation.error}><AuthLink to="/forgot-password">Request a new link</AuthLink></AuthErrorNotice> : null}
          <Button type="submit" variant="primary" size="lg" full loading={mutation.isPending} trailingIcon={<ArrowRight strokeWidth={1.5} />}>{mutation.isPending ? 'Updating password' : 'Set new password'}</Button>
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted"><ShieldCheck className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />You’ll sign in again with your new password.</p>
        </form>
      )}
      <AuthLink to="/login" className="mt-6 text-muted">Back to sign in</AuthLink>
    </>
  )
}
