import { Outlet, useLocation } from 'react-router-dom'
import { Calendar, FileText, LayoutGrid, MessageCircle, Play, Radio, TrendingUp, User, Users } from 'lucide-react'
import { StudentShell } from '@/features/student/components/StudentShell.jsx'
import { useSessionStore } from '@/shared/store/sessionStore.js'

/** Student navigation. Every item has a rendered workspace page. */
export const STUDENT_NAV = [
  { to: '/student', label: 'Dashboard', description: 'Next exam, strength, results and schedule', icon: LayoutGrid },
  { to: '/student/exams', label: 'Exams', description: 'Upcoming, live and past papers', icon: FileText },
  { to: '/student/live', label: 'Live classes', description: 'Today’s classes and upcoming sessions', icon: Radio },
  { to: '/student/recordings', label: 'Recordings', description: 'Continue watching class recordings', icon: Play },
  { to: '/student/performance', label: 'Performance', description: 'Score and subject trends', icon: TrendingUp },
  { to: '/student/doubts', label: 'Doubts', description: 'Timestamped question threads with faculty', icon: MessageCircle },
  { to: '/student/attendance', label: 'Attendance', description: 'Monthly presence, verdicts and grace rule', icon: Calendar },
  { to: '/student/study-rooms', label: 'Study rooms', description: 'Interactive small-group practice rooms', icon: Users },
  { to: '/student/profile', label: 'Profile', description: 'Details, batch and preferences', icon: User },
]

const CRUMBS = Object.fromEntries(STUDENT_NAV.map((item) => [
  item.to,
  item.to === '/student' ? [{ label: 'Dashboard' }] : [{ label: 'Dashboard', to: '/student' }, { label: item.label }],
]))

/** @param {{ children?: React.ReactNode }} props */
export function StudentLayout({ children }) {
  const location = useLocation()
  const user = useSessionStore((state) => state.user)
  const crumbs = CRUMBS[location.pathname] ?? [{ label: 'Dashboard', to: '/student' }, { label: 'Student' }]
  return (
    <StudentShell items={STUDENT_NAV} workspaceLabel="Student workspace" breadcrumb={crumbs} seatMeta={user?.batchName ?? 'Student workspace'}>
      {children ?? <Outlet />}
    </StudentShell>
  )
}
