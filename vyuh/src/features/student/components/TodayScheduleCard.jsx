import { Link } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { Card } from '@/shared/ui/Card.jsx'
import { Badge } from '@/shared/ui/Badge.jsx'
import { EmptyState } from '@/shared/ui/EmptyState.jsx'
import { formatRelative } from '@/shared/lib/format.js'

/** Today's live classes; each row opens the Phase 6 schedule/room. */
/** @param {{ sessions: import('@/contracts/live.js').LiveSession[] }} props */
export function TodayScheduleCard({ sessions }) {
  return (
    <Card eyebrow="Today’s schedule" title="Live classes" action={<Link to="/student/live" className="text-2xs font-[560] text-heading hover:text-ember-press">All classes</Link>}>
      {sessions.length === 0 ? (
        <EmptyState title="No classes today" description="The next published session appears here and on Live classes." code="0 classes" />
      ) : (
        <ul className="divide-y divide-line">
          {sessions.map((session) => (
            <li key={session.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-widest text-faint">
                  {session.status === 'live' ? <><Radio className="size-3 text-info-fg" strokeWidth={1.5} aria-hidden="true" /><span className="text-info-fg">Live</span></> : formatRelative(session.startsAt)}
                  <span aria-hidden="true">·</span>{session.subjectName}
                </p>
                <p className="mt-1 truncate text-xs font-[560] text-heading">{session.title}</p>
                <p className="mt-0.5 truncate text-2xs text-faint">{session.facultyName}</p>
              </div>
              <Badge tone={session.status === 'live' ? 'info' : 'neutral'} variant="outline" mono>{session.durationMinutes}m</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
