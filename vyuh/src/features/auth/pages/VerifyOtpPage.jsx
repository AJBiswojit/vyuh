import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FlaskConical, MailCheck, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { AuthService } from '@/services/AuthService.js'
import { otpSchema } from '@/services/authSchemas.js'
import { homeRouteFor } from '@/shared/lib/roles.js'
import { demoOtp, expiredDemoOtp, isMockMode } from '@/shared/lib/services.js'
import { useZodForm } from '../hooks/useZodForm.js'
import { useCommitSession } from '../hooks/useSession.js'
import { formatCountdown, useCountdown } from '../hooks/useCountdown.js'
import { AuthHeading } from '../components/AuthHeading.jsx'
import { AuthErrorNotice, AuthNotice } from '../components/AuthNotice.jsx'
import { OtpInput } from '../components/OtpInput.jsx'
import { AuthLink } from '../components/AuthLink.jsx'

export function VerifyOtpPage() {
  useDocumentTitle('Verify your email')
  const [params, setParams] = useSearchParams()
  const challengeId = params.get('challenge') ?? ''
  const navigate = useNavigate()
  const commit = useCommitSession()
  const queryClient = useQueryClient()
  const challengeQuery = useQuery({ queryKey: ['auth', 'challenge', challengeId], queryFn: () => AuthService.getChallenge(challengeId), enabled: Boolean(challengeId), retry: 1, staleTime: Infinity })
  const challenge = challengeQuery.data
  const { registerForm, ...form } = useZodForm(otpSchema, { challengeId, code: '' })
  const mutation = useMutation({ mutationFn: AuthService.verifyOtp })
  const resend = useMutation({ mutationFn: AuthService.resendOtp })
  const [resent, setResent] = useState(false)
  const resendSeconds = useCountdown(challenge?.resendAvailableAt)
  const expirySeconds = useCountdown(challenge?.expiresAt)
  const busy = mutation.isPending || resend.isPending
  const error = mutation.error || resend.error

  /** @param {{ challengeId: string, code: string }} values */
  async function submit(values) {
    if (busy) return
    try {
      const result = await mutation.mutateAsync(values)
      queryClient.removeQueries({ queryKey: ['auth', 'challenge', challengeId] })
      if ('token' in result) {
        commit(result)
        navigate(homeRouteFor(result.user.role), { replace: true })
      } else navigate(result.resetPath, { replace: true })
    } catch { /* Keep the digits in place and report the exact error inline. */ }
  }
  async function requestNewCode() {
    if (busy || resendSeconds > 0) return
    try {
      const next = await resend.mutateAsync(challengeId)
      queryClient.setQueryData(['auth', 'challenge', next.id], next)
      setParams({ challenge: next.id }, { replace: true })
      form.setValue('code', '')
      mutation.reset()
      setResent(true)
    } catch { /* Inline error with retry guidance. */ }
  }

  if (!challengeId) return (
    <>
      <AuthHeading eyebrow="One small check" title="Let’s verify your email." description="Start by creating your student account or requesting a password reset. We’ll take you to the code entry step." />
      <AuthNotice title="No verification in progress" message="Verification links are unique to each request. Open the latest link from your inbox, or start a new request." tone="info" />
      <div className="mt-6 flex flex-wrap gap-x-6"><AuthLink to="/signup">Create an account</AuthLink><AuthLink to="/login">Back to sign in</AuthLink></div>
    </>
  )

  return (
    <>
      <AuthHeading eyebrow="Step 2 of 2 · Email verification" title="A code. A fresh start." description={challenge ? <>Enter the six-digit code for <strong className="break-all font-[560] text-heading">{challenge.email}</strong>. It’s valid for 10 minutes.</> : 'Retrieving your verification request…'} />
      {challengeQuery.isPending ? <div role="status" className="grid grid-cols-6 gap-2" aria-label="Loading verification request">{Array.from({ length: 6 }, (_, index) => <div key={index} className="skeleton h-14 rounded-sm sm:h-16" />)}</div> : challengeQuery.isError ? (
        <div className="space-y-4"><AuthErrorNotice error={challengeQuery.error} /><div className="flex flex-wrap gap-x-5"><Button variant="secondary" onClick={() => challengeQuery.refetch()} icon={<RefreshCw strokeWidth={1.5} />}>Try again</Button><AuthLink to="/signup">Start a new request</AuthLink></div></div>
      ) : (
        <>
          <div className="mb-5 space-y-3">
            {expirySeconds === 0 ? <AuthNotice title="Verification code expired" message="Request a new code below. Your account details are still saved." tone="warning" /> : resent ? <AuthNotice title="A fresh code is ready" message={isMockMode ? 'Find the new code in the demo inbox below. The previous code no longer works.' : 'Check your inbox. Your previous code no longer works.'} tone="success" /> : null}
          </div>
          <form ref={registerForm} noValidate aria-label="Verify email" aria-busy={busy} onSubmit={(event) => form.handleSubmit(event, submit)} className="space-y-5">
            <OtpInput value={form.values.code} onChange={(code) => { form.setValue('code', code); mutation.reset(); setResent(false) }} disabled={busy} error={form.errors.code || form.errors.challengeId} describedBy={error ? 'otp-service-error' : undefined} />
            {error ? <AuthErrorNotice id="otp-service-error" error={error} /> : null}
            <Button type="submit" variant="primary" size="lg" full loading={mutation.isPending} disabled={busy} trailingIcon={<ArrowRight strokeWidth={1.5} />}>{mutation.isPending ? 'Checking your code' : 'Verify & continue'}</Button>
          </form>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3">
            <Button variant="ghost" size="sm" onClick={requestNewCode} disabled={resendSeconds > 0 || busy} loading={resend.isPending} icon={<RefreshCw strokeWidth={1.5} />}>{resendSeconds > 0 ? `Resend in ${formatCountdown(resendSeconds)}` : 'Resend code'}</Button>
            <span className="font-mono text-2xs tabular-nums text-faint" aria-live="off">{expirySeconds > 0 ? `Expires in ${formatCountdown(expirySeconds)}` : 'Code expired'}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted">Wrong address? <AuthLink to="/signup">Start signup again</AuthLink> with the correct email.</p>
          {isMockMode ? (
            <section aria-labelledby="demo-inbox-heading" className="mt-6 rounded-md border border-line bg-surface-sunken p-4">
              <h2 id="demo-inbox-heading" className="flex items-center gap-2 text-xs font-[600] text-heading"><FlaskConical className="size-4" aria-hidden="true" />Demo inbox</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted">No real email is sent. Use <button type="button" className="min-h-11 rounded-xs font-mono font-[600] text-heading underline underline-offset-4" onClick={() => form.setValue('code', demoOtp)} aria-label={`Fill demo code ${demoOtp}`}>{demoOtp}</button> to verify.</p>
              <button type="button" className="min-h-11 rounded-xs text-xs text-muted underline decoration-line-strong underline-offset-4 hover:text-heading" onClick={() => form.setValue('code', expiredDemoOtp)}>Try expired code ({expiredDemoOtp})</button>
            </section>
          ) : null}
          <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-xs text-muted"><MailCheck className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />Check your spam folder if an email doesn’t arrive.</div>
          <AuthLink to="/login" className="mt-2 gap-2 text-muted"><ArrowLeft className="size-3.5" aria-hidden="true" />Back to sign in</AuthLink>
        </>
      )}
    </>
  )
}
