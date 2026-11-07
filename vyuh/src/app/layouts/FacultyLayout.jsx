import { Outlet, useLocation } from 'react-router-dom'
import { ClipboardCheck, LibraryBig, SlidersHorizontal, Users } from 'lucide-react'
import { WorkspaceLayout, Breadcrumb } from './WorkspaceLayout.jsx'

/** Faculty navigation. */
export const FACULTY_NAV = [
  { to: '/faculty', label: 'Batches', description: 'Batches you lead this term', icon: Users },
  { to: '/faculty/bank', label: 'Question bank', description: 'Questions by chapter and difficulty', icon: LibraryBig },
  { to: '/faculty/evaluation', label: 'Evaluation', description: 'Subjective answers waiting on you', icon: ClipboardCheck },
  { to: '/faculty/account', label: 'Account', description: 'Profile, preferences and session', icon: SlidersHorizontal },
]

const CRUMBS = {
  '/faculty': [{ label: 'Faculty' }],
  '/faculty/bank': [{ label: 'Faculty', to: '/faculty' }, { label: 'Question bank' }],
  '/faculty/evaluation': [{ label: 'Faculty', to: '/faculty' }, { label: 'Evaluation' }],
  '/faculty/account': [{ label: 'Faculty', to: '/faculty' }, { label: 'Account' }],
}

/**
 * FacultyLayout — the teaching workspace. Same shell as a student's, different
 * navigation and a different seat line: a faculty member's useful identifier is
 * their subject, not a roll number.
 *
 * @param {{ children?: React.ReactNode }} props
 */
export function FacultyLayout({ children }) {
  const location = useLocation()
  const crumbs = CRUMBS[location.pathname] ?? [{ label: 'Faculty', to: '/faculty' }, { label: 'Not found' }]

  return (
    <WorkspaceLayout
      items={FACULTY_NAV}
      workspaceLabel="Faculty workspace"
      breadcrumb={<Breadcrumb items={crumbs} />}
      seatMeta="Physics · lead faculty"
    >
      {children ?? <Outlet />}
    </WorkspaceLayout>
  )
}
