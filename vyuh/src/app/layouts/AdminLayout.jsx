import { Outlet, useLocation } from 'react-router-dom'
import {
  FileBarChart, GraduationCap, MessageSquareWarning, Palette, School,
  ScrollText, ShieldAlert, SlidersHorizontal, Stamp, Users,
} from 'lucide-react'
import { WorkspaceLayout, Breadcrumb } from './WorkspaceLayout.jsx'

/**
 * Academic office navigation. Ten destinations and the account: people, batches,
 * the paper gate, the rules, integrity, reporting, moderation, the record and
 * identity. The order is the order a working day visits them.
 */
export const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', description: 'Key figures, the term calendar and what needs a decision', icon: School },
  { to: '/admin/users', label: 'Users', description: 'Every account, with filters and CSV import', icon: Users },
  { to: '/admin/batches', label: 'Batches', description: 'Rosters, subjects and faculty allocation', icon: GraduationCap },
  { to: '/admin/approvals', label: 'Approvals', description: 'Papers waiting on the office', icon: Stamp },
  { to: '/admin/policies', label: 'Policies', description: 'Thresholds, proctoring, retention and consent', icon: SlidersHorizontal },
  { to: '/admin/integrity', label: 'Integrity', description: 'Flagged sittings, evidence and decisions', icon: ShieldAlert },
  { to: '/admin/reports', label: 'Reports', description: 'Attendance, results and engagement exports', icon: FileBarChart },
  { to: '/admin/moderation', label: 'Moderation', description: 'Reported doubts and chat messages', icon: MessageSquareWarning },
  { to: '/admin/audit', label: 'Audit log', description: 'Who did what, and when', icon: ScrollText },
  { to: '/admin/settings', label: 'Settings', description: 'Institute name, mark and the locked palette', icon: Palette },
  { to: '/admin/account', label: 'Account', description: 'Profile, preferences and session', icon: SlidersHorizontal },
]

const CRUMB_RULES = [
  [/^\/admin\/users\/import$/, [{ label: 'Academic office', to: '/admin' }, { label: 'Users', to: '/admin/users' }, { label: 'Import' }]],
  [/^\/admin\/users$/, [{ label: 'Academic office', to: '/admin' }, { label: 'Users' }]],
  [/^\/admin\/batches\/[^/]+$/, [{ label: 'Academic office', to: '/admin' }, { label: 'Batches', to: '/admin/batches' }, { label: 'Batch detail' }]],
  [/^\/admin\/batches$/, [{ label: 'Academic office', to: '/admin' }, { label: 'Batches' }]],
  [/^\/admin\/approvals$/, [{ label: 'Academic office', to: '/admin' }, { label: 'Approvals' }]],
  [/^\/admin\/policies$/, [{ label: 'Academic office', to: '/admin' }, { label: 'Policies' }]],
  [/^\/admin\/integrity$/, [{ label: 'Academic office', to: '/admin' }, { label: 'Integrity' }]],
  [/^\/admin\/reports$/, [{ label: 'Academic office', to: '/admin' }, { label: 'Reports' }]],
  [/^\/admin\/moderation$/, [{ label: 'Academic office', to: '/admin' }, { label: 'Moderation' }]],
  [/^\/admin\/audit$/, [{ label: 'Academic office', to: '/admin' }, { label: 'Audit log' }]],
  [/^\/admin\/settings$/, [{ label: 'Academic office', to: '/admin' }, { label: 'Settings' }]],
  [/^\/admin\/account$/, [{ label: 'Academic office', to: '/admin' }, { label: 'Account' }]],
]

/**
 * @param {string} pathname
 * @returns {Array<{ label: string, to?: string }>}
 */
export function adminCrumbs(pathname) {
  if (pathname === '/admin') return [{ label: 'Academic office' }]
  for (const [pattern, crumbs] of CRUMB_RULES) {
    if (pattern.test(pathname)) return crumbs
  }
  return [{ label: 'Academic office', to: '/admin' }, { label: 'Not found' }]
}

/**
 * AdminLayout — the institution console. The rail label says "Academic office"
 * rather than "Admin", which is what the institute calls the desk and what
 * appears on every circular it sends.
 *
 * @param {{ children?: React.ReactNode }} props
 */
export function AdminLayout({ children }) {
  const location = useLocation()

  return (
    <WorkspaceLayout
      items={ADMIN_NAV}
      workspaceLabel="Academic office"
      breadcrumb={<Breadcrumb items={adminCrumbs(location.pathname)} />}
      seatMeta="Academic office · Jaydev Vihar"
    >
      {children ?? <Outlet />}
    </WorkspaceLayout>
  )
}
