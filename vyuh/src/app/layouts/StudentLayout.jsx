import { Outlet, useLocation } from 'react-router-dom'
import { BookOpen, LayoutGrid, Notebook, SlidersHorizontal } from 'lucide-react'
import { WorkspaceLayout, Breadcrumb } from './WorkspaceLayout.jsx'
import { useSessionStore } from '@/shared/store/sessionStore.js'

/** Student navigation. Only routes that exist are listed. */
export const STUDENT_NAV = [
  { to: '/app', label: 'Overview', description: 'Your week, your next paper, your batch', icon: LayoutGrid },
  { to: '/app/papers', label: 'Papers', description: 'Scheduled, open and evaluated papers', icon: Notebook },
  { to: '/app/batch', label: 'Batch', description: 'Schedule, subjects and faculty', icon: BookOpen },
  { to: '/app/account', label: 'Account', description: 'Profile, preferences and session', icon: SlidersHorizontal },
]

const CRUMBS = {
  '/app': [{ label: 'Workspace' }],
  '/app/papers': [{ label: 'Workspace', to: '/app' }, { label: 'Papers' }],
  '/app/batch': [{ label: 'Workspace', to: '/app' }, { label: 'Batch' }],
  '/app/account': [{ label: 'Workspace', to: '/app' }, { label: 'Account' }],
}

/**
 * StudentLayout — the student's workspace. Wraps WorkspaceLayout with the
 * student navigation and the student's own seat description (roll number, not
 * job title), so the account chip says something true.
 *
 * @param {{ children?: React.ReactNode }} props
 */
export function StudentLayout({ children }) {
  const location = useLocation()
  const user = useSessionStore((state) => state.user)
  const crumbs = CRUMBS[location.pathname] ?? [{ label: 'Workspace', to: '/app' }, { label: 'Not found' }]

  return (
    <WorkspaceLayout
      items={STUDENT_NAV}
      workspaceLabel="Student workspace"
      breadcrumb={<Breadcrumb items={crumbs} />}
      seatMeta="VY-25-0187 · Prayas"
    >
      {children ?? <Outlet />}
    </WorkspaceLayout>
  )
}
