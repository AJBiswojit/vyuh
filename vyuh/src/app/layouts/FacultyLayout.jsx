import { Outlet, useLocation } from 'react-router-dom'
import { CalendarClock, ChartScatter, ClipboardCheck, FileText, Film, LayoutDashboard, LibraryBig, MessageSquare, SlidersHorizontal } from 'lucide-react'
import { WorkspaceLayout, Breadcrumb } from './WorkspaceLayout.jsx'

/**
 * Faculty navigation. Nine destinations, each one a screen that exists — the rail
 * is the whole workspace, so it carries no placeholders. Sub-screens (a paper's
 * builder, a sitting's monitor, a room, a recording) are reached from their
 * parent and appear in the breadcrumb.
 */
export const FACULTY_NAV = [
  { to: '/faculty', label: 'Dashboard', description: 'Today, queues and cohort', icon: LayoutDashboard },
  { to: '/faculty/bank', label: 'Question bank', description: 'Items by subject and difficulty', icon: LibraryBig },
  { to: '/faculty/exams', label: 'Exams', description: 'Draft, approve, schedule', icon: FileText },
  { to: '/faculty/analysis', label: 'Item analysis', description: 'Difficulty against discrimination', icon: ChartScatter },
  { to: '/faculty/classes', label: 'Classes', description: 'Schedule and host live sessions', icon: CalendarClock },
  { to: '/faculty/recordings', label: 'Recordings', description: 'Trim, chapter, publish', icon: Film },
  { to: '/faculty/attendance', label: 'Attendance', description: 'Register and CSV export', icon: ClipboardCheck },
  { to: '/faculty/doubts', label: 'Doubts', description: 'Threads waiting on you', icon: MessageSquare },
  { to: '/faculty/account', label: 'Account', description: 'Profile, preferences and session', icon: SlidersHorizontal },
]

/** The trail per route, matched by prefix so a detail screen keeps its parents. */
const CRUMB_RULES = [
  [/^\/faculty$/, [{ label: 'Faculty' }]],
  [/^\/faculty\/bank\/new$/, [{ label: 'Faculty', to: '/faculty' }, { label: 'Question bank', to: '/faculty/bank' }, { label: 'New question' }]],
  [/^\/faculty\/bank\/[^/]+$/, [{ label: 'Faculty', to: '/faculty' }, { label: 'Question bank', to: '/faculty/bank' }, { label: 'Edit question' }]],
  [/^\/faculty\/bank$/, [{ label: 'Faculty', to: '/faculty' }, { label: 'Question bank' }]],
  [/^\/faculty\/exams\/[^/]+\/monitor$/, [{ label: 'Faculty', to: '/faculty' }, { label: 'Exams', to: '/faculty/exams' }, { label: 'Monitor' }]],
  [/^\/faculty\/exams\/[^/]+$/, [{ label: 'Faculty', to: '/faculty' }, { label: 'Exams', to: '/faculty/exams' }, { label: 'Builder' }]],
  [/^\/faculty\/exams$/, [{ label: 'Faculty', to: '/faculty' }, { label: 'Exams' }]],
  [/^\/faculty\/analysis$/, [{ label: 'Faculty', to: '/faculty' }, { label: 'Item analysis' }]],
  [/^\/faculty\/classes\/[^/]+\/host$/, [{ label: 'Faculty', to: '/faculty' }, { label: 'Classes', to: '/faculty/classes' }, { label: 'Live class' }]],
  [/^\/faculty\/classes$/, [{ label: 'Faculty', to: '/faculty' }, { label: 'Classes' }]],
  [/^\/faculty\/recordings\/[^/]+$/, [{ label: 'Faculty', to: '/faculty' }, { label: 'Recordings', to: '/faculty/recordings' }, { label: 'Editor' }]],
  [/^\/faculty\/recordings$/, [{ label: 'Faculty', to: '/faculty' }, { label: 'Recordings' }]],
  [/^\/faculty\/attendance$/, [{ label: 'Faculty', to: '/faculty' }, { label: 'Attendance' }]],
  [/^\/faculty\/doubts\/[^/]+$/, [{ label: 'Faculty', to: '/faculty' }, { label: 'Doubts', to: '/faculty/doubts' }, { label: 'Thread' }]],
  [/^\/faculty\/doubts$/, [{ label: 'Faculty', to: '/faculty' }, { label: 'Doubts' }]],
  [/^\/faculty\/account$/, [{ label: 'Faculty', to: '/faculty' }, { label: 'Account' }]],
]

/**
 * @param {string} pathname
 * @returns {{ label: string, to?: string }[]}
 */
export function facultyCrumbs(pathname) {
  for (const [pattern, crumbs] of CRUMB_RULES) {
    if (/** @type {RegExp} */ (pattern).test(pathname)) return /** @type {{ label: string, to?: string }[]} */ (crumbs)
  }
  return [{ label: 'Faculty', to: '/faculty' }, { label: 'Not found' }]
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
  const crumbs = facultyCrumbs(location.pathname)

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
