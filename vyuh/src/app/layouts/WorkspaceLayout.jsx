import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PanelLeftClose, PanelLeftOpen, Menu, X, ChevronRight, LogOut } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'
import { durations, easeEntrance } from '@/shared/lib/motion.js'
import { Logo } from '@/shared/ui/Logo.jsx'
import { ThemeToggle } from '@/shared/ui/ThemeToggle.jsx'
import { IconButton } from '@/shared/ui/IconButton.jsx'
import { useUiStore } from '@/shared/store/uiStore.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { homeRouteFor, roleLabel } from '@/shared/lib/roles.js'
import { useLogout } from '@/features/auth/hooks/useSession.js'

/**
 * WorkspaceLayout — the shell StudentLayout, FacultyLayout and AdminLayout all
 * build on. One shell, three navigations: a student and the academic office
 * learn the same map, which matters when a student is also a hall monitor and
 * a faculty member also has an office login.
 *
 * Composition, top to bottom: a dark structural rail (Ink, 60%), a sticky
 * hairline bar holding the breadcrumb and the account, and one <main> that owns
 * the scroll. The rail is Ink in both themes because it is structure, not
 * surface — dark mode swaps the canvas, not the rail.
 *
 * @param {Object} props
 * @param {Array<{ to: string, label: string, description: string, icon: React.ComponentType<{ className?: string, strokeWidth?: number }> }>} props.items
 * @param {string} props.workspaceLabel
 * @param {React.ReactNode} [props.breadcrumb]
 * @param {string} [props.seatMeta]        Roll number or staff role, for the account chip.
 * @param {React.ReactNode} [props.children]
 */
