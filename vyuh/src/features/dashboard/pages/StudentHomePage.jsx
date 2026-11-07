import { useState } from 'react'
import { CloudOff, RotateCw } from 'lucide-react'
import { Button } from '@/shared/ui/Button.jsx'
import { ErrorState } from '@/shared/ui/ErrorState.jsx'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { firstName } from '@/shared/lib/format.js'
import { useStudentHome } from '../hooks/useStudentHome.js'
import { DashboardSkeleton } from '../components/DashboardSkeleton.jsx'
import { useStudentId } from '@/features/student/hooks/useStudentWorkspace.js'
import { NextUpCard } from '@/features/student/components/NextUpCard.jsx'
import { StreakSquares } from '@/features/student/components/StreakSquares.jsx'
import { SubjectStrengthCard } from '@/features/student/components/SubjectStrengthCard.jsx'
import { RecentResultsCard } from '@/features/student/components/RecentResultsCard.jsx'
import { ContinueWatchingCard } from '@/features/student/components/ContinueWatchingCard.jsx'
import { TodayScheduleCard } from '@/features/student/components/TodayScheduleCard.jsx'
import { AttendanceSummaryCard } from '@/features/student/components/AttendanceSummaryCard.jsx'

/**
 * Student dashboard. One composed query drives the page. The countdown owns its
 * own interval inside ExamCountdown, so a one-second tick never re-renders this
 * page or the ledger beside it.
 */
export function StudentHomePage() {
  const studentId = useStudentId()
  const { data, isPending, isError, error, refetch, isRefetching } = useStudentHome(studentId)
  useDocumentTitle('Dashboard')
  const [hour] = useState(() => new Date().getHours())

  if (isPending) return <DashboardSkeleton />
  if (isError) {
    return (
      <>
        <h1 className="font-display text-xl tracking-tighter text-heading lg:text-2xl">Dashboard</h1>
        <ErrorState code="E_SNAPSHOT" icon={<CloudOff strokeWidth={1.5} />} title="Your dashboard could not load"
          description={/** @type {any} */ (error)?.message ?? 'The request failed before it returned. Nothing was changed. Try again.'}
          action={<Button variant="secondary" icon={<RotateCw strokeWidth={1.5} />} onClick={() => refetch()} loading={isRefetching}>Try again</Button>} />
      </>
    )
  }
  if (!data) return <ErrorState title="No workspace is attached to this account" description="Ask the academic office to attach your enrolment, then reload." code="E_NO_STUDENT" />

  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <header className="mb-6 border-b border-line pb-5 lg:mb-8">
        <p className="rule-label mb-2">Student workspace · Term 2026–27</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 tabIndex={-1} className="font-display text-xl leading-[1.08] tracking-tighter text-heading outline-none lg:text-2xl">{greeting}, {firstName(data.student.name)}.</h1>
            <p className="mt-2 max-w-2xl text-xs text-muted">Your next paper, subject strength and the last five attempts — without a leaderboard.</p>
          </div>
          <StreakSquares days={data.streakDays} />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          {data.nextTest ? <NextUpCard exam={data.nextTest} /> : null}
          <SubjectStrengthCard items={data.subjectStrength} />
          <RecentResultsCard attempts={data.recentAttempts} />
        </div>
        <aside className="flex min-w-0 flex-col gap-5" aria-label="Today and recent activity">
          <ContinueWatchingCard recording={data.continueRecording} />
          <TodayScheduleCard sessions={data.schedule} />
          <AttendanceSummaryCard summary={data.attendance} />
        </aside>
      </div>
    </>
  )
}
