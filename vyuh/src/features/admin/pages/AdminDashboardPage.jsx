import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, CalendarClock, ShieldAlert, Stamp } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, ErrorState, Skeleton } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime, formatRelative, formatWeekday } from '@/shared/lib/format.js'
import { useAdminDashboard } from '../hooks/useAdmin.js'
import { StatBlock } from '../components/StatBlock.jsx'
import { AttendanceTrendChart } from '../components/AttendanceTrendChart.jsx'

/**
 * The institution, in the order the office asks: how many people are here, are
 * they turning up, what is being sat this week, and what cannot wait. The
 * numerals are the headings; everything else is context underneath them.
 */
export function AdminDashboardPage() {
  useDocumentTitle('Institution overview')
  const dashboard = useAdminDashboard()

  if (dashboard.isPending) {
    return (
      <div role="status" aria-busy="true" className="space-y-4">
        <span className="sr-only">Loading the institution overview</span>
        <Skeleton.Line className="w-40" />
        <Skeleton.Block className="h-10 w-[min(32rem,80%)]" />
        <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((key) => <Skeleton.Block key={key} className="h-36" />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          <Skeleton.Block className="h-80 rounded-sm" />
          <Skeleton.Block className="h-80 rounded-sm" />
        </div>
      </div>
    )
  }

  if (dashboard.isError) {
    return (
      <ErrorState
        code="E_ADMIN"
        title="The overview could not load"
        description={/** @type {Error} */ (dashboard.error)?.message ?? 'Nothing was changed. Try again.'}
        action={<Button variant="secondary" onClick={() => dashboard.refetch()} loading={dashboard.isFetching}>Try again</Button>}
      />
    )
  }

  const data = /** @type {import('@/contracts/admin.js').AdminDashboard} */ (dashboard.data)

  return (
    <>
      <PageHeader
        eyebrow={`Academic office · ${data.termLabel}`}
        title="Institution overview"
        description="Every batch, every candidate and every paper the office is responsible for this term. Figures are counted from the same roster the console edits, not typed in."
        meta={
          <>
            <span className="font-mono text-2xs tabular-nums text-muted">{data.centre}</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <span className="font-mono text-2xs tabular-nums text-muted">Last synced {formatRelative(data.generatedAt)}</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <span className="font-mono text-2xs tabular-nums text-muted">{data.alerts.length} alerts</span>
          </>
        }
        actions={
          <Link
            to="/admin/reports"
            className="inline-flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border border-line-strong px-4 text-xs font-[560] tracking-tight text-heading transition-colors hover:border-heading"
          >
            Term reports
            <ArrowUpRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        }
      />

      <div
        className="mb-5 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-2 xl:grid-cols-4"
        data-testid="admin-stats"
      >
        {data.stats.map((stat) => (
          <StatBlock key={stat.key} stat={stat} />
        ))}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <AttendanceTrendChart data={data.attendanceTrend} />

        <Card
          eyebrow="Needs a decision"
          title={`${data.alerts.length} things the office is holding`}
          footer={
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link to="/admin/approvals" className="inline-flex items-center gap-1 text-2xs font-[560] text-heading hover:text-ember-press">
                <Stamp className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                {data.pendingApprovals} paper{data.pendingApprovals === 1 ? '' : 's'} awaiting approval
              </Link>
              <Link to="/admin/integrity" className="inline-flex items-center gap-1 text-2xs font-[560] text-heading hover:text-ember-press">
                <ShieldAlert className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                {data.openFlags} integrity flag{data.openFlags === 1 ? '' : 's'} open
              </Link>
            </div>
          }
        >
          <ul className="flex flex-col divide-y divide-line" data-testid="admin-alerts">
            {data.alerts.map((alert) => (
              <li key={alert.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5">
                  {alert.tone === 'danger' ? (
                    <Badge tone="danger" variant="soft" shape="ring" aria-label="Urgent">Urgent</Badge>
                  ) : alert.tone === 'review' ? (
                    <Badge tone="review" variant="soft" shape="diamond" aria-label="Review">Review</Badge>
                  ) : (
                    <Badge tone="info" variant="soft" shape="circle" aria-label="For information">Notice</Badge>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-[560] leading-snug tracking-tight text-heading">{alert.title}</p>
                  <p className="mt-1 text-2xs leading-relaxed text-muted">{alert.detail}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Link to={alert.action.to} className="text-2xs font-[560] text-heading underline decoration-line-strong underline-offset-4 hover:text-ember-press">
                      {alert.action.label}
                    </Link>
                    <span className="font-mono text-2xs text-faint">{formatRelative(alert.at)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card
        eyebrow="Next seven days"
        title="Exam calendar"
        action={<Link to="/admin/approvals" className="text-2xs font-[560] text-heading hover:text-ember-press">Approval queue</Link>}
        footer={
          <p className="flex items-center gap-2 text-2xs text-muted">
            <CalendarClock className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            A paper can only be scheduled once it is approved. Live sittings are shown with their room.
          </p>
        }
      >
        <ul className="flex flex-col divide-y divide-line" data-testid="admin-calendar">
          {data.calendar.map((exam) => (
            <li key={exam.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-4 py-3 first:pt-0 last:pb-0 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto]">
              <div>
                <p className="rule-label">{formatWeekday(exam.date)}</p>
                <p className="mt-1 font-mono text-sm tabular-nums text-heading">
                  {new Date(exam.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })}
                </p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-[560] tracking-tight text-heading">{exam.title}</p>
                <p className="mt-0.5 text-2xs text-muted">{exam.subject} · {exam.room}</p>
                <p className="mt-1 truncate text-2xs text-faint">{exam.batchNames.join(' · ')}</p>
              </div>
              <div className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:justify-end">
                {exam.status === 'live' ? (
                  <Badge tone="info" variant="solid" shape="dot">Live now</Badge>
                ) : exam.status === 'awaiting' ? (
                  <Badge tone="review" variant="soft" shape="diamond">Awaiting approval</Badge>
                ) : exam.status === 'completed' ? (
                  <Badge tone="neutral" variant="outline" shape="square">Completed</Badge>
                ) : (
                  <Badge tone="answer" variant="soft" shape="square">Scheduled</Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-2xs text-muted">
        <AlertTriangle className="size-3.5 shrink-0 text-review-fg" strokeWidth={1.5} aria-hidden="true" />
        <span>Figures are counted at {formatDateTime(data.generatedAt)} and refresh when the page regains focus.</span>
      </div>
    </>
  )
}
