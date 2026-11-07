import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, GraduationCap, Search, X } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, EmptyState, ErrorState, Input, Select, Skeleton } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatNumber } from '@/shared/lib/format.js'
import { useAdminBatches } from '../hooks/useAdmin.js'

const TRACK_LABELS = { JEE: 'JEE', NEET: 'NEET', NTA: 'Foundation' }
const COHORT_LABELS = { class11: 'Class 11', class12: 'Class 12', dropper: 'Dropper' }

/**
 * Every batch the office runs, with the three facts it is judged on: how full it
 * is, who teaches it and whether it is turning up. The row opens the batch,
 * where the roster and the faculty allocation actually live.
 */
export function AdminBatchesPage() {
  useDocumentTitle('Batches')
  const batches = useAdminBatches()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [status, setStatus] = useState('all')

  const all = batches.data ?? []
  const rows = all
    .filter((batch) => (status === 'all' ? true : batch.status === status))
    .filter((batch) => {
      const term = deferredSearch.trim().toLowerCase()
      if (!term) return true
      return [batch.name, batch.track, batch.room, ...batch.facultyNames].some((value) =>
        String(value).toLowerCase().includes(term),
      )
    })

  const active = all.filter((batch) => batch.status === 'active')
  const students = all.reduce((sum, batch) => sum + batch.studentCount, 0)
  const seats = all.reduce((sum, batch) => sum + batch.capacity, 0)
  const dirty = search !== '' || status !== 'all'

  return (
    <>
      <PageHeader
        eyebrow="Academic office · Term 2026–27"
        title="Batches and courses"
        description="Every batch in the current term, its room, its size and its faculty. Archived batches stay visible because their records still matter to a transcript."
        meta={
          batches.data ? (
            <>
              <span className="font-mono text-2xs tabular-nums text-muted">{active.length} active</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="font-mono text-2xs tabular-nums text-muted">{formatNumber(students)} students</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="font-mono text-2xs tabular-nums text-muted">{formatNumber(seats - students)} seats free</span>
            </>
          ) : null
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-sm border border-line bg-surface-raised p-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)_auto] sm:items-end">
        <Input
          label="Search batches"
          type="search"
          placeholder="Batch, track, room or faculty"
          icon={<Search strokeWidth={1.5} />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={[
            { value: 'all', label: 'Active and archived' },
            { value: 'active', label: `Active · ${active.length}` },
            { value: 'archived', label: `Archived · ${all.length - active.length}` },
          ]}
        />
        <Button
          variant="ghost"
          icon={<X strokeWidth={1.5} />}
          onClick={() => { setSearch(''); setStatus('all') }}
          disabled={!dirty}
        >
          Clear
        </Button>
      </div>

      {batches.isPending ? (
        <div role="status" aria-busy="true" className="space-y-2">
          <span className="sr-only">Loading batches</span>
          {[0, 1, 2, 3, 4].map((key) => <Skeleton.Block key={key} className="h-14" />)}
        </div>
      ) : batches.isError ? (
        <ErrorState
          code="E_BATCHES"
          title="Batches could not load"
          description={/** @type {Error} */ (batches.error)?.message ?? 'Try again.'}
          action={<Button variant="secondary" onClick={() => batches.refetch()} loading={batches.isFetching}>Try again</Button>}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          size="panel"
          icon={<GraduationCap strokeWidth={1.5} />}
          title="No batch matches those filters"
          description="Clear the search, or switch the status filter back to both."
          code={`0 of ${all.length}`}
          action={dirty ? <Button variant="secondary" onClick={() => { setSearch(''); setStatus('all') }}>Clear filters</Button> : null}
        />
      ) : (
        <div className="overflow-x-auto rounded-sm border border-line">
          <table className="w-full border-collapse text-left text-xs">
            <caption className="sr-only">Batches in the current term</caption>
            <thead>
              <tr className="border-b border-line bg-surface-sunken">
                <th scope="col" className="rule-label px-4 py-3 font-normal">Batch</th>
                <th scope="col" className="rule-label px-4 py-3 font-normal">Track</th>
                <th scope="col" className="rule-label px-4 py-3 font-normal text-right">Students</th>
                <th scope="col" className="rule-label px-4 py-3 font-normal text-right">Attendance</th>
                <th scope="col" className="rule-label px-4 py-3 font-normal">Faculty</th>
                <th scope="col" className="rule-label px-4 py-3 font-normal">Status</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((batch) => (
                <tr key={batch.id} data-testid={`batch-row-${batch.id}`} className="border-b border-line last:border-0 hover:bg-surface-sunken/60">
                  <td className="px-4 py-3">
                    <span className="block font-[560] text-heading">{batch.name}</span>
                    <span className="mt-0.5 block text-2xs text-muted">{batch.scheduleLabel} · {batch.room}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-heading">{TRACK_LABELS[batch.track] ?? batch.track}</span>
                    <span className="mt-0.5 block text-2xs text-muted">{COHORT_LABELS[batch.cohort] ?? batch.cohort}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono tabular-nums text-heading">{batch.studentCount}</span>
                    <span className="font-mono text-2xs tabular-nums text-faint"> / {batch.capacity}</span>
                    <span className="mt-1.5 block h-1 w-full min-w-16 rounded-full bg-surface-sunken" aria-hidden="true">
                      <span
                        className="block h-1 rounded-full bg-ember"
                        style={{ width: `${Math.min(100, Math.round((batch.studentCount / batch.capacity) * 100))}%` }}
                      />
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-heading">{batch.attendancePercent.toFixed(1)}%</td>
                  <td className="max-w-[18rem] px-4 py-3">
                    <span className="block truncate text-2xs text-body">{batch.facultyNames.join(' · ') || 'Unassigned'}</span>
                    <span className="mt-0.5 block text-2xs text-muted">{batch.facultyNames.length} faculty</span>
                  </td>
                  <td className="px-4 py-3">
                    {batch.status === 'active' ? (
                      <Badge tone="answer" variant="soft" shape="square">Active</Badge>
                    ) : (
                      <Badge tone="idle" variant="soft" shape="hollow">Archived</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/batches/${batch.id}`}
                      className="inline-flex items-center gap-1 rounded-xs px-1.5 py-1 text-2xs font-[560] text-heading hover:text-ember-press"
                    >
                      Open
                      <ArrowUpRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {batches.data ? (
        <p className="mt-3 font-mono text-2xs tabular-nums text-muted" role="status">
          {rows.length} of {all.length} batches shown · {formatNumber(students)} students on the roster
        </p>
      ) : null}
    </>
  )
}
