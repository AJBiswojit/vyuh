import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { Badge, Button, Card, ErrorState, Skeleton } from '@/shared/ui'
import { formatDate } from '@/shared/lib/format.js'
import { PresenceRing } from '../components/PresenceRing.jsx'
import { VerdictChip } from '../components/VerdictChip.jsx'
import { useAttendanceReport, useLearningStudentId } from '../hooks/useLearning.js'

/** Monthly summary, plain-words policy, and a per-session register. */
export function AttendancePage() {
  useDocumentTitle('Attendance')
  const studentId = useLearningStudentId()
  const query = useAttendanceReport(studentId)
  const report = query.data
  return (
    <div>
      <PageHeader eyebrow="Learning · Attendance" title="Attendance" description="Automatic presence from live rooms, with a plain-words threshold and grace rule." />
      {query.isPending ? <Skeleton.Region label="Loading attendance"><Skeleton.Block className="h-40" /><div className="mt-4 space-y-2"><Skeleton.Line /><Skeleton.Line /><Skeleton.Line /></div></Skeleton.Region> : query.isError || !report ? <ErrorState title="Attendance could not load" description={query.error?.message ?? 'Try again in a moment.'} action={<Button variant="secondary" onClick={() => query.refetch()}>Try again</Button>} /> : (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
            <Card eyebrow={report.periodLabel} title="Monthly summary">
              <div className="flex items-center gap-4">
                <PresenceRing percent={report.summary.percentage} size={72} label="Monthly attendance" />
                <div><p className="font-mono text-2xl tabular-nums text-heading">{report.summary.percentage.toFixed(1)}%</p><p className="mt-1 text-2xs text-muted">{report.summary.present} of {report.summary.total} sessions Present · {report.summary.currentStreak}-session streak</p></div>
              </div>
              {report.defaulter ? <p role="alert" className="mt-4 flex items-start gap-2 rounded-sm border border-danger px-3 py-2 text-2xs leading-relaxed text-danger-fg"><AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />Below the {report.policy.thresholdPercent}% threshold. Attend the next live room and answer attention checks to recover.</p> : <p className="mt-4 text-2xs leading-relaxed text-answer-fg">Above the {report.policy.thresholdPercent}% threshold this month.</p>}
            </Card>
            <Card eyebrow="How presence is counted" title="Threshold and grace, in plain words">
              <p className="max-w-prose text-xs leading-relaxed text-body">{report.explanation}</p>
            </Card>
          </div>
          <Card eyebrow="Session register" title="Per-session presence" action={<Badge tone="neutral" variant="outline" mono>{report.sessions.length} sessions</Badge>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] text-left text-xs">
                <caption className="sr-only">Attendance by session, newest first</caption>
                <thead><tr className="border-b border-line text-2xs uppercase tracking-widest text-faint"><th scope="col" className="py-2 pr-3 font-normal">Session</th><th scope="col" className="py-2 pr-3 font-normal">Date</th><th scope="col" className="py-2 pr-3 font-normal">Verdict</th><th scope="col" className="py-2 text-right font-normal">Time credit</th></tr></thead>
                <tbody>
                  {report.sessions.map((row) => (
                    <tr key={row.sessionId} className="border-b border-line last:border-0">
                      <th scope="row" className="py-3 pr-3 font-[560] text-heading"><span className="block">{row.title}</span><span className="mt-0.5 block text-2xs font-normal text-muted">{row.subjectName} · {row.batchName}{row.live ? ' · live register' : ''}</span></th>
                      <td className="py-3 pr-3 font-mono text-2xs tabular-nums text-muted">{formatDate(row.date)}</td>
                      <td className="py-3 pr-3"><VerdictChip verdict={row.verdict} percent={row.presencePercent} /></td>
                      <td className="py-3 text-right font-mono text-2xs tabular-nums text-body">{row.attendedMinutes}/{row.eligibleMinutes} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
