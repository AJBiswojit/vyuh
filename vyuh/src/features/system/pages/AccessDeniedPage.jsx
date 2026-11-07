import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, ShieldAlert } from 'lucide-react'
import {} from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { homeRouteFor, roleLabel } from '@/shared/lib/roles.js'

export function AccessDeniedPage() {
  useDocumentTitle('Access denied')
  const user = useSessionStore((state) => state.user)
  const location = useLocation()
  const requested = typeof location.state?.from === 'string' ? location.state.from : 'that workspace'
  const home = homeRouteFor(user?.role ?? 'student')
  return (
    <section className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-start justify-center py-10">
      <span className="mb-6 grid size-14 place-items-center rounded-md border border-line bg-surface-raised"><ShieldAlert className="size-6 text-review-fg" strokeWidth={1.5} aria-hidden="true" /></span>
      <p className="rule-label">403 · Access denied</p>
      <h1 className="mt-3 text-2xl leading-tight tracking-tighter sm:text-3xl">A different seat.<br />A different workspace.</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">You’re signed in as <strong className="font-[560] text-heading">{user?.name ?? 'a member'}</strong> with the {roleLabel(user?.role ?? 'student').toLowerCase()} role. Your account doesn’t have access to <span className="break-all font-mono text-xs text-heading">{requested}</span>.</p>
      <Link to={home} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-sm bg-heading px-5 text-sm font-[560] text-on-inverse transition-opacity hover:opacity-90">Go to your {roleLabel(user?.role ?? 'student').toLowerCase()} workspace<ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" /></Link>
      <p className="mt-4 text-xs leading-relaxed text-muted">Need a different role? Ask your academic office. Changing the address won’t change your permissions.</p>
    </section>
  )
}
