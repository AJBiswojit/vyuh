import { useDeferredValue, useState } from 'react'
import { ArrowDownUp, RotateCw, Search } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge } from '@/shared/ui/Badge.jsx'
import { Button } from '@/shared/ui/Button.jsx'
import { Input } from '@/shared/ui/Input.jsx'
import { Skeleton } from '@/shared/ui/Skeleton.jsx'
import { ErrorState } from '@/shared/ui/ErrorState.jsx'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { useBatches } from '@/features/batches/hooks/useBatches.js'
import { formatNumber } from '@/shared/lib/format.js'

/**
 * Academic office: every batch, searchable, as a real table. Table semantics
 * carry the meaning here — the office exports this view, so it behaves like a
 * record, not like tiles.
 */
export function AdminBatchesPage() {
  useDocumentTitle('Batches')
  const [search, setSearch] = useState('')
  const [order, setOrder] = useState('desc')
  const deferredSearch = useDeferredValue(search)

  const { data, isPending, isError, error, refetch, isRefetching } = useBatches({
    pageSize: 25,
    search: deferredSearch,
    order: /** @type {'asc'|'desc'} */ (order),
  })

  const totalStudents = data?.items.reduce((sum, batch) => sum + batch.studentCount, 0) ?? 0

  return (
    <>
      <PageHeader
        eyebrow="Academic office · Term 2026–27"
        title="Batches"
        description="Every batch in the current term, with roster size, lead faculty and paper count. Archived batches stay visible for records."
        meta={
          <>
            <span className="font-mono text-2xs tabular-nums text-muted">
              {isPending ? '—' : `${data?.total ?? 0} batches`}
            </span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <span className="font-mono text-2xs tabular-nums text-muted">
              {isPending ? '—' : `${formatNumber(totalStudents)} students`}
            </span>
          </>
        }
        actions={
          <Button
            variant="secondary"
            icon={<ArrowDownUp strokeWidth={1.5} />}
            onClick={() => setOrder((value) => (value === 'asc' ? 'desc' : 'asc'))}
          >
            {order === 'desc' ? 'Newest first' : 'Oldest first'}
          </Button>
        }
      />

      <div className="mb-5 max-w-sm">
        <Input
          label="Search batches"
          type="search"
          placeholder="Batch name, track or faculty"
          icon={<Search strokeWidth={1.5} />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          hint="Matches against batch name, track and lead faculty."
        />
      </div>

      {isPending ? (
        <div className="overflow-hidden rounded-md border border-line" role="status" aria-busy="true">
          <span className="sr-only">Loading batches</span>
          <div className="border-b border-line bg-surface-sunken px-4 py-3" aria-hidden="true">
            <Skeleton.Line className="w-40" />
          </div>
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-center gap-6 border-b border-line px-4 py-4 last:border-b-0" aria-hidden="true">
              <Skeleton.Line className="w-48" />
              <Skeleton.Line className="w-20" />
              <Skeleton.Line className="w-16" />
              <Skeleton.Line className="ml-auto w-24" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState code="E_BATCHES"
          icon={<RotateCw strokeWidth={1.5} />}
          title="The batch register could not load"
          description={
            /** @type {any} */ (error)?.message ??
            'The register did not return. No records were changed. Try again, and if it keeps failing the platform team needs to check the academics service.'
          }
          action={
            <Button variant="secondary" icon={<RotateCw strokeWidth={1.5} />} onClick={() => refetch()} loading={isRefetching}>
              Try again
            </Button>
          }
        />
      ) : (data?.items.length ?? 0) === 0 ? (
        <ErrorState
          code="E_NO_MATCH"
          icon={<Search strokeWidth={1.5} />}
          title={search ? `No batch matches “${search}”` : 'No batches in this term'}
          description={
            search
              ? 'Search matches batch name, track and lead faculty. Clear the field to see the full register.'
              : 'Batches are created by the academic office before a session opens.'
          }
          action={
            search ? (
              <Button variant="secondary" onClick={() => setSearch('')}>
                Clear search
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <caption className="sr-only">Batches in the 2026–27 session 2 term</caption>
            <thead>
              <tr className="bg-surface-sunken">
                <th scope="col" className="rule-label px-4 py-2.5 font-normal">Batch</th>
                <th scope="col" className="rule-label hidden px-4 py-2.5 font-normal sm:table-cell">Track</th>
                <th scope="col" className="rule-label px-4 py-2.5 text-right font-normal">Students</th>
                <th scope="col" className="rule-label px-4 py-2.5 font-normal">Lead faculty</th>
                <th scope="col" className="rule-label hidden px-4 py-2.5 font-normal md:table-cell">Schedule</th>
                <th scope="col" className="rule-label px-4 py-2.5 text-right font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((batch) => (
                <tr key={batch.id} data-row className="border-t border-line bg-surface-raised transition-colors hover:bg-surface-sunken">
                  <th scope="row" className="px-4 py-3.5">
                    <span className="block text-xs font-[580] tracking-tight text-heading">{batch.name}</span>
                    <span className="mt-0.5 block font-mono text-2xs tabular-nums text-faint">
                      {batch.cohort === 'dropper' ? 'Droppers' : batch.cohort === 'class12' ? 'Class 12' : 'Class 11'} ·{' '}
                      {batch.testCount} papers
                    </span>
                  </th>
                  <td className="hidden px-4 py-3.5 sm:table-cell">
                    <Badge tone="neutral" variant="outline">{batch.track}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-xs tabular-nums text-body">
                    {formatNumber(batch.studentCount)}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-body">{batch.facultyLead}</td>
                  <td className="hidden px-4 py-3.5 font-mono text-2xs tabular-nums text-muted md:table-cell">
                    {batch.scheduleLabel}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Badge tone={batch.status === 'active' ? 'answer' : 'idle'} variant="outline" className="uppercase">
                      {batch.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
