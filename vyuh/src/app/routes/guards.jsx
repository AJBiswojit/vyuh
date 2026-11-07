import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { Logo } from '@/shared/ui/Logo.jsx'
import { Skeleton } from '@/shared/ui/Skeleton.jsx'

/**
 * Route guards.
 *
 * `RequireAuth` waits for the boot restore before deciding, so a returning user
 * is never flashed the sign-in screen, and remembers where they were headed.
 *
 * `RequireRole` takes a role list and sends a mismatched seat to its own home
 * rather than to an error page: a student who follows a faculty link should land
 * somewhere useful, not somewhere scary.
 *
 * @typedef {Object} RequireAuthProps
 * @property {React.ReactNode} [children]
 *
 * @typedef {Object} RequireRoleProps
 * @property {import('../../contracts/user.js').Role[]} allow
 * @property {React.ReactNode} [children]
 * @property {string} [redirectTo]
 */

const HOME_FOR_ROLE = { student: '/app', faculty: '/faculty', admin: '/admin' }

/**
 * Quiet, layout-shaped wait. No spinner: the shell's rail width, a paper canvas
 * and a skeleton of the header, so the boot never looks like a blank screen.
 */
function BootScreen() {
  return (
    <div className="flex min-h-dvh bg-surface" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Restoring your session</span>
      <div className="hidden w-[var(--spacing-rail)] shrink-0 border-r border-hairline-on-ink bg-ink lg:block" aria-hidden="true">
        <div className="flex h-[var(--spacing-topbar)] items-center border-b border-hairline-on-ink px-4">
          <Logo tone="paper" size="sm" />
        </div>
        <div className="mx-2 mt-6 space-y-2">
          <Skeleton.Block className="h-11 opacity-20" />
          <Skeleton.Block className="h-11 opacity-20" />
          <Skeleton.Block className="h-11 opacity-20" />
        </div>
      </div>
      <div className="flex-1" aria-hidden="true">
        <div className="h-[var(--spacing-topbar)] border-b border-line" />
        <div className="mx-auto max-w-[78rem] px-8 py-8">
          <Skeleton.Line className="w-28" />
          <Skeleton.Block className="mt-4 h-9 w-2/5" />
          <Skeleton.Line className="mt-3 w-1/3" />
        </div>
      </div>
    </div>
  )
}

/**
 * Auth gate. Renders children (or an outlet) only for a signed-in seat.
 * @param {RequireAuthProps} props
 */
export function RequireAuth({ children }) {
  const status = useSessionStore((state) => state.status)
  const location = useLocation()

  if (status === 'boot') return <BootScreen />
  if (status === 'anonymous') {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />
  }
  return children ?? <Outlet />
}

/**
 * Role gate. Must sit inside RequireAuth.
 * @param {RequireRoleProps} props
 */
export function RequireRole({ allow, children, redirectTo }) {
  const user = useSessionStore((state) => state.user)

  if (!user) return <Navigate to="/sign-in" replace />
  if (!allow.includes(user.role)) {
    return <Navigate to={redirectTo ?? HOME_FOR_ROLE[user.role]} replace />
  }
  return children ?? <Outlet />
}

/**
 * Signed-in seats should not see the sign-in form again.
 */
export function GuestOnly() {
  const status = useSessionStore((state) => state.status)
  const user = useSessionStore((state) => state.user)

  if (status === 'boot') return <BootScreen />
  if (user) return <Navigate to={HOME_FOR_ROLE[user.role]} replace />
  return <Outlet />
}
