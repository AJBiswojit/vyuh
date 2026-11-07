import { Outlet, useLocation } from 'react-router-dom'
import { GraduationCap, ReceiptIndianRupee, School, SlidersHorizontal } from 'lucide-react'
import { WorkspaceLayout, Breadcrumb } from './WorkspaceLayout.jsx'

/** Academic office navigation. */
export const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', description: 'Institute summary for the term', icon: School },
  { to: '/admin/batches', label: 'Batches', description: 'Every active and archived batch', icon: GraduationCap },
  { to: '/admin/fees', label: 'Fees', description: 'Enrolment and instalment records', icon: ReceiptIndianRupee },
  { to: '/admin/account', label: 'Account', description: 'Profile, preferences and session', icon: SlidersHorizontal },
]

const CRUMBS = {
  '/admin': [{ label: 'Academic office' }],
  '/admin/batches': [{ label: 'Academic office', to: '/admin' }, { label: 'Batches' }],
  '/admin/fees': [{ label: 'Academic office', to: '/admin' }, { label: 'Fees' }],
  '/admin/account': [{ label: 'Academic office', to: '/admin' }, { label: 'Account' }],
}

/**
 * AdminLayout — the academic office. The rail label says "Academic office"
 * rather than "Admin", which is what the institute calls the desk and what
 * appears on every circular it sends.
 *
 * @param {{ children?: React.ReactNode }} props
 */
export function AdminLayout({ children }) {
  const location = useLocation()
  const crumbs = CRUMBS[location.pathname] ?? [{ label: 'Academic office', to: '/admin' }, { label: 'Not found' }]

  return (
    <WorkspaceLayout
      items={ADMIN_NAV}
      workspaceLabel="Academic office"
      breadcrumb={<Breadcrumb items={crumbs} />}
      seatMeta="Academic office · Jaydev Vihar"
    >
      {children ?? <Outlet />}
    </WorkspaceLayout>
  )
}
