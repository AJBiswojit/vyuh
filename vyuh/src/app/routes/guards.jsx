import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { homeRouteFor, safeReturnPath } from '@/shared/lib/roles.js'
import { Logo, Skeleton } from '@/shared/ui'

/**
 * RequireAuth preserves pathname + query + hash in router history state, so a
 * reload of the login page does not lose a deep link. RequireRole deliberately
 * shows an access-denied page in the user's own layout, never another role's UI.
 * @param {{ children?: React.ReactNode }} props
 */
export function RequireAuth({ children }) {
  const status = useSessionStore((state) => state.status)
  const location = useLocation()
  if (status === 'boot') return <BootScreen />
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />
  return children ?? <Outlet />
}

/** @param {{ allow: import('../../contracts/user.js').Role[], children?: React.ReactNode, redirectTo?: string }} props */
export function RequireRole({ allow, children, redirectTo }) {
  const user = useSessionStore((state) => state.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />
  if (!allow.includes(user.role)) return <Navigate to={redirectTo ?? '/access-denied'} replace state={{ from: location.pathname + location.search + location.hash }} />
  return children ?? <Outlet />
}

/** Login/signup are guest-only; recovery and invitation pages remain reachable. */
export function GuestOnly() {
  const status = useSessionStore((state) => state.status)
  const user = useSessionStore((state) => state.user)
  const location = useLocation()
  if (status === 'boot') return <BootScreen />
  if (user) return <Navigate to={safeReturnPath(location.state?.from) ?? homeRouteFor(user.role)} replace />
  return <Outlet />
}

function BootScreen() {
  return (
    <div className="flex min-h-dvh bg-surface" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Restoring your session</span>
      <div className="hidden w-[var(--spacing-rail)] shrink-0 border-r border-hairline-on-ink bg-ink lg:block" aria-hidden="true">
        <div className="flex h-[var(--spacing-topbar)] items-center border-b border-hairline-on-ink px-4"><Logo tone="paper" size="sm" /></div>
        <div className="mx-2 mt-6 space-y-2"><Skeleton.Block className="h-11 opacity-20" /><Skeleton.Block className="h-11 opacity-20" /><Skeleton.Block className="h-11 opacity-20" /></div>
      </div>
      <div className="flex-1" aria-hidden="true"><div className="h-[var(--spacing-topbar)] border-b border-line" /><div className="mx-auto max-w-[78rem] px-8 py-8"><Skeleton.Line className="w-28" /><Skeleton.Block className="mt-4 h-9 w-2/5" /><Skeleton.Line className="mt-3 w-1/3" /></div></div>
    </div>
  )
}
