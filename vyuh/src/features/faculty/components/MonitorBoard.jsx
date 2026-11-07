import { ShieldAlert, WifiOff } from 'lucide-react'
import { Badge } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'
import { StatusShape } from '@/features/exam/components/StatusShape.jsx'

/**
 * The monitor wall. Each tile is one candidate's palette, drawn with the same
 * five shapes the hall uses, at four times the size — so a proctor can read the
 * room at a glance and still fall back on the numeral and the label.
 *
 * The status strip above is derived from the tiles by the service, never
 * counted here, which is why a tile and a total cannot disagree.
 *
 * @param {Object} props
 * @param {import('@/contracts/faculty.js').MonitorSnapshot} props.snapshot
 * @param {string|null} [props.selectedId]
 * @param {(studentId: string) => void} [props.onSelect]
 */
export function MonitorBoard({ snapshot, selectedId = null, onSelect }) {
  const answerCoverage =
    snapshot.counts.total === 0 || snapshot.totalQuestions === 0
      ? 0
      : Math.round((snapshot.counts.answers / (snapshot.counts.total * snapshot.totalQuestions)) * 100)

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-3 lg:grid-cols-6" data-testid="monitor-counts">
        <Count label="In the hall" value={snapshot.counts.total} />
        <Count label="Writing" value={snapshot.counts.inProgress} />
        <Count label="Submitted" value={snapshot.counts.submitted} tone="answer" />
        <Count label="Not started" value={snapshot.counts.notStarted} tone="idle" />
        <Count label="Connection lost" value={snapshot.counts.disconnected} tone="danger" />
        <Count label="Integrity flags" value={snapshot.counts.flagged} tone="review" />
      </dl>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm tracking-tight text-heading">Submission progress</h2>
          <p className="font-mono text-2xs tabular-nums text-muted">
            {snapshot.progress.submitted} of {snapshot.progress.total} submitted · {answerCoverage}% of answers saved ·{' '}
            <span data-testid="monitor-answers">{snapshot.counts.answers}</span> answers
            <span aria-live="polite" className="sr-only">Updates as events arrive</span>
          </p>
        </div>
        <div
          role="progressbar"
          aria-valuenow={snapshot.progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Submitted papers"
          className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
        >
          <span className="block h-full rounded-full bg-answer transition-[width] duration-500" style={{ width: `${snapshot.progress.percent}%` }} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-muted">
          <span className="inline-flex items-center gap-1.5"><StatusShape state="answered" size="sm" /> Answering</span>
          <span className="inline-flex items-center gap-1.5"><StatusShape state="review" size="sm" /> Reviewing</span>
          <span className="inline-flex items-center gap-1.5"><StatusShape state="not_answered" size="sm" /> In progress, nothing saved</span>
          <span className="inline-flex items-center gap-1.5"><StatusShape state="not_visited" size="sm" /> Not started</span>
          <span className="inline-flex items-center gap-1.5"><StatusShape state="review_answered" size="sm" /> Submitted</span>
        </div>
      </div>

      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-label="Candidate tiles">
        {snapshot.students.map((student) => {
          const shape = SHAPE[student.status]
          const selected = student.id === selectedId
          return (
            <li key={student.id}>
              <button
                type="button"
                onClick={() => onSelect?.(student.id)}
                aria-pressed={selected}
                data-testid={`monitor-tile-${student.id}`}
                data-status={student.status}
                className={cn(
                  'flex w-full flex-col gap-2 rounded-sm border bg-surface-raised p-2.5 text-left transition-colors',
                  selected ? 'border-ember' : 'border-line hover:border-line-strong',
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-2xs font-[560] tracking-tight text-heading">{student.name}</span>
                    <span className="mt-0.5 block font-mono text-2xs tabular-nums text-faint">{student.rollNumber}</span>
                  </span>
                  <span className="shrink-0 pt-0.5">
                    <StatusShape state={shape} />
                  </span>
                </span>

                <span className="flex items-center justify-between gap-2">
                  <span className="text-2xs text-muted">{STATUS_LABELS[student.status]}</span>
                  <span className="font-mono text-2xs tabular-nums text-heading">
                    {student.answeredCount}/{student.total}
                  </span>
                </span>

                <span className="relative block h-1 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                  <span
                    className={cn('absolute inset-y-0 left-0 rounded-full', student.status === 'submitted' ? 'bg-answer' : 'bg-heading')}
                    style={{ width: `${student.progressPercent}%` }}
                  />
                </span>

                <span className="flex items-center gap-2">
                  {student.reviewCount > 0 ? (
                    <Badge tone="review" variant="soft" shape="diamond" mono>{student.reviewCount}</Badge>
                  ) : null}
                  {student.integrityFlags > 0 ? (
                    <span className="inline-flex items-center gap-1 text-2xs text-danger-fg">
                      <ShieldAlert className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                      <span className="font-mono tabular-nums">{student.integrityFlags}</span>
                      <span className="sr-only">integrity flags</span>
                    </span>
                  ) : null}
                  {student.status === 'disconnected' ? (
                    <span className="inline-flex items-center gap-1 text-2xs text-danger-fg">
                      <WifiOff className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                      <span className="sr-only">Connection lost</span>
                    </span>
                  ) : null}
                  <span className="ml-auto font-mono text-2xs tabular-nums text-faint">{student.progressPercent}%</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** @param {{ label: string, value: number, tone?: 'answer'|'danger'|'review'|'idle' }} props */
function Count({ label, value, tone }) {
  return (
    <div className="bg-surface-raised px-3 py-2.5">
      <dt className="rule-label">{label}</dt>
      <dd
        className={cn(
          'mt-1 font-mono text-lg tabular-nums leading-none',
          tone === 'answer' ? 'text-answer-fg' : tone === 'danger' ? 'text-danger-fg' : tone === 'review' ? 'text-review-fg' : tone === 'idle' ? 'text-muted' : 'text-heading',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

const SHAPE = {
  not_started: 'not_visited',
  in_progress: 'not_answered',
  answered: 'answered',
  review: 'review',
  submitted: 'review_answered',
  disconnected: 'not_answered',
}

const STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  answered: 'Answering',
  review: 'Reviewing',
  submitted: 'Submitted',
  disconnected: 'Connection lost',
}
