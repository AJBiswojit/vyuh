import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Check, FlaskConical, RefreshCw, School } from 'lucide-react'
import { Button, Skeleton } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { AuthService } from '@/services/AuthService.js'
import { acceptInviteSchema } from '@/services/authSchemas.js'
import { homeRouteFor } from '@/shared/lib/roles.js'
import { isMockMode } from '@/shared/lib/services.js'
import { useZodForm } from '../hooks/useZodForm.js'
import { useCommitSession } from '../hooks/useSession.js'
import { AuthHeading } from '../components/AuthHeading.jsx'
import { AuthErrorNotice, AuthNotice } from '../components/AuthNotice.jsx'
import { PasswordField } from '../components/PasswordField.jsx'
import { AuthLink } from '../components/AuthLink.jsx'

export function JoinInvitePage() {
  useDocumentTitle('Accept your faculty invitation')
  const { inviteCode = '' } = useParams()
  const navigate = useNavigate()
  const commit = useCommitSession()
  const inviteQuery = useQuery({ queryKey: ['auth', 'invite', inviteCode], queryFn: () => AuthService.getInvite(inviteCode), retry: 1, staleTime: Infinity })
  const invite = inviteQuery.data
  const { registerForm, ...form } = useZodForm(acceptInviteSchema, { inviteCode, password: '', confirmPassword: '' })
  const mutation = useMutation({ mutationFn: AuthService.acceptInvite })
  const canAccept = invite?.status === 'active'

  /** @param {{ inviteCode: string, password: string, confirmPassword: string }} values */
  async function submit(values) {
    if (mutation.isPending || !canAccept) return
    try {
      const session = await mutation.mutateAsync(values)
      commit(session)
      navigate(homeRouteFor(session.user.role), { replace: true })
    } catch { /* The invitation or password error remains inline. */ }
  }

  return (
    <>
      <AuthHeading eyebrow="Faculty invitation" title="Your next chapter starts here." description="A place for your batches, your question bank, and the students you help move forward." />
      {inviteQuery.isPending ? <div role="status" aria-label="Loading invitation" className="space-y-4"><Skeleton.Block className="h-32" /><Skeleton.Block className="h-12" /><Skeleton.Block className="h-12" /></div> : inviteQuery.isError ? (
        <div className="space-y-4"><AuthErrorNotice error={inviteQuery.error} /><Button variant="secondary" onClick={() => inviteQuery.refetch()} icon={<RefreshCw strokeWidth={1.5} />}>Try again</Button><AuthLink to="/login" className="ml-5">Back to sign in</AuthLink></div>
      ) : (
        <>
          <section aria-label="Invitation details" className="mb-6 rounded-md border border-line bg-surface-sunken p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-sm border border-line bg-surface-raised"><School className="size-5 text-muted" strokeWidth={1.5} aria-hidden="true" /></span>
              <div className="min-w-0"><p className="text-xs font-[600] text-heading">{invite?.instituteName}</p><p className="mt-1 text-xs text-muted">Invites <strong className="font-[560] text-heading">{invite?.name}</strong> as faculty</p><p className="mt-1 break-all font-mono text-2xs text-faint">{invite?.email}</p></div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-2xs text-muted"><Check className="size-3.5" aria-hidden="true" />Invitation code: <span className="select-all font-mono">{inviteCode}</span></p>
          </section>
          {invite?.status === 'accepted' ? <AuthNotice title="Invitation already accepted" message="Your faculty account is ready. Sign in with the password you created." tone="success"><AuthLink to="/login" state={{ email: invite.email }}>Sign in to your workspace</AuthLink></AuthNotice> : invite?.status === 'expired' ? <AuthNotice title="Invitation expired" message="Ask your academic office to send a fresh invitation. No account has been created from this link." tone="warning"><AuthLink to="/login">Back to sign in</AuthLink></AuthNotice> : (
            <form ref={registerForm} noValidate aria-label="Accept faculty invitation" aria-busy={mutation.isPending} onSubmit={(event) => form.handleSubmit(event, submit)} className="space-y-5">
              <PasswordField id="password" name="password" label="Create your password" autoComplete="new-password" placeholder="Make this workspace yours" strength value={form.values.password} onChange={(event) => form.setValue('password', event.target.value)} onBlur={() => form.onBlur('password')} error={form.errors.password} disabled={mutation.isPending} required aria-required="true" />
              <PasswordField id="confirmPassword" name="confirmPassword" label="Confirm password" autoComplete="new-password" placeholder="Enter it once more" value={form.values.confirmPassword} onChange={(event) => form.setValue('confirmPassword', event.target.value)} onBlur={() => form.onBlur('confirmPassword')} error={form.errors.confirmPassword} disabled={mutation.isPending} required aria-required="true" />
              {mutation.error ? <AuthErrorNotice error={mutation.error} /> : null}
              <Button type="submit" variant="primary" size="lg" full loading={mutation.isPending} trailingIcon={<ArrowRight strokeWidth={1.5} />}>{mutation.isPending ? 'Preparing your workspace' : 'Accept invite & join'}</Button>
              <p className="text-xs leading-relaxed text-muted">By accepting, you join this institute’s faculty workspace. Your batches and teaching materials will be available after sign-in.</p>
            </form>
          )}
          {isMockMode ? <p className="mt-6 flex items-start gap-2 border-t border-line pt-4 text-xs leading-relaxed text-muted"><FlaskConical className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />Demo invitation. Accepting creates a local faculty session; no email is sent.</p> : null}
        </>
      )}
      <AuthLink to="/login" className="mt-5 text-muted">Back to sign in</AuthLink>
    </>
  )
}
