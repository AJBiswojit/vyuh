import { AlertTriangle } from 'lucide-react'
import { Badge, Card, EmptyState } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'
import { formatDate } from '@/shared/lib/format.js'

/**
 * The cohort register. Percentages carry a bar as well as a number, and the
 * defaulter mark is a labelled chip rather than a red row — a colour alone would
 * not survive a printed sheet, which is where attendance lists usually end up.
 *
 * @param {Object} props
 * @param {import('@/contracts/faculty.js').AttendanceReport} props.report
 * @param {boolean} props.defaultersOnly
 * @param {React.ReactNode} [props.action]
 */
export function AttendanceTable({ report, defaultersOnly, action }) {
  const threshold = report.thresholdPercent
  return (
    <Card
      eyebrow={report.periodLabel}
      title={`Register · ${report.rows.length} of ${report.summary.students} students`}
      action={action}
    >
      <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
        <Stat label="Average" value={`${report.summary.averagePercent.toFixed(1)}%`} />
        <Stat label="Defaulters" value={String(report.summary.defaulters)} tone={report.summary.defaulters > 0 ? 'danger' : undefined} />
        <Stat label="Sessions held" value={String(report.summary.sessionsHeld)} />
        <Stat label="Threshold" value={`${threshold}%`} />
      </dl>

      {report.rows.length === 0 ? (
        <EmptyState
          code="0 ROWS"
          title={defaultersOnly ? 'Nobody is below the threshold' : 'No attendance recorded for this batch'}
          description={defaultersOnly ? 'Clear the defaulter filter to see the full register.' : 'Run a live session and the register fills itself.'}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-xs" data-testid="attendance-table">
            <caption className="sr-only">Attendance by candidate for the selected batch</caption>
            <thead>
              <tr className="border-b border-line text-2xs uppercase tracking-widest text-faint">
                <th scope="col" className="py-2 pr-3 font-normal">Candidate</th>
                <th scope="col" className="py-2 pr-3 font-normal">Roll</th>
                <th scope="col" className="py-2 pr-3 font-normal">Present</th>
                <th scope="col" className="py-2 pr-3 font-normal">Percent</th>
                <th scope="col" className="py-2 pr-3 font-normal">Attention</th>
                <th scope="col" className="py-2 pr-3 font-normal">Last present</th>
                <th scope="col" className="py-2 font-normal">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.studentId} className="border-b border-line last:border-0">
                  <th scope="row" className="py-2.5 pr-3 font-[560] text-heading">{row.name}</th>
                  <td className="py-2.5 pr-3 font-mono text-2xs tabular-nums text-faint">{row.rollNumber}</td>
                  <td className="py-2.5 pr-3 font-mono text-2xs tabular-nums text-muted">{row.present}/{row.sessionsHeld}</td>
                  <td className="py-2.5 pr-3">
                    <span className="flex items-center gap-2">
                      <span className="relative h-1.5 w-16 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                        <span className={cn('absolute inset-y-0 left-0 rounded-full', row.defaulter ? 'bg-danger' : 'bg-answer')} style={{ width: `${Math.min(100, row.percent)}%` }} />
                      </span>
                      <span className="font-mono text-2xs tabular-nums text-heading">{row.percent.toFixed(1)}%</span>
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-2xs tabular-nums text-muted">{row.attentionAverage}</td>
                  <td className="py-2.5 pr-3 font-mono text-2xs tabular-nums text-faint">{formatDate(row.lastPresentAt)}</td>
                  <td className="py-2.5">
                    {row.defaulter ? (
                      <Badge tone="danger" variant="soft" shape="ring" className="whitespace-nowrap">
                        <AlertTriangle className="mr-1 size-3" strokeWidth={2} aria-hidden="true" />
                        Below {threshold}%
                      </Badge>
                    ) : (
                      <Badge tone="answer" variant="soft" shape="square">On track</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

/** @param {{ label: string, value: string, tone?: 'danger' }} props */
function Stat({ label, value, tone }) {
  return (
    <div>
      <dt className="rule-label">{label}</dt>
      <dd className={cn('mt-1 font-mono text-sm tabular-nums', tone === 'danger' ? 'text-danger-fg' : 'text-heading')}>{value}</dd>
    </div>
  )
}
