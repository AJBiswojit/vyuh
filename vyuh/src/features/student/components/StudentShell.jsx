import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, Check, ChevronRight, LogOut, Menu, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'
import { Logo } from '@/shared/ui/Logo.jsx'
import { IconButton } from '@/shared/ui/IconButton.jsx'
import { Button } from '@/shared/ui/Button.jsx'
import { Kbd } from '@/shared/ui/Kbd.jsx'
import { Sheet } from '@/shared/ui/Sheet.jsx'
import { ThemeToggle } from '@/shared/ui/ThemeToggle.jsx'
import { useUiStore } from '@/shared/store/uiStore.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { useLogout } from '@/features/auth/hooks/useSession.js'
import { formatRelative } from '@/shared/lib/format.js'
import { Popover } from './Popover.jsx'
import { CommandPalette } from './CommandPalette.jsx'
import { useMarkNotificationsRead, useNotifications, useStudentId } from '../hooks/useStudentWorkspace.js'

/**
 * Student app shell. Desktop has a collapsible rail; tablet uses a drawer;
 * mobile uses a five-slot bottom navigation with a More sheet. The top bar owns
 * search, notifications and the profile menu at every breakpoint.
 * @param {{ items: Array<{ to: string, label: string, description: string, icon: React.ComponentType<{ className?: string, strokeWidth?: number }> }>, workspaceLabel: string, breadcrumb: Array<{ label: string, to?: string }>, seatMeta?: string, children?: React.ReactNode }} props
 */
