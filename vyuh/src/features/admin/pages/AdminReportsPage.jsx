import { useMemo, useState } from 'react'
import { Download, FileSpreadsheet, Info, Play } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, EmptyState, Input, Select, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime, formatNumber } from '@/shared/lib/format.js'
import { useRunReport } from '../hooks/useAdminOps.js'

const KINDS = [
  { value: 'attendance', label: 'Attendance', description: 'Sessions held, present marks and defaulters per batch.' },
  { value: 'results', label: 'Results', description: 'Papers sat in the range, with mean, highest and the share above 40%.' },
  { value: 'engagement', label: 'Engagement', description: 'Active accounts, doubts asked, recordings watched and live minutes.' },
]

const FORMATS = [
  { value: 'csv', label: 'CSV · produced by the mock' },
  { value: 'xlsx', label: 'XLSX · request recorded, CSV produced' },
  { value: 'pdf', label: 'PDF · request recorded, CSV produced' },
]

/** @param {Date} date */
function isoDay(date) {
  return date.toISOString().slice(0, 10)
}

/**
 * Reports. One form asks what, when and in what shape; the result is previewed
 * before it is downloaded, because an export nobody looked at is how a wrong
 * number reaches a committee. The mock produces CSV for every format and says so.
 */
export function AdminReportsPage() {
  useDocumentTitle('Reports')
  const run = useRunReport()
  const toast = useToast()

  const today = useMemo(() => new Date(), [])
  const monthAgo = useMemo(() => new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), [])
  const [kind, setKind] = useState('attendance')
  const [from, setFrom] = useState(isoDay(monthAgo))
  const [to, setTo] = useState(isoDay(today))
  const [format, setFormat] = useState('csv')

  const result = run.data
  const definition = KINDS.find((candidate) => candidate.value === kind)

  const generate = () => {
    run.mutate(
      { kind, from, to, format },
      {
        onSuccess: (payload) => toast.success('Report generated', `${payload.summary.rows} rows · ${payload.formatLabel}`),
        onError: (/** @type {Error} */ error) => toast.error('Not generated', error.message),
      },
    )
  }

  const download = () => {
    if (!result) return
    const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = result.fileName
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    toast.success('Export downloaded', `${result.fileName} · ${formatNumber(result.rows.length)} rows`)
  }

  return (
    <>
      <PageHeader
        eyebrow="Academic office · Reports"
        title="Reports"
        description="Attendance, results and engagement over a date range. The preview is the file: what you read here is what downloads."
        meta={
          <span className="font-mono text-2xs tabular-nums text-muted">Mock export · CSV payload for every format</span>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)]">
        <Card eyebrow="Build" title="What do you need?">
          <div className="flex flex-col gap-4">
            <Select
              label="Report"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              options={KINDS.map((candidate) => ({ value: candidate.value, label: candidate.label }))}
              hint={definition?.description}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="From"
                type="date"
                value={from}
                max={to}
                onChange={(event) => setFrom(event.target.value)}
              />
              <Input
                label="To"
                type="date"
                value={to}
                min={from}
                max={isoDay(today)}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
            <Select
              label="Format"
              value={format}
              onChange={(event) => setFormat(event.target.value)}
              options={FORMATS}
              hint={
                format === 'csv'
                  ? 'Comma separated, UTF-8 with a header row.'
                  : 'The mock records the request and produces CSV; no spreadsheet or PDF writer is wired in this build.'
              }
            />
            <div className="flex items-start gap-2 rounded-sm border border-line bg-surface-sunken px-3 py-2">
              <Info className="mt-0.5 size-3.5 shrink-0 text-info-fg" strokeWidth={1.75} aria-hidden="true" />
              <p className="text-2xs leading-relaxed text-muted">
                Generating a report writes an entry to the audit ledger, so an export can always be traced to a person
                and a time.
              </p>
            </div>
            <Button variant="primary" icon={<Play strokeWidth={1.5} />} onClick={generate} loading={run.isPending} disabled={!from || !to || from > to}>
              Generate report
            </Button>
            {run.isError ? (
              <p role="alert" className="text-2xs text-danger-fg">{/** @type {Error} */ (run.error)?.message}</p>
            ) : null}
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          {run.isPending && !result ? (
            <Card eyebrow="Preview" title="Producing the rows">
              <div role="status" aria-busy="true" className="space-y-2">
                <span className="sr-only">Generating the report</span>
                {[0, 1, 2, 3, 4].map((key) => <Skeleton.Block key={key} className="h-8" />)}
              </div>
            </Card>
          ) : !result ? (
            <EmptyState
              size="panel"
              icon={<FileSpreadsheet strokeWidth={1.5} />}
              title="No report generated yet"
              description="Choose a range and a report, then generate. The rows appear here before any file is downloaded."
              code="0 rows"
            />
          ) : (
            <>
              <Card
                eyebrow={`${result.kindLabel} · ${result.from} to ${result.to}`}
                title="Report preview"
                action={<Badge tone="neutral" variant="outline" shape="square" mono>{result.formatLabel}</Badge>}
                footer={
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-mono text-2xs tabular-nums text-muted" data-testid="report-summary">
                      {result.summary.note} · generated {formatDateTime(result.generatedAt)}
                    </p>
                    <Button variant="secondary" icon={<Download strokeWidth={1.5} />} onClick={download}>
                      Download {result.formatAvailable ? result.formatLabel : 'CSV'}
                    </Button>
                  </div>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <caption className="sr-only">{result.kindLabel} report for {result.from} to {result.to}</caption>
                    <thead>
                      <tr className="border-b border-line">
                        {result.columns.map((column) => (
                          <th key={column.key} scope="col" className={`rule-label py-2 pr-3 font-normal ${column.align === 'right' ? 'text-right' : ''}`}>
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, index) => (
                        <tr key={row.batch ?? row.paper ?? index} className="border-b border-line last:border-0">
                          {result.columns.map((column) => (
                            <td
                              key={column.key}
                              className={`py-2 pr-3 tabular-nums text-body ${column.align === 'right' ? 'text-right font-mono' : ''}`}
                            >
                              {String(row[column.key] ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {result.format !== 'csv' ? (
                  <p className="mt-3 flex items-start gap-2 text-2xs leading-relaxed text-muted">
                    <Info className="mt-0.5 size-3.5 shrink-0 text-info-fg" strokeWidth={1.75} aria-hidden="true" />
                    You asked for {result.formatLabel}. This build records the request and writes CSV — the file
                    downloads with a .csv extension so it is not mistaken for a real spreadsheet.
                  </p>
                ) : null}
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  )
}
