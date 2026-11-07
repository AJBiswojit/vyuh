import { StatusDot } from '@/shared/ui/StatusDot.jsx'
import { Radio, Users } from 'lucide-react'
import { Card } from '@/shared/ui/Card.jsx'
import { formatRelative } from '@/shared/lib/format.js'
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion.js'

/**
 * Live classes. Three shapes in one card: sessions running now, sessions later
 * today, and the empty state when the roster is clear. The live row is the only
 * thing on the dashboard with a pulse, because it is the only thing happening
 * this minute.
 *
 * @param {{ sessions: import('../../../contracts/live.js').LiveSession[] }} props
 */
export function LiveNowCard({ sessions }) {
  const reduced = usePrefersReducedMotion()
  const live = sessions.filter((session) => session.status === 'live')
  const later = sessions.filter((session) => session.status === 'scheduled')
  const upcoming = [...live, ...later]

  return (
    <Card
      eyebrow="Today"
      title={live.length > 0 ? 'Live now' : 'Classes'}
      action={
        live.length > 0 ? (
          <span className="flex items-center gap-1.5">
            <StatusDot tone="info" label="A class is live" animate={!reduced} />
            <span className="font-mono text-2xs uppercase tracking-widest text-info-fg">Live</span>
          </span>
        ) : null
      }
    >
      {upcoming.length === 0 ? (
        <div className="border-l-2 border-l-line-strong pl-3">
          <p className="text-sm text-heading">No classes scheduled today.</p>
          <p className="mt-1 text-xs text-muted">
            The next session appears here once faculty publish it. Use the gap for the chapters flagged in your
            last report.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {upcoming.map((session) => (
            <li key={session.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-widest text-faint">
                  {session.status === 'live' ? (
                    <>
                      <Radio className="size-3 text-info-fg" strokeWidth={1.5} aria-hidden="true" />
                      <span className="text-info-fg">Live</span>
                    </>
                  ) : (
                    <span>{formatRelative(session.startsAt)}</span>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>{session.subjectName}</span>
                </p>
                <p className="mt-1 truncate text-xs font-[560] tracking-tight text-heading">{session.title}</p>
                <p className="mt-0.5 truncate text-2xs text-faint">{session.facultyName}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="flex items-center justify-end gap-1 font-mono text-2xs tabular-nums text-muted">
                  <Users className="size-3" strokeWidth={1.5} aria-hidden="true" />
                  {session.attendingCount}/{session.capacity}
                </p>
                <p className="mt-0.5 font-mono text-2xs tabular-nums text-faint">{session.durationMinutes}m</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
