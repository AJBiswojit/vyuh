import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarClock, ClipboardCheck, MessageSquare, Radio } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, ErrorState, Skeleton } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { cn } from '@/shared/lib/cn.js'
import { formatRelative, formatWeekday } from '@/shared/lib/format.js'
import { useFacultyDashboard } from '../hooks/useFaculty.js'

/**
 * The faculty home. Four questions, in the order a teaching day asks them: what
 * is on today, who is waiting for an answer, which paper needs my decision, and
 * how is the cohort actually doing.
 *
 * The density is deliberate — this is a working screen, not a landing page, so
 * the blocks are ledger rows rather than marketing cards.
 */
export function FacultyDashboardPage() {
  useDocumentTitle('Faculty workspace')
  const dashboard = useFacultyDashboard()

  if (dashboard.isPending) {
    return (
      <div role="status" aria-busy="true" className="space-y-4">
        <span className="sr-only">Loading the workspace</span>
        <Skeleton.Line className="w-40" />
        <Skeleton.Block className="h-10 w-[min(30rem,80%)]" />
        <Skeleton.Block className="h-20 rounded-sm" />
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Skeleton.Block className="h-72 rounded-sm" />
          <Skeleton.Block className="h-72 rounded-sm" />
        </div>
      </div>
    )
  }

  if (dashboard.isError) {
    return (
      <ErrorState
        code="E_FACULTY"
        title="The workspace could not load"
        description={/** @type {Error} */ (dashboard.error)?.message ?? 'Nothing was changed. Try again.'}
        action={<Button variant="secondary" onClick={() => dashboard.refetch()} loading={dashboard.isFetching}>Try again</Button>}
      />
    )
  }

  const data = /** @type {import('@/contracts/faculty.js').FacultyDashboard} */ (dashboard.data)
  const live = data.liveExam
  const cohort = data.cohort

  return (
    <>
      <PageHeader
        eyebrow={`Faculty workspace · ${data.termLabel}`}
        title={`Good to see you, ${data.facultyName.replace(/^Dr\.\s*/, '')}`}
        description="Today's sessions, the doubts waiting on you, papers needing a decision and the cohort at a glance. Everything here is one click from the room it belongs to."
        meta={
          <>
            <span className="font-mono text-2xs tabular-nums text-muted">{data.todayClasses.length} sessions today</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <span className="font-mono text-2xs tabular-nums text-muted">{data.pendingDoubts.length} doubts waiting</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <span className="font-mono text-2xs tabular-nums text-muted">{data.stats.awaitingApproval} papers awaiting approval</span>
          </>
        }
        actions={
          <Link
            to={live ? `/faculty/exams/${live.examId}/monitor` : '/faculty/bank/new'}
            className="inline-flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border border-ember bg-ember px-4 text-xs font-[560] tracking-tight text-on-ember hover:border-ember-press hover:bg-ember-press"
          >
            {live ? <Radio className="size-4" strokeWidth={1.75} aria-hidden="true" /> : null}
            {live ? 'Monitor the live paper' : 'Write a question'}
          </Link>
        }
      />

      {live ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line bg-ink px-4 py-3 text-paper">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-info px-2 py-0.5 font-mono text-2xs uppercase tracking-widest text-on-signal">
              <Radio className="size-3" strokeWidth={2.5} aria-hidden="true" />
              Live
            </span>
            <div>
              <p className="text-xs font-[560] tracking-tight">{live.title}</p>
              <p className="mt-0.5 text-2xs text-on-ink-muted">
                {live.batchName} · {live.submitted} of {live.total} submitted · opened {formatRelative(live.startedAt)}
              </p>
            </div>
          </div>
          <Link to={`/faculty/exams/${live.examId}/monitor`} className="inline-flex min-h-9 items-center gap-1 text-2xs font-[560] text-paper underline decoration-on-ink-muted underline-offset-4 hover:text-on-ink-strong">
            Open the wall
            <ArrowUpRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Bank" value={data.stats.bankQuestions} to="/faculty/bank" />
        <Stat label="Drafts" value={data.stats.drafts} to="/faculty/exams" />
        <Stat label="Scheduled" value={data.stats.scheduled} to="/faculty/exams" />
        <Stat label="Awaiting approval" value={data.stats.awaitingApproval} to="/faculty/exams" tone={data.stats.awaitingApproval > 0 ? 'review' : undefined} />
        <Stat label="Unpublished recordings" value={data.stats.recordingsUnpublished} to="/faculty/recordings" />
        <Stat label="Open doubts" value={data.stats.openDoubts} to="/faculty/doubts" tone={data.stats.openDoubts > 0 ? 'review' : undefined} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card
            eyebrow="Today"
            title="Your sessions"
            action={<Link to="/faculty/classes" className="text-2xs font-[560] text-heading hover:text-ember-press">Scheduler</Link>}
          >
            {data.todayClasses.length === 0 ? (
              <p className="flex items-center gap-2 text-2xs text-muted">
                <CalendarClock className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                No session is scheduled for today. Open the scheduler to add one.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-line" data-testid="today-classes">
                {data.todayClasses.map((session) => (
                  <li key={session.id} className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate text-xs font-[560] tracking-tight text-heading">{session.title}</span>
                        {session.status === 'live' ? (
                          <Badge tone="info" variant="solid" shape="dot">Live</Badge>
                        ) : session.status === 'ended' ? (
                          <Badge tone="idle" variant="outline" shape="hollow">Ended</Badge>
                        ) : (
                          <Badge tone="info" variant="outline" shape="circle">Scheduled</Badge>
                        )}
                      </span>
                      <span className="mt-0.5 block text-2xs text-muted">
                        {formatWeekday(session.startsAt)} · {session.subjectName} · {session.batchName}
                      </span>
                      <span className="mt-0.5 block font-mono text-2xs tabular-nums text-faint">
                        {new Date(session.startsAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {session.durationMinutes} min · threshold {session.attendanceThresholdPercent}%
                      </span>
                    </span>
                    <Link
                      to={session.roomPath}
                      className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-sm border border-line px-2.5 text-2xs font-[560] text-heading hover:border-line-strong"
                    >
                      {session.status === 'ended' ? 'Session' : 'Host'}
                      <ArrowUpRight className="size-3" strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            eyebrow="Decision"
            title="Papers needing you"
            action={<Link to="/faculty/exams" className="text-2xs font-[560] text-heading hover:text-ember-press">All papers</Link>}
          >
            {data.approvals.length === 0 ? (
              <p className="flex items-center gap-2 text-2xs text-muted">
                <ClipboardCheck className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                Nothing is waiting at the academic office. Drafts stay yours until you send them.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-line" data-testid="approval-list">
                {data.approvals.map((approval) => (
                  <li key={approval.id} className="flex flex-wrap items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate text-xs font-[560] tracking-tight text-heading">{approval.title}</span>
                        <Badge tone={approval.kind === 'approval' ? 'review' : 'info'} variant="outline" shape={approval.kind === 'approval' ? 'ring' : 'square'}>
                          {approval.kind === 'approval' ? 'Awaiting approval' : 'Needs review'}
                        </Badge>
                      </span>
                      <span className="mt-0.5 block text-2xs text-muted">
                        {approval.batchName} · {approval.questionCount} questions · submitted {formatRelative(approval.submittedAt)}
                      </span>
                      <span className="mt-0.5 block text-2xs text-faint">{approval.note}</span>
                    </span>
                    <Link to={approval.builderPath} className="inline-flex min-h-9 shrink-0 items-center gap-1 text-2xs font-[560] text-heading hover:text-ember-press">
                      Open
                      <ArrowUpRight className="size-3" strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            eyebrow="Inbox"
            title="Doubts waiting"
            action={<Link to="/faculty/doubts" className="text-2xs font-[560] text-heading hover:text-ember-press">Inbox</Link>}
          >
            {data.pendingDoubts.length === 0 ? (
              <p className="flex items-center gap-2 text-2xs text-muted">
                <MessageSquare className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                Inbox zero. New doubts appear here with their lecture timestamp attached.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-line" data-testid="pending-doubts">
                {data.pendingDoubts.map((doubt) => (
                  <li key={doubt.id} className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="min-w-0 flex-1">
                      <Link to={doubt.threadPath} className="block truncate text-xs font-[560] tracking-tight text-heading hover:text-ember-press">
                        {doubt.title}
                      </Link>
                      <span className="mt-0.5 block truncate text-2xs text-muted">
                        {doubt.studentName} · {doubt.subjectName} · waiting {doubt.waitingMinutes} min
                      </span>
                    </span>
                    <Link to={doubt.threadPath} className="inline-flex min-h-9 shrink-0 items-center gap-1 text-2xs font-[560] text-heading hover:text-ember-press">
                      Answer
                      <ArrowUpRight className="size-3" strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="flex min-w-0 flex-col gap-5">
          <Card eyebrow="Cohort" title={cohort.batchName} action={<Link to="/faculty/attendance" className="text-2xs font-[560] text-heading hover:text-ember-press">Register</Link>}>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt className="rule-label">Students</dt>
                <dd className="mt-1 font-mono text-sm tabular-nums text-heading">{cohort.students}</dd>
              </div>
              <div>
                <dt className="rule-label">Active today</dt>
                <dd className="mt-1 font-mono text-sm tabular-nums text-heading">{cohort.activeToday}</dd>
              </div>
              <div>
                <dt className="rule-label">Attendance</dt>
                <dd className="mt-1 font-mono text-sm tabular-nums text-heading">{cohort.attendancePercent.toFixed(1)}%</dd>
              </div>
              <div>
                <dt className="rule-label">Mastery</dt>
                <dd className="mt-1 font-mono text-sm tabular-nums text-heading">{cohort.masteryPercent}%</dd>
              </div>
            </dl>

            <div className="mt-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="rule-label">Weekly mastery</p>
                <p className="font-mono text-2xs tabular-nums text-faint">
                  {cohort.trend[0]?.value ?? 0} → {cohort.trend.at(-1)?.value ?? 0}
                </p>
              </div>
              <ol className="mt-2 flex h-16 items-end gap-1.5" aria-label="Weekly mastery trend">
                {cohort.trend.map((point) => (
                  <li key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <span
                      className="w-full rounded-t-[2px] bg-heading"
                      style={{ height: `${Math.max(6, Math.round((point.value / 100) * 52))}px` }}
                      title={`${point.label}: ${point.value}%`}
                    />
                    <span className="font-mono text-2xs text-faint">{point.label}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
              <p className="text-2xs text-muted">
                Weakest topic: <span className="font-[560] text-heading">{cohort.topWeakTopic}</span>
              </p>
              <span className={cn('font-mono text-2xs tabular-nums', cohort.atRisk > 0 ? 'text-danger-fg' : 'text-muted')}>
                {cohort.atRisk} at risk
              </span>
            </div>
          </Card>

          <Card eyebrow="Queue" title="Where the work is">
            <ul className="flex flex-col divide-y divide-line">
              <QueueRow label="Questions in the bank" value={data.stats.bankQuestions} to="/faculty/bank" />
              <QueueRow label="Papers in draft" value={data.stats.drafts} to="/faculty/exams" />
              <QueueRow label="Recordings unpublished" value={data.stats.recordingsUnpublished} to="/faculty/recordings" />
              <QueueRow label="Doubts open" value={data.stats.openDoubts} to="/faculty/doubts" />
            </ul>
            <p className="mt-3 text-2xs text-muted">A draft is invisible to students until it is approved and scheduled.</p>
          </Card>
        </aside>
      </div>
    </>
  )
}

/** @param {{ label: string, value: number, to: string, tone?: 'review' }} props */
function Stat({ label, value, to, tone }) {
  return (
    <Link to={to} className="group bg-surface-raised px-3 py-2.5 transition-colors hover:bg-surface-sunken">
      <span className="rule-label block">{label}</span>
      <span className={cn('mt-1 block font-mono text-lg tabular-nums leading-none', tone === 'review' && value > 0 ? 'text-review-fg' : 'text-heading')}>{value}</span>
    </Link>
  )
}

/** @param {{ label: string, value: number, to: string }} props */
function QueueRow({ label, value, to }) {
  return (
    <li className="py-2 first:pt-0 last:pb-0">
      <Link to={to} className="flex items-center justify-between gap-3 text-2xs hover:text-ember-press">
        <span className="text-body">{label}</span>
        <span className="font-mono tabular-nums text-heading">{value}</span>
      </Link>
    </li>
  )
}
