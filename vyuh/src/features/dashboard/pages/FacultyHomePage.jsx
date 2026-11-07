import { RotateCw, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge } from '@/shared/ui/Badge.jsx'
import { Button } from '@/shared/ui/Button.jsx'
import { Card } from '@/shared/ui/Card.jsx'
import { ErrorState } from '@/shared/ui/ErrorState.jsx'
import { Skeleton } from '@/shared/ui/Skeleton.jsx'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { useBatches } from '@/features/batches/hooks/useBatches.js'
import { formatNumber } from '@/shared/lib/format.js'

/**
 * Faculty home: the batches this faculty member leads. Not a dashboard of
 * charts — a faculty member opens this screen to answer "which batch, and what
 * is waiting in it". Attendance and evaluation queues arrive in Phase 5.
 */
export function FacultyHomePage() {
  useDocumentTitle('Batches')
  const user = useSessionStore((state) => state.user)
  const { data, isPending, isError, error, refetch, isRefetching } = useBatches({ pageSize: 10 })

  const led = data?.items.filter((batch) => batch.facultyLead === user?.name) ?? []
  const assisting = data?.items.filter((batch) => batch.facultyLead !== user?.name) ?? []

  return (
    <>
      <PageHeader
        eyebrow="Faculty workspace · Term 2026–27"
        title="Batches you lead"
        description="Rosters, attendance and the evaluation queue for each batch. Papers you have not marked appear at the top of the batch page."
        meta={
          isPending ? null : (
            <>
              <span className="font-mono text-2xs tabular-nums text-muted">{led.length} leading</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="font-mono text-2xs tabular-nums text-muted">{assisting.length} shared</span>
            </>
          )
        }
      />

      {isPending ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2" aria-busy="true" role="status">
          <span className="sr-only">Loading batches</span>
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="rounded-md border border-line bg-surface-raised p-5" aria-hidden="true">
              <Skeleton.Line className="w-24" />
              <Skeleton.Block className="mt-3 h-6 w-3/4" />
              <Skeleton.Lines lines={2} className="mt-3" />
              <Skeleton.Block className="mt-4 h-10 w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState code="E_BATCHES"
          icon={<RotateCw strokeWidth={1.5} />}
          title="Your batches could not load"
          description={
            /** @type {any} */ (error)?.message ??
            'The batch list failed to return. Nothing was changed. Try again, and if it keeps failing the academic office can confirm your assignment.'
          }
          action={
            <Button variant="secondary" icon={<RotateCw strokeWidth={1.5} />} onClick={() => refetch()} loading={isRefetching}>
              Try again
            </Button>
          }
        />
      ) : led.length === 0 ? (
        <ErrorState
          code="E_NO_BATCH"
          icon={<Users strokeWidth={1.5} />}
          title="No batch is assigned to you this term"
          description="Assignments are made by the academic office before each session opens. If you expected a batch, contact the office and it will be attached to this account."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {led.map((batch) => (
            <Card
              key={batch.id}
              eyebrow={batch.track}
              title={batch.name}
              action={<Badge tone="answer" variant="outline">Active</Badge>}
              footer={
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-2xs tabular-nums text-faint">
                    {formatNumber(batch.studentCount)} students · {batch.testCount} papers
                  </span>
                  <Link
                    to="/app/batches"
                    className="inline-flex min-h-9 items-center text-2xs font-[560] text-heading hover:text-ember-press"
                  >
                    Open batch
                  </Link>
                </div>
              }
            >
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="rule-label">Schedule</dt>
                  <dd className="mt-1 font-mono text-2xs tabular-nums text-heading">{batch.scheduleLabel}</dd>
                </div>
                <div>
                  <dt className="rule-label">Cohort</dt>
                  <dd className="mt-1 text-2xs text-heading">
                    {batch.cohort === 'dropper' ? 'Droppers' : batch.cohort === 'class12' ? 'Class 12' : 'Class 11'}
                  </dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