export function StudentShell({ items, workspaceLabel, breadcrumb, seatMeta, children }) {
  const location = useLocation()
  const user = useSessionStore((state) => state.user)
  const studentId = useStudentId()
  const railCollapsed = useUiStore((state) => state.railCollapsed)
  const toggleRail = useUiStore((state) => state.toggleRail)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { logout, isPending } = useLogout()
  const notifications = useNotifications(studentId)
  const markRead = useMarkNotificationsRead(studentId)
  const unread = (notifications.data ?? []).filter((item) => !item.read).length
  const closePalette = useCallback(() => setPaletteOpen(false), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const closeMore = useCallback(() => setMoreOpen(false), [])
  const closeNotifications = useCallback(() => setNotificationsOpen(false), [])
  const closeProfile = useCallback(() => setProfileOpen(false), [])

  const primary = items.slice(0, 4)
  const more = items.slice(4)

  useEffect(() => {
    const target = /** @type {HTMLElement | null} */ (document.querySelector('main h1') ?? document.getElementById('main-content'))
    target?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    /** @param {KeyboardEvent} event */
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /** @param {typeof items} navItems @param {'rail'|'drawer'|'sheet'} variant */
  function navList(navItems, variant) {
    return (
      <ul className={cn('flex flex-col gap-0.5', variant === 'sheet' && 'gap-1')}>
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.to === '/student'}
              onClick={variant === 'rail' ? undefined : closeDrawer}
              title={variant === 'rail' && railCollapsed ? item.label : undefined}
              aria-label={variant === 'rail' && railCollapsed ? item.label : undefined}
              className={({ isActive }) => cn(
                'group flex min-h-[var(--spacing-touch)] items-center gap-3 rounded-xs px-2 text-xs transition-colors',
                variant === 'rail' && railCollapsed && 'justify-center px-0',
                variant === 'sheet' && 'min-h-12 rounded-sm border border-line px-3',
                isActive
                  ? variant === 'sheet' ? 'border-line-strong bg-surface-sunken font-[560] text-heading' : variant === 'drawer' ? 'bg-surface-sunken font-[560] text-heading' : 'bg-on-ink-wash font-[560] text-paper'
                  : variant === 'rail' ? 'text-on-ink hover:bg-on-ink-wash-hover hover:text-paper' : 'text-body hover:bg-surface-sunken hover:text-heading',
              )}
            >
              <item.icon className="size-[1.1rem] shrink-0" strokeWidth={1.5} />
              {variant === 'rail' && railCollapsed ? null : <span className="truncate">{item.label}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="flex min-h-dvh bg-surface">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <aside className={cn('sticky top-0 hidden h-dvh shrink-0 transition-[width] duration-[325ms] lg:block', railCollapsed ? 'w-[var(--spacing-rail-collapsed)]' : 'w-[var(--spacing-rail)]')}>
        <div className="flex h-full flex-col border-r border-hairline-on-ink bg-ink text-paper">
          <div className={cn('flex h-[var(--spacing-topbar)] items-center border-b border-hairline-on-ink', railCollapsed ? 'justify-center px-2' : 'justify-between px-4')}>
            <Logo to="/student" tone="paper" size="sm" withName={!railCollapsed} />
            {!railCollapsed ? <IconButton icon={<PanelLeftClose strokeWidth={1.5} />} label="Collapse sidebar" aria-expanded onClick={toggleRail} className="hidden text-on-ink-faint hover:bg-on-ink-wash hover:text-paper lg:inline-flex" /> : null}
          </div>
          {railCollapsed ? <div className="flex justify-center border-b border-hairline-on-ink py-1.5"><IconButton icon={<PanelLeftOpen strokeWidth={1.5} />} label="Expand sidebar" aria-expanded={false} onClick={toggleRail} className="text-on-ink-faint hover:bg-on-ink-wash hover:text-paper" /></div> : null}
          <nav aria-label={workspaceLabel} className="flex-1 overflow-y-auto px-2 py-4">
            {!railCollapsed ? <p className="mb-2 px-2 font-mono text-2xs uppercase tracking-widest text-on-ink-label">{workspaceLabel}</p> : null}
            {navList(items, 'rail')}
          </nav>
          <div className="border-t border-hairline-on-ink px-4 py-3">
            {railCollapsed ? <p className="text-center font-mono text-2xs text-on-ink-label">S2</p> : <p className="font-mono text-2xs text-on-ink-muted">2026–27 · Session 2</p>}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-[var(--spacing-topbar)] items-center gap-2 border-b border-line bg-[color-mix(in_oklab,var(--color-surface)_92%,transparent)] px-4 backdrop-blur-[2px] lg:px-6">
          <IconButton className="lg:hidden" icon={<Menu strokeWidth={1.5} />} label="Open navigation drawer" onClick={() => setDrawerOpen(true)} aria-expanded={drawerOpen} />
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 overflow-hidden">
              {breadcrumb.map((crumb, index) => (
                <li key={crumb.label} className={cn('flex min-w-0 items-center gap-1.5', index < breadcrumb.length - 1 && 'hidden sm:flex')}>
                  {index > 0 ? <ChevronRight className="size-3.5 shrink-0 text-faint" strokeWidth={1.5} aria-hidden="true" /> : null}
                  {crumb.to ? <Link to={crumb.to} className="truncate text-2xs text-muted hover:text-heading">{crumb.label}</Link> : <span aria-current="page" className="truncate text-2xs font-[560] text-heading">{crumb.label}</span>}
                </li>
              ))}
            </ol>
          </nav>

          <button type="button" onClick={() => setPaletteOpen(true)} aria-label="Search ⌘ K pages and exams" aria-keyshortcuts="Meta+K Control+K"
            className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line bg-surface-raised px-3 text-xs text-muted transition-colors hover:border-line-strong hover:text-heading">
            <Search className="size-4" strokeWidth={1.5} aria-hidden="true" />
            <span className="hidden lg:inline">Search</span>
            <span className="hidden sm:inline-flex" aria-hidden="true"><Kbd keys={['⌘', 'K']} /></span>
          </button>

          <Popover open={notificationsOpen} onClose={closeNotifications} label="Notifications"
            trigger={<IconButton icon={<Bell strokeWidth={1.5} />} label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={notificationsOpen} aria-haspopup="dialog" onClick={() => { setNotificationsOpen((v) => !v); setProfileOpen(false) }} className={cn(unread ? 'text-heading' : null)} />}>
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-xs font-[560] text-heading">Notifications</p>
              <Button variant="ghost" size="sm" icon={<Check strokeWidth={1.5} />} loading={markRead.isPending} onClick={() => markRead.mutate()} disabled={unread === 0}>Mark all read</Button>
            </div>
            <ul className="max-h-80 divide-y divide-line overflow-y-auto">
              {(notifications.data ?? []).length === 0 ? <li className="px-4 py-6 text-xs text-muted">No notifications yet.</li> : (notifications.data ?? []).map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <p className="flex items-center gap-2 text-xs font-[560] text-heading">{!item.read ? <span className="size-1.5 rounded-full bg-ember" role="img" aria-label="Unread" /> : null}{item.title}</p>
                  <p className="mt-1 text-2xs leading-relaxed text-muted">{item.body}</p>
                  <p className="mt-1 font-mono text-2xs text-faint">{formatRelative(item.createdAt)}</p>
                </li>
              ))}
            </ul>
          </Popover>

          <Popover open={profileOpen} onClose={closeProfile} label="Profile menu"
            trigger={<button type="button" onClick={() => { setProfileOpen((v) => !v); setNotificationsOpen(false) }} aria-expanded={profileOpen} aria-haspopup="dialog" aria-label={`Profile menu, ${user?.initials ?? 'ST'}`} className="inline-flex size-11 items-center justify-center rounded-sm border border-line bg-surface-raised font-mono text-2xs font-[560] text-heading hover:border-line-strong"><span aria-hidden="true">{user?.initials ?? 'ST'}</span></button>}>
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-xs font-[560] text-heading">{user?.name}</p>
              <p className="truncate text-2xs text-muted">{seatMeta}</p>
            </div>
            <nav aria-label="Profile" className="p-2">
              {[{ to: '/student/profile', label: 'Profile and preferences' }, { to: '/student/batch', label: 'Your batch' }, { to: '/accessibility', label: 'Accessibility' }].map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setProfileOpen(false)} className="flex min-h-11 items-center rounded-sm px-3 text-xs text-body hover:bg-surface-sunken hover:text-heading">{item.label}</Link>
              ))}
              <button type="button" onClick={() => { setProfileOpen(false); logout() }} disabled={isPending} className="flex min-h-11 w-full items-center gap-2 rounded-sm px-3 text-left text-xs text-danger-fg hover:bg-surface-sunken"><LogOut className="size-4" strokeWidth={1.5} aria-hidden="true" />Sign out</button>
            </nav>
          </Popover>
          <span className="hidden sm:inline-flex"><ThemeToggle compact /></span>
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[78rem] flex-1 px-4 py-6 outline-none pb-24 sm:px-6 md:pb-8 lg:px-8 lg:py-8">
          {children ?? <Outlet />}
        </main>
      </div>

      <nav aria-label="Student primary" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface-raised pb-[env(safe-area-inset-bottom)] md:hidden">
        {primary.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/student'} className={({ isActive }) => cn('flex min-h-14 flex-col items-center justify-center gap-1 text-2xs', isActive ? 'font-[560] text-heading' : 'text-muted')}>
            {({ isActive }) => (<><item.icon className="size-4" strokeWidth={1.5} aria-hidden="true" /><span className="max-w-full truncate px-1">{item.label === 'Live classes' ? 'Live' : item.label}</span>{isActive ? <span className="h-0.5 w-6 rounded-full bg-ember" aria-hidden="true" /> : null}</>)}
          </NavLink>
        ))}
        <button type="button" onClick={() => setMoreOpen(true)} aria-expanded={moreOpen} aria-haspopup="dialog" className="flex min-h-14 flex-col items-center justify-center gap-1 text-2xs text-muted">
          <MoreHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" /><span>More</span>
        </button>
      </nav>

      <Sheet open={drawerOpen} onClose={closeDrawer} title={workspaceLabel} side="left" size="sm">
        <nav aria-label="Student navigation drawer">{navList(items, 'drawer')}</nav>
      </Sheet>
      <Sheet open={moreOpen} onClose={closeMore} title="More" description="Performance, doubts, attendance, rooms and profile." side="bottom">
        <nav aria-label="Student more navigation">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {more.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} onClick={closeMore} className={({ isActive }) => cn('flex min-h-14 items-center gap-3 rounded-sm border px-3 text-xs', isActive ? 'border-line-strong bg-surface-sunken font-[560] text-heading' : 'border-line text-body')}>
                  <item.icon className="size-4 shrink-0" strokeWidth={1.5} /><span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </Sheet>
      <CommandPalette key={paletteOpen ? 'open' : 'closed'} open={paletteOpen} onClose={closePalette} pages={items} />
    </div>
  )
}
