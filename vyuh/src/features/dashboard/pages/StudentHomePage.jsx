import { Link } from 'react-router-dom'
import { ArrowRight, CloudOff, RotateCw } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge } from '@/shared/ui/Badge.jsx'
import { Button } from '@/shared/ui/Button.jsx'
import { ErrorState } from '@/shared/ui/ErrorState.jsx'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { firstName, formatNumber } from '@/shared/lib/format.js'
import { useStudentHome } from '../hooks/useStudentHome.js'
import { DashboardSkeleton } from '../components/DashboardSkeleton.jsx'
import { ScoreTrendCard } from '../components/ScoreTrendCard.jsx'
import { ReportCard } from '../components/ReportCard.jsx'
import { NextUpCard } from '../components/NextUpCard.jsx'
import { LiveNowCard } from '../components/LiveNowCard.jsx'
import { AnnouncementsCard } from '../components/AnnouncementsCard.jsx'
import { WeekStrip } from '../components/WeekStrip.jsx'

/**
 * Student home.
 *
 * One composed query drives the whole page, so the screen never shows a trend
 * without the report it belongs to. The grid is deliberately uneven: a 1.55fr
 * working column and a 1fr column of notices, because these blocks are not
 * peers and three equal cards in a row is a shape we do not use.
 */
export function StudentHomePage() {
  const user = useSessionStore((state) => state.user)
  const studentId = user?.role === 'student' ? user.id : undefined
  const { data, isPending, isError, error, refetch, isRefetching } = useStudentHome(studentId)

  useDocumentTitle('Overview')

  if (isPending) return <DashboardSkeleton />

  if (isError) {
    return (
      <>
        <PageHeader eyebrow="Student workspace" title="Overview" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <ErrorState code="E_SNAPSHOT"
            icon={<CloudOff strokeWidth={1.5} />}
            title="Your workspace could not load"
            description={
              /** @type {any} */ (error)?.message ??
              'The request for your overview failed before it returned. Nothing was changed and no answer was lost. Try again, and if it keeps failing the academic office can confirm your enrolment.'
            }
            action={
              <Button variant="secondary" icon={<RotateCw strokeWidth={1.5} />} onClick={() => refetch()} loading={isRefetching}>
                Try again
              </Button>
            }
          />
          <section aria-labelledby="still-available" className="border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <h2 id="still-available" className="rule-label">
              Still available
            </h2>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {[
                { to: '/app/batch', label: 'Your batch', detail: 'Schedule, subjects and faculty' },
                { to: '/app/account', label: 'Account', detail: 'Identity and appearance' },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="flex min-h-12 items-center justify-between gap-3 py-2.5 text-xs text-body transition-colors hover:text-heading"
                  >
                    <span>
                      <span className="block font-[560]">{item.label}</span>
                      <span className="mt-0.5 block text-2xs text-muted">{item.detail}</span>
                    </span>
                    <ArrowRight className="size-3.5 shrink-0 text-faint" strokeWidth={1.5} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-2xs leading-relaxed text-faint">
              A paper in progress keeps its own server-side clock. This page failing does not pause or submit it.
            </p>
          </section>
        </div>
      </>
    )
  }

  if (!data) {
    return (
      <>
        <PageHeader eyebrow="Student workspace" title="Overview" />
        <ErrorState
          title="No workspace is attached to this account"
          description="This seat has no student record for the current term. Ask the academic office to attach your enrolment, then reload."
          code="E_NO_STUDENT"
        />
      </>
    )
  }

  const { student, nextTest, liveNow, lastReport, trend, announcements, streakDays, weeklyGoalPercent, studyLog } =
    data

  return (
    <>
      <PageHeader
        eyebrow="Student workspace · Term 2026–27"
        title={`Good morning, ${firstName(student.name)}`}
        description="Your next paper, the last report, and the two chapters worth revisiting before Tuesday."
        meta={
          <>
            <span className="font-mono text-2xs uppercase tracking-widest text-faint">{student.rollNumber}</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <Badge tone="neutral" variant="outline">{student.track}</Badge>
            <span className="text-2xs text-muted">{student.batchName}</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <span className="font-mono text-2xs tabular-nums text-muted">
              streak {formatNumber(streakDays)} days
            </span>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          <ScoreTrendCard points={trend} />
          <WeekStrip log={studyLog} streakDays={streakDays} goalPercent={weeklyGoalPercent} />
          {lastReport ? <ReportCard report={lastReport} /> : null}
        </div>

        <aside className="flex min-w-0 flex-col gap-5" aria-label="What is coming up">
          {nextTest ? <NextUpCard test={nextTest} /> : null}
          <LiveNowCard sessions={liveNow} />
          <AnnouncementsCard items={announcements} />

          <Link
            to="/app/batch"
            className="flex min-h-11 items-center justify-between gap-3 rounded-sm border border-line px-4 text-sm text-body transition-colors hover:border-line-strong hover:text-heading"
          >
            Batch schedule and faculty
            <ArrowRight className="size-4 shrink-0 text-faint" strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </>
  )
}
