import { useState } from 'react'
import { Download } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Button, ErrorState, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime } from '@/shared/lib/format.js'
import { useBatches } from '@/features/batches/hooks/useBatches.js'
import { useExportAttendance, useFacultyAttendance } from '../hooks/useFacultyLive.js'
import { AttendanceTable } from '../components/AttendanceTable.jsx'

/**
 * The register. One batch at a time, with the defaulter filter as the only
 * filter — an attendance list is read to answer "who is short", not to browse.
 * Export writes the same rows the table is showing.
 */
export function FacultyAttendancePage() {
  useDocumentTitle('Attendance')
  const toast = useToast()
  const batches = useBatches({ pageSize: 20 })
  const [batchId, setBatchId] = useState('bat-neet-12')
  const [defaultersOnly, setDefaultersOnly] = useState(false)
  const filter = { batchId, defaultersOnly }
  const report = useFacultyAttendance(filter)
  const exportCsv = useExportAttendance()

  const download = () =>
    exportCsv.mutate(filter, {
      onSuccess: (payload) => {
        const blob = new Blob([payload.csv], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = payload.fileName
        document.body.append(anchor)
        anchor.click()
        anchor.remove()
        URL.revokeObjectURL(url)
        toast.success('CSV exported', `${payload.rows} rows · ${payload.fileName}`)
      },
      onError: (/** @type {Error} */ error) => toast.error('Export failed', error.message),
    })

  return (
    <>
      <PageHeader
        eyebrow="Faculty workspace · Attendance"
        title="Attendance reports"
        description="Present marks and attention averages for the term, with the defaulter line drawn at the policy threshold. A session counts a student present after ten minutes in the room."
        meta={
          report.data ? (
            <>
              <span className="font-mono text-2xs tabular-nums text-muted">{report.data.summary.averagePercent.toFixed(1)}% average</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="font-mono text-2xs tabular-nums text-muted">
                {report.data.summary.defaulters} of {report.data.summary.students} below {report.data.thresholdPercent}%
              </span>
            </>
          ) : null
        }
      />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-sm border border-line bg-surface-raised px-3 py-2.5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full min-w-[14rem] max-w-xs">
            <label htmlFor="attendance-batch" className="mb-2 block text-xs font-[560] tracking-tight text-heading">
              Batch
            </label>
            <select
              id="attendance-batch"
              value={batchId}
              onChange={(event) => setBatchId(event.target.value)}
              className="min-h-[var(--spacing-touch)] w-full rounded-sm border border-line-strong bg-surface-raised px-3 text-xs text-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              {(batches.data?.items ?? []).map((batch) => (
                <option key={batch.id} value={batch.id}>{batch.name}</option>
              ))}
            </select>
          </div>
          <label className="flex min-h-[var(--spacing-touch)] items-center gap-2 text-2xs text-body">
            <input
              type="checkbox"
              checked={defaultersOnly}
              onChange={(event) => setDefaultersOnly(event.target.checked)}
              className="size-4 accent-[var(--color-ember)]"
            />
            Defaulters only
          </label>
        </div>
        <Button
          variant="secondary"
          icon={<Download strokeWidth={1.5} />}
          loading={exportCsv.isPending}
          onClick={download}
        >
          Export CSV
        </Button>
      </div>

      {report.isPending ? (
        <div className="space-y-2" role="status" aria-busy="true">
          <span className="sr-only">Loading the register</span>
          <Skeleton.Block className="h-20 rounded-sm" />
          {[0, 1, 2, 3, 4, 5].map((index) => <Skeleton.Block key={index} className="h-10 rounded-sm" />)}
        </div>
      ) : report.isError ? (
        <ErrorState
          code="E_ATTENDANCE"
          title="The register did not load"
          description={/** @type {Error} */ (report.error)?.message ?? 'Nothing was changed. Try again.'}
          action={<Button variant="secondary" onClick={() => report.refetch()} loading={report.isFetching}>Try again</Button>}
        />
      ) : report.data ? (
        <div className="flex flex-col gap-3">
          <AttendanceTable
            report={report.data}
            defaultersOnly={defaultersOnly}
            action={<span className="font-mono text-2xs tabular-nums text-faint">updated {formatDateTime(report.data.updatedAt)}</span>}
          />
          <p className="text-2xs leading-relaxed text-muted">
            Export is a mock: the CSV is built from the rows above and downloaded in the browser, so the file and the table cannot disagree.
            Attention average is a session-level measure and never changes the attendance percentage.
          </p>
        </div>
      ) : null}
    </>
  )
}
