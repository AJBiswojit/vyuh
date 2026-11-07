import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowUpRight, Radio } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, ErrorState, Skeleton } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime, formatRelative } from '@/shared/lib/format.js'
import { useExamMonitor, useFacultyExam } from '../hooks/useFaculty.js'
import { MonitorBoard } from '../components/MonitorBoard.jsx'
import { MonitorFeed } from '../components/MonitorFeed.jsx'
import { ExamStatusBadge } from '../components/ExamStatusBadge.jsx'

/**
 * The monitor wall. The snapshot arrives from the service's scripted feed, so the
 * counts move because events happened, not because this page polls. A proctor can
 * read the room from the tiles; the feed and the candidate card explain change.
 */
export function FacultyExamMonitorPage() {
  const { examId = '' } = useParams()
  useDocumentTitle('Exam monitor')
  const exam = useFacultyExam(examId)
  const monitor = useExamMonitor(examId)
  const [selectedId, setSelectedId] = useState('')

  if (monitor.isPending) {
    return (
      <div role="status" aria-busy="true" className="space-y-4">
        <span className="sr-only">Connecting to the sitting</span>
        <Skeleton.Line className="w-40" />
        <Skeleton.Block className="h-9 w-[min(28rem,80%)]" />
        <Skeleton.Block className="h-16 rounded-sm" />
        <Skeleton.Block className="h-96 rounded-sm" />
      </div>
    )
  }

  if (monitor.isError) {
    return (
      <ErrorState
        code="E_MONITOR"
        title="The sitting could not be read"
        description={/** @type {Error} */ (monitor.error)?.message ?? 'Nothing was changed. The sitting itself is unaffected by this screen.'}
        action={<Button variant="secondary" onClick={() => monitor.refetch()} loading={monitor.isFetching}>Try again</Button>}
      />
    )
  }

  const snapshot = /** @type {import('@/contracts/faculty.js').MonitorSnapshot} */ (monitor.data)
  const selected = snapshot.students.find((student) => student.id === selectedId) ?? null
  const flagged = snapshot.students.filter((student) => student.integrityFlags > 0)

  return (
    <>
      <PageHeader
        eyebrow={`Faculty workspace · Live sitting · ${snapshot.batchName}`}
        title={snapshot.examTitle}
        description={`${snapshot.totalQuestions} questions · opened ${formatDateTime(snapshot.startedAt)} · closes ${formatDateTime(snapshot.endsAt)}. The wall updates as answers, submissions and flags arrive.`}
        meta={
          <>
            {exam.data ? <ExamStatusBadge status={exam.data.status} /> : null}
            <span className="inline-flex items-center gap-1.5 font-mono text-2xs tabular-nums text-muted">
              <Radio className="size-3.5 text-info-fg" strokeWidth={2} aria-hidden="true" />
              live · updated {formatRelative(snapshot.updatedAt)}
            </span>
            <span className="sr-only" aria-live="polite">
              {snapshot.counts.total} in the hall, {snapshot.counts.submitted} submitted, {snapshot.counts.flagged} with integrity flags.
            </span>
          </>
        }
        actions={
          <>
            <Link
              to={`/faculty/exams/${examId}`}
              className="inline-flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border border-line px-3 text-xs font-[560] text-heading hover:border-line-strong"
            >
              Open the paper
              <ArrowUpRight className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            </Link>
            {exam.data?.status === 'completed' ? (
              <Link
                to={`/faculty/analysis?exam=${encodeURIComponent(examId)}`}
                className="inline-flex min-h-[var(--spacing-touch)] items-center rounded-sm border border-heading px-3 text-xs font-[560] text-heading hover:opacity-90"
              >
                Read the analysis
              </Link>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <MonitorBoard snapshot={snapshot} selectedId={selectedId} onSelect={(studentId) => setSelectedId(studentId === selectedId ? '' : studentId)} />
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <Card
            eyebrow="Candidate"
            title={selected ? selected.name : 'Nobody selected'}
            action={selected ? <Badge tone="neutral" variant="outline" shape="none" mono>{selected.rollNumber}</Badge> : null}
          >
            {selected ? (
              <div className="flex flex-col gap-3">
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="rule-label">Progress</dt>
                    <dd className="mt-1 font-mono text-sm tabular-nums text-heading">{selected.answeredCount}/{selected.total}</dd>
                  </div>
                  <div>
                    <dt className="rule-label">Marked for review</dt>
                    <dd className="mt-1 font-mono text-sm tabular-nums text-heading">{selected.reviewCount}</dd>
                  </div>
                  <div>
                    <dt className="rule-label">Last seen</dt>
                    <dd className="mt-1 font-mono text-2xs tabular-nums text-heading">{formatRelative(selected.lastSeenAt)}</dd>
                  </div>
                  <div>
                    <dt className="rule-label">Integrity flags</dt>
                    <dd className={selected.integrityFlags > 0 ? 'mt-1 font-mono text-sm tabular-nums text-danger-fg' : 'mt-1 font-mono text-sm tabular-nums text-heading'}>
                      {selected.integrityFlags}
                    </dd>
                  </div>
                </dl>
                {selected.integrityNotes.length > 0 ? (
                  <ul className="flex flex-col gap-1 border-l-2 border-l-danger pl-3" aria-label="Integrity notes for this candidate">
                    {selected.integrityNotes.map((note) => (
                      <li key={note} className="text-2xs leading-relaxed text-danger-fg">{note}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-2xs text-muted">No integrity notes for this candidate.</p>
                )}
                <Button variant="ghost" size="sm" onClick={() => setSelectedId('')}>
                  Clear selection
                </Button>
              </div>
            ) : (
              <p className="text-2xs leading-relaxed text-muted">
                Pick a tile to see that candidate&apos;s progress, review count and integrity notes. Tiles are labelled by name and roll number, never by colour alone.
              </p>
            )}
          </Card>

          <MonitorFeed events={snapshot.feed} />

          <Card
            eyebrow="Integrity"
            title="Flagged candidates"
            action={<span className="font-mono text-2xs tabular-nums text-faint">{flagged.length}</span>}
          >
            {flagged.length === 0 ? (
              <p className="text-2xs text-muted">No flags have been raised in this sitting.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {flagged.map((student) => (
                  <li key={student.id} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
                    <span className="min-w-0">
                      <span className="block truncate text-2xs font-[560] text-heading">{student.name}</span>
                      <span className="mt-0.5 block text-2xs text-muted">{student.integrityNotes[0] ?? 'Flag recorded'}</span>
                    </span>
                    <button
                      type="button"
                      className="shrink-0 text-2xs font-[560] text-heading underline decoration-line-strong underline-offset-2 hover:text-ember-press"
                      onClick={() => setSelectedId(student.id)}
                    >
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </>
  )
}
