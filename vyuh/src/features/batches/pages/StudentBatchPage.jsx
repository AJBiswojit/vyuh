import { RotateCw } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge } from '@/shared/ui/Badge.jsx'
import { Button } from '@/shared/ui/Button.jsx'
import { Card } from '@/shared/ui/Card.jsx'
import { Skeleton } from '@/shared/ui/Skeleton.jsx'
import { ErrorState } from '@/shared/ui/ErrorState.jsx'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { formatNumber } from '@/shared/lib/format.js'
import { useBatch } from '../hooks/useBatches.js'

/**
 * Student batch page: the schedule, the subjects, and the faculty who teach
 * them. A reading screen, so it is set on paper with generous measure.
 */
export function StudentBatchPage() {
  useDocumentTitle('Batch')
  const user = useSessionStore((state) => state.user)
  const batchId = /** @type {any} */ (user)?.batchId
  const { data, isPending, isError, error, refetch, isRefetching } = useBatch(batchId ?? '')

  return (
    <>
      <PageHeader
        eyebrow="Student workspace"
        title="Your batch"
        description="Schedule, subjects and faculty for the batch you sit papers with. Timetable changes appear here the day they are published."
      />

      {isPending ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]" role="status" aria-busy="true">
          <span className="sr-only">Loading your batch</span>
          <div className="rounded-md border border-line bg-surface-raised p-5" aria-hidden="true">
            <Skeleton.Line className="w-24" />
            <Skeleton.Block className="mt-3 h-7 w-3/4" />
            <Skeleton.Lines lines={4} className="mt-5" />
          </div>
          <div className="rounded-md border border-line bg-surface-raised p-5" aria-hidden="true">
            <Skeleton.Line className="w-20" />
            <Skeleton.Block className="mt-3 h-32 w-full" />
          </div>
        </div>
      ) : isError ? (
        <ErrorState code="E_BATCH"
          icon={<RotateCw strokeWidth={1.5} />}
          title="Your batch could not load"
          description={
            /** @type {any} */ (error)?.message ??
            'The batch record did not return. Try again, and if it keeps failing the academic office can confirm which batch you are enrolled in.'
          }
          action={
            <Button variant="secondary" icon={<RotateCw strokeWidth={1.5} />} onClick={() => refetch()} loading={isRefetching}>
              Try again
            </Button>
          }
        />
      ) : !data ? (
        <ErrorState
          code="E_NO_BATCH"
          title="No batch is attached to this seat"
          description="Enrolment is recorded by the academic office. Once your batch is attached, its schedule and faculty appear here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card
            eyebrow={data.track}
            title={data.name}
            action={<Badge tone={data.status === 'active' ? 'answer' : 'idle'} variant="outline" className="uppercase">{data.status}</Badge>}
          >
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {[
                { term: 'Lead faculty', value: data.facultyLead },
                { term: 'Schedule', value: data.scheduleLabel },
                { term: 'Students', value: formatNumber(data.studentCount) },
                { term: 'Papers this term', value: String(data.testCount) },
                {
                  term: 'Cohort',
                  value: data.cohort === 'dropper' ? 'Droppers' : data.cohort === 'class12' ? 'Class 12' : 'Class 11',
                },
                { term: 'Subjects', value: String(data.subjects?.length ?? 0) },
              ].map((entry) => (
                <div key={entry.term}>
                  <dt className="rule-label">{entry.term}</dt>
                  <dd className="mt-1 text-xs text-heading">{entry.value}</dd>
                </div>
              ))}
            </dl>

            {data.chapters?.length ? (
              <div className="mt-6 border-t border-line pt-4">
                <p className="rule-label">Chapters in rotation this month</p>
                <ul className="mt-3 divide-y divide-line">
                  {data.chapters.slice(0, 6).map((chapter) => (
                    <li key={chapter.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-[560] text-heading">{chapter.name}</span>
                        <span className="block font-mono text-2xs tabular-nums text-faint">
                          weightage {chapter.weightage}%
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="h-1 w-16 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                          <span
                            className={chapter.mastery >= 60 ? 'block h-full rounded-full bg-answer' : 'block h-full rounded-full bg-review'}
                            style={{ width: `${chapter.mastery}%` }}
                          />
                        </span>
                        <span className="w-9 text-right font-mono text-2xs tabular-nums text-muted">{chapter.mastery}%</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-2xs text-faint">
                  Mastery shown as a bar with its number beside it; the bar alone never carries the meaning.
                </p>
              </div>
            ) : null}
          </Card>

          <Card eyebrow="Subjects" title="Taught in this batch">
            {data.subjects?.length ? (
              <ul className="divide-y divide-line">
                {data.subjects.map((subject) => (
                  <li key={subject.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-xs font-[560] tracking-tight text-heading">{subject.name}</p>
                      <p className="mt-0.5 font-mono text-2xs tabular-nums text-faint">
                        {subject.chapterCount} chapters · {formatNumber(subject.questionCount)} questions
                      </p>
                    </div>
                    <Badge tone="neutral" variant="outline" mono>{subject.shortName}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No subjects are attached to this batch yet.</p>
            )}
          </Card>
        </div>
      )}
    </>
  )
}
