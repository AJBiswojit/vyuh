import { CalendarClock, MapPin } from 'lucide-react'
import { Card } from '@/shared/ui/Card.jsx'
import { Badge } from '@/shared/ui/Badge.jsx'
import { formatDateTime, formatRelative } from '@/shared/lib/format.js'

/**
 * The next scheduled paper. Facts only: pattern, duration, marking, reporting
 * time. No countdown ticker — a ticking clock on a dashboard is decoration; the
 * exam runner owns the real timer.
 *
 * @param {{ test: import('../../../contracts/assessment.js').Test }} props
 */
export function NextUpCard({ test }) {
  return (
    <Card
      eyebrow="Next paper"
      title={test.title}
      action={<Badge variant="primary" variant="outline">Scheduled</Badge>}
      footer={
        <p className="flex items-center gap-1.5 text-2xs text-faint">
          <MapPin className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          Jaydev Vihar centre · Block C, first floor
        </p>
      }
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <dt className="rule-label">Starts</dt>
          <dd className="mt-1 flex items-center gap-1.5 font-mono text-xs tabular-nums text-heading">
            <CalendarClock className="size-3.5 text-faint" strokeWidth={1.5} aria-hidden="true" />
            {test.scheduledFor ? formatDateTime(test.scheduledFor) : 'Timed on release'}
          </dd>
          <dd className="mt-1 text-2xs text-faint">{test.scheduledFor ? formatRelative(test.scheduledFor) : ''}</dd>
        </div>
        <div>
          <dt className="rule-label">Duration</dt>
          <dd className="mt-1 font-mono text-xs tabular-nums text-heading">{test.durationMinutes} min</dd>
          <dd className="mt-1 text-2xs text-faint">Reporting 15 min before</dd>
        </div>
        <div>
          <dt className="rule-label">Pattern</dt>
          <dd className="mt-1 font-mono text-xs tabular-nums text-heading">
            {test.questionCount} Q · {test.maxMarks} marks
          </dd>
        </div>
        <div>
          <dt className="rule-label">Marking</dt>
          <dd className="mt-1 font-mono text-xs tabular-nums text-heading">+4 / −1</dd>
        </div>
      </dl>
    </Card>
  )
}
