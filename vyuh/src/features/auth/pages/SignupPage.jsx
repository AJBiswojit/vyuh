import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Mail, RefreshCw, UserRound } from 'lucide-react'
import { Button, Input, Select, Skeleton } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { AuthService } from '@/services/AuthService.js'
import { signupSchema } from '@/services/authSchemas.js'
import { demoInstituteCode, demoInviteCode, isMockMode } from '@/shared/lib/services.js'
import { useZodForm } from '../hooks/useZodForm.js'
import { AuthHeading } from '../components/AuthHeading.jsx'
import { AuthErrorNotice } from '../components/AuthNotice.jsx'
import { PasswordField } from '../components/PasswordField.jsx'
import { ConsentFields } from '../components/ConsentFields.jsx'
import { AuthLink } from '../components/AuthLink.jsx'

const INITIAL = { name: '', email: '', instituteCode: '', batchId: '', password: '', guardianEmail: '', termsConsent: false, attendanceConsent: false }

export function SignupPage() {
  useDocumentTitle('Create a student account')
  const navigate = useNavigate()
  const { registerForm, ...form } = useZodForm(signupSchema, INITIAL)
  const options = useQuery({ queryKey: ['auth', 'signup-options'], queryFn: AuthService.getSignupOptions, staleTime: Infinity, retry: 1 })
  const mutation = useMutation({ mutationFn: AuthService.signup })
  const busy = mutation.isPending

  // Use the mutation lifecycle for pending/error state; the service call is not cached.
  /** @param {import('@/contracts/auth.js').SignupInput} values */
  async function onSubmit(values) {
    if (busy) return
    try {
      const challenge = await mutation.mutateAsync(values)
      navigate(`/verify-otp?challenge=${encodeURIComponent(challenge.id)}`, { replace: true })
    } catch { /* Inline service error below. */ }
  }

  return (
    <>
      <AuthHeading eyebrow="A fresh start · Student account" title="Make room for progress." description="Join your institute, find your batch, and make the next attempt count." />
      <div className="mb-6 flex items-center gap-3 text-2xs" aria-label="Signup progress">
        <span className="flex items-center gap-2 font-[600] text-heading"><span className="grid size-6 place-items-center rounded-full bg-heading font-mono text-on-inverse">1</span>Your details</span>
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        <span className="flex items-center gap-2 text-muted"><span className="grid size-6 place-items-center rounded-full border border-line-strong font-mono">2</span>Verify email</span>
      </div>
      <form ref={registerForm} noValidate aria-label="Create student account" aria-busy={busy} onSubmit={(event) => form.handleSubmit(event, onSubmit)} className="flex flex-col gap-5">
        <Input id="name" name="name" label="Full name" autoComplete="name" placeholder="As on your enrolment slip" icon={<UserRound strokeWidth={1.5} />} className="min-h-12 text-sm" value={form.values.name} onChange={(event) => form.setValue('name', event.target.value)} onBlur={() => form.onBlur('name')} error={form.errors.name} disabled={busy} required aria-required="true" />
        <Input id="email" name="email" label="Email address" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" icon={<Mail strokeWidth={1.5} />} className="min-h-12 text-sm" hint="We’ll send a six-digit code to verify this address." value={form.values.email} onChange={(event) => { form.setValue('email', event.target.value); mutation.reset() }} onBlur={() => form.onBlur('email')} error={form.errors.email} disabled={busy} required aria-required="true" />
        <Input id="instituteCode" name="instituteCode" label="Institute code" autoComplete="off" autoCapitalize="characters" placeholder="Enter your institute code" className="min-h-12 font-mono text-sm uppercase" hint={isMockMode ? `Demo institute: Vidyut Academy · Use ${demoInstituteCode}` : 'Find this on your enrolment slip or ask the academic office.'} value={form.values.instituteCode} onChange={(event) => form.setValue('instituteCode', event.target.value)} onBlur={() => form.onBlur('instituteCode')} error={form.errors.instituteCode} disabled={busy} required aria-required="true" />
        {options.isPending ? <div role="status" aria-label="Loading batches"><Skeleton.Line className="mb-2 w-16" /><Skeleton.Block className="h-12" /></div> : options.isError ? (
          <AuthErrorNotice error={options.error}><Button variant="ghost" size="sm" icon={<RefreshCw strokeWidth={1.5} />} onClick={() => options.refetch()}>Reload batches</Button></AuthErrorNotice>
        ) : (
          <Select id="batchId" name="batchId" label="Your batch" placeholder="Choose a batch" className="[&_select]:min-h-12 [&_select]:text-sm" options={(options.data?.batches ?? []).map((batch) => ({ value: batch.id, label: `${batch.name} · ${batch.scheduleLabel}` }))} hint="Your batch connects your classes, papers, and attendance." value={form.values.batchId} onChange={(event) => form.setValue('batchId', event.target.value)} onBlur={() => form.onBlur('batchId')} error={form.errors.batchId} disabled={busy || options.isError} required aria-required="true" />
        )}
        <PasswordField id="password" name="password" label="Create a password" autoComplete="new-password" placeholder="Make it memorable. Make it yours." strength value={form.values.password} onChange={(event) => form.setValue('password', event.target.value)} onBlur={() => form.onBlur('password')} error={form.errors.password} disabled={busy} required aria-required="true" />
        <Input id="guardianEmail" name="guardianEmail" label="Guardian email (optional)" type="email" autoComplete="off" inputMode="email" placeholder="guardian@example.com" className="min-h-12 text-sm" hint="Only for attendance summaries. Leave blank to keep updates with you." value={form.values.guardianEmail} onChange={(event) => form.setValue('guardianEmail', event.target.value)} onBlur={() => form.onBlur('guardianEmail')} error={form.errors.guardianEmail} disabled={busy} />
        <ConsentFields values={form.values} errors={form.errors} setValue={form.setValue} onBlur={form.onBlur} disabled={busy} />
        {mutation.error ? <AuthErrorNotice error={mutation.error}><AuthLink to="/login">Go to sign in</AuthLink></AuthErrorNotice> : null}
        <Button type="submit" variant="primary" size="lg" full loading={busy} disabled={options.isPending || options.isError} trailingIcon={<ArrowRight strokeWidth={1.5} />}>{busy ? 'Creating your account' : 'Create account & verify email'}</Button>
      </form>
      <p className="mt-5 text-xs text-muted">Already part of Vyuh? <AuthLink to="/login">Sign in</AuthLink></p>
      {isMockMode ? <p className="mt-1 text-xs leading-relaxed text-muted">Faculty? <AuthLink to={`/join/${demoInviteCode}`}>Try a demo invitation</AuthLink></p> : <p className="mt-1 text-xs leading-relaxed text-muted">Joining as faculty? Use the invitation link from your academic office.</p>}
    </>
  )
}