export function WorkspaceLayout({ items, workspaceLabel, breadcrumb, seatMeta, children }) {
  const railCollapsed = useUiStore((state) => state.railCollapsed)
  const toggleRail = useUiStore((state) => state.toggleRail)
  const mobileNavOpen = useUiStore((state) => state.mobileNavOpen)
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen)
  const user = useSessionStore((state) => state.user)
  const location = useLocation()
  const [announce, setAnnounce] = useState('')
  const { logout, isPending: loggingOut } = useLogout()
  const home = homeRouteFor(user?.role ?? 'student')

  // A route change must move a keyboard user into the new page, not leave them
  // in the rail. Focus the <main> and announce the new h1.
  useEffect(() => {
    setAnnounce(document.querySelector('main h1')?.textContent ?? 'Page loaded')
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [location.pathname])

  return (
    <div className="flex min-h-dvh bg-surface">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* ── Rail ──────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 transition-[width] duration-[325ms] ease-[cubic-bezier(0.16,1,0.3,1)] lg:block',
          railCollapsed ? 'w-[var(--spacing-rail-collapsed)]' : 'w-[var(--spacing-rail)]',
        )}
        aria-hidden={mobileNavOpen || undefined}
      >
        <div className="flex h-full flex-col border-r border-hairline-on-ink bg-ink text-paper">
          <div className={cn('flex h-[var(--spacing-topbar)] items-center border-b border-hairline-on-ink', railCollapsed ? 'justify-center px-2' : 'justify-between px-4')}>
            <Logo to={home} tone="paper" size="sm" withName={!railCollapsed} />
            {railCollapsed ? null : (
              <IconButton
                icon={<PanelLeftClose strokeWidth={1.5} />}
                label="Collapse navigation"
                aria-expanded
                onClick={toggleRail}
                className="hidden text-(--color-on-ink-faint) hover:bg-[var(--color-on-ink-wash)] hover:text-paper lg:inline-flex"
              />
            )}
          </div>

          {railCollapsed ? (
            <div className="hidden justify-center border-b border-hairline-on-ink py-1.5 lg:flex">
              <IconButton
                icon={<PanelLeftOpen strokeWidth={1.5} />}
                label="Expand navigation"
                aria-expanded={false}
                onClick={toggleRail}
                className="text-(--color-on-ink-faint) hover:bg-[var(--color-on-ink-wash)] hover:text-paper"
              />
            </div>
          ) : null}

          <nav aria-label={workspaceLabel} className="flex-1 overflow-y-auto px-2 py-4">
            {railCollapsed ? (
              <span className="mx-auto mb-3 block h-px w-6 bg-hairline-on-ink-strong" aria-hidden="true" />
            ) : (
              <p className="mb-2 px-2 font-mono text-2xs uppercase tracking-widest text-(--color-on-ink-label)">
                {workspaceLabel}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === home}
                    title={railCollapsed ? item.label : undefined}
                    aria-label={railCollapsed ? `${item.label} — ${item.description}` : undefined}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex min-h-[var(--spacing-touch)] items-center gap-3 rounded-xs px-2 text-xs transition-colors',
                        railCollapsed && 'justify-center px-0',
                        isActive
                          ? 'bg-[var(--color-on-ink-wash)] font-[560] text-paper'
                          : 'text-(--color-on-ink) hover:bg-[var(--color-on-ink-wash-hover)] hover:text-paper',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive ? (
                          <motion.span
                            layoutId="rail-active"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="absolute -left-2 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-full bg-ember"
                            aria-hidden="true"
                          />
                        ) : null}
                        <item.icon className="size-[1.1rem] shrink-0" strokeWidth={1.5} />
                        {railCollapsed ? null : <span className="truncate">{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className={cn('border-t border-hairline-on-ink py-3', railCollapsed ? 'px-2' : 'px-4')}>
            {railCollapsed ? (
              <p className="text-center font-mono text-2xs tabular-nums text-(--color-on-ink-label)">S2</p>
            ) : (
              <>
                <p className="font-mono text-2xs uppercase tracking-widest text-(--color-on-ink-label)">
                  Current term
                </p>
                <p className="mt-1 font-mono text-2xs tabular-nums text-(--color-on-ink)">
                  2026–27 · Session 2
                </p>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Column ────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col" aria-hidden={mobileNavOpen || undefined}>
        <header className="sticky top-0 z-30 flex min-h-[var(--spacing-topbar)] items-center gap-3 border-b border-line bg-[color-mix(in_oklab,var(--color-surface)_92%,transparent)] px-4 backdrop-blur-[2px] lg:px-6">
          <IconButton
            className="lg:hidden"
            icon={<Menu strokeWidth={1.5} />}
            label="Open navigation"
            onClick={() => setMobileNavOpen(true)}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-navigation"
          />
          <div className="min-w-0 flex-1">{breadcrumb}</div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle compact />
            <IconButton icon={<LogOut strokeWidth={1.5} />} label={loggingOut ? 'Signing out' : 'Sign out'} onClick={() => logout()} disabled={loggingOut} />
            {user ? (
              <div className="flex items-center gap-2 rounded-sm border border-transparent py-1 pl-1.5">
                <span className="grid size-8 place-items-center rounded-xs bg-ink text-2xs font-[600] tracking-wide text-paper">
                  {user.initials}
                </span>
                <span className="hidden leading-tight sm:block">
                  <span className="block max-w-[10rem] truncate text-2xs font-[560] text-heading">{user.name}</span>
                  <span className="block font-mono text-2xs tabular-nums text-faint">{seatMeta ?? roleLabel(user.role)}</span>
                </span>
              </div>
            ) : null}
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: durations.standard, ease: easeEntrance }}
            className="mx-auto w-full max-w-[78rem]"
          >
            {children ?? <Outlet />}
          </motion.div>
        </main>

        <footer className="border-t border-line px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-[78rem] flex-wrap items-center justify-between gap-2">
            <p className="text-2xs text-faint">Vyuh · Vidyut Academy, Bhubaneswar · term 2026–27 Session 2</p>
            <p className="font-mono text-2xs tabular-nums text-faint">Marks and ranks publish within 15 minutes of submission</p>
          </div>
        </footer>
      </div>

      {/* ── Mobile sheet ──────────────────────────────────────────────── */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" id="mobile-navigation">
          <div
            className="absolute inset-0 bg-[var(--color-scrim)]"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col bg-ink text-paper shadow-[var(--shadow-overlay)]"
          >
            <div className="flex h-[var(--spacing-topbar)] items-center justify-between border-b border-hairline-on-ink px-4">
              <Logo to={home} tone="paper" size="sm" />
              <IconButton
                icon={<X strokeWidth={1.5} />}
                label="Close navigation"
                onClick={() => setMobileNavOpen(false)}
                className="text-(--color-on-ink)"
              />
            </div>
            <nav aria-label={workspaceLabel} className="flex-1 overflow-y-auto px-2 py-4">
              <ul className="flex flex-col gap-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === home}
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-12 items-center gap-3 rounded-xs px-3 text-xs',
                          isActive
                            ? 'bg-[var(--color-on-ink-wash)] font-[560] text-paper'
                            : 'text-(--color-on-ink)',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className="size-[1.1rem] shrink-0" strokeWidth={1.5} />
                          <span className="flex-1">{item.label}</span>
                          {isActive ? <span className="size-1.5 rounded-full bg-ember" aria-hidden="true" /> : null}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-hairline-on-ink px-4 py-4">
              <p className="font-mono text-2xs uppercase tracking-widest text-(--color-on-ink-label)">
                Current term
              </p>
              <p className="mt-1 font-mono text-2xs tabular-nums text-(--color-on-ink)">
                2026–27 · Session 2
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  )
}

/**
 * Shared breadcrumb. The final crumb is the current page and is not a link;
 * earlier crumbs collapse below `sm` so a phone shows one line.
 * @param {{ items: Array<{ label: string, to?: string }> }} props
 */
export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 overflow-hidden">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className={last ? 'min-w-0' : 'hidden shrink-0 items-center gap-1.5 sm:flex'}>
              {index > 0 ? (
                <ChevronRight className="hidden size-3.5 shrink-0 text-faint sm:block" strokeWidth={1.5} aria-hidden="true" />
              ) : null}
              {last || !item.to ? (
                <span aria-current={last ? 'page' : undefined} className="block truncate text-2xs font-[560] tracking-tight text-heading">
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="block truncate text-2xs text-muted transition-colors hover:text-heading">
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * Page opener shared by every screen: mono eyebrow, h1 in Fraunces, at most two
 * lines of supporting text, and an actions slot that may hold the view's single
 * primary control.
 *
 * @param {Object} props
 * @param {string} [props.eyebrow]
 * @param {string} props.title
 * @param {React.ReactNode} [props.description]
 * @param {React.ReactNode} [props.actions]
 * @param {React.ReactNode} [props.meta]
 * @param {string} [props.className]
 */
export function PageHeader({ eyebrow, title, description, actions, meta, className }) {
  return (
    <header className={cn('mb-6 border-b border-line pb-5 lg:mb-8', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="rule-label mb-2">{eyebrow}</p> : null}
          <h1 className="text-xl leading-[1.08] tracking-tighter lg:text-2xl">{title}</h1>
          {description ? <p className="mt-2.5 max-w-2xl text-xs text-muted">{description}</p> : null}
          {meta ? <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
