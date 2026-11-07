import { Card } from '@/shared/ui/Card.jsx'
import { Badge } from '@/shared/ui/Badge.jsx'

/** Dashboard summary; the full Phase 6 register lives at /student/attendance. */
/** @param {{ summary: import('@/contracts/student.js').AttendanceSummary }} props */
export function AttendanceSummaryCard({ summary }) {
  return (
    <Card eyebrow="Attendance" title={summary.periodLabel} action={<Badge tone={summary.percentage >= 75 ? 'answer' : 'review'} variant="outline" mono>{summary.percentage.toFixed(1)}%</Badge>}>
      <dl className="grid grid-cols-3 gap-4">
        <div><dt className="rule-label">Present</dt><dd className="mt-1 font-mono text-lg tabular-nums text-heading">{summary.present}</dd></div>
        <div><dt className="rule-label">Classes</dt><dd className="mt-1 font-mono text-lg tabular-nums text-heading">{summary.total}</dd></div>
        <div><dt className="rule-label">Streak</dt><dd className="mt-1 font-mono text-lg tabular-nums text-heading">{summary.currentStreak}d</dd></div>
      </dl>
      <p className="mt-4 text-2xs leading-relaxed text-muted">Open Attendance for the session register, threshold and grace rule.</p>
    </Card>
  )
}
