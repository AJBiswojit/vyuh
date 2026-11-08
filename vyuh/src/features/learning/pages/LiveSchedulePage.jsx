import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Radio } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { Badge, Button, EmptyState, ErrorState, Skeleton } from '@/shared/ui'
import { formatDateTime, formatRelative } from '@/shared/lib/format.js'
import { groupSessionsByDay } from '@/shared/lib/learningMath.js'
import { useLearningStudentId, useLiveSchedule } from '../hooks/useLearning.js'

/**
 * An ended class links to the recording its own fixture names — never a
 * hard-coded id. If no recording is published, say so instead of linking to
 * somebody else's replay.
 * @param {import('@/contracts/live.js').LiveSession} session
 */
function endedAction(session) {
  const href = session.recordingId
    ? `/student/recordings/${session.recordingId}`
    : /^\/student\/recordings\/[^/?#]+/.test(session.joinUrl ?? '') ? session.joinUrl : null
  if (!href) return <span className="inline-flex min-h-11 shrink-0 items-center rounded-sm border border-line px-4 font-mono text-2xs text-faint">Recording not published yet</span>
  return <Link to={href} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-sm border border-line-strong px-4 text-xs font-[560] text-heading hover:border-heading">Watch recording</Link>
}

/** Schedule grouped by day, with mode chips and batch names. */
export function LiveSchedulePage() {
  useDocumentTitle('Live classes')
  const studentId = useLearningStudentId()
  const query = useLiveSchedule(studentId)
  const [mode, setMode] = useState('all')
  const sessions = (query.data ?? []).filter((session) => mode === 'all' || session.mode === mode)
  const groups = groupSessionsByDay(sessions)
  return (
    <div>
      <PageHeader eyebrow="Learning · Live" title="Live classes" description="Your batch schedule, grouped by day. Interactive rooms open mic and camera; broadcast rooms are faculty-led with a question queue." actions={<Link to="/student/attendance" className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line-strong px-4 text-xs font-[560] text-heading hover:border-heading"><Calendar className="size-4" strokeWidth={1.5} aria-hidden="true" />Attendance</Link>} />
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by class mode">
        {[['all', 'All modes'], ['interactive', 'Interactive'], ['broadcast', 'Broadcast']].map(([value, label]) => (
          <Button key={value} variant="ghost" size="sm" aria-pressed={mode === value} onClick={() => setMode(value)} className={mode === value ? 'bg-surface-sunken text-heading' : ''}>{label}</Button>
        ))}
      </div>
      {query.isPending ? <Skeleton.Region label="Loading live schedule"><div className="space-y-3"><Skeleton.Block className="h-24" /><Skeleton.Block className="h-24" /><Skeleton.Block className="h-24" /></div></Skeleton.Region> : query.isError ? <ErrorState title="Schedule could not load" description={query.error.message} action={<Button variant="secondary" onClick={() => query.refetch()}>Try again</Button>} /> : groups.length === 0 ? <EmptyState title="No classes in this mode" description="Switch the mode filter or check tomorrow’s schedule." size="panel" /> : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`day-${group.key}`}>
              <h2 id={`day-${group.key}`} className="mb-3 flex items-baseline gap-3 text-sm font-[560] text-heading">{group.label}<span className="font-mono text-2xs font-normal text-faint">{formatDateTime(group.date).split(',')[0]}</span></h2>
              <ul className="space-y-3">
                {group.sessions.map((session) => (
                  <li key={session.id} className="rounded-md border border-line bg-surface-raised p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {session.status === 'live' ? <Badge tone="info" variant="outline" className="gap-1.5"><span className="live-dot size-1.5 rounded-full bg-info" aria-hidden="true" />LIVE</Badge> : <Badge tone={session.status === 'ended' ? 'idle' : 'neutral'} variant="outline">{session.status === 'ended' ? 'Ended' : formatRelative(session.startsAt)}</Badge>}
                          <Badge tone={session.mode === 'interactive' ? 'neutral' : 'info'} variant="outline">{session.mode === 'interactive' ? 'Interactive' : 'Broadcast'}</Badge>
                          <span className="font-mono text-2xs tabular-nums text-faint">{formatDateTime(session.startsAt).split(', ')[1]} · {session.durationMinutes} min</span>
                        </div>
                        <h3 className="mt-2 text-sm font-[560] text-heading">{session.title}</h3>
                        <p className="mt-1 text-2xs text-muted">{session.facultyName} · {session.batchName}{session.status === 'live' ? ` · ${session.attendingCount} watching` : ''}</p>
                      </div>
                      {session.status === 'live' ? <Link to={session.joinUrl} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-sm border border-heading bg-heading px-4 text-xs font-[560] text-on-inverse hover:opacity-90"><Radio className="size-4" strokeWidth={1.5} aria-hidden="true" />Join room</Link> : session.status === 'ended' ? endedAction(session) : <span className="inline-flex min-h-11 shrink-0 items-center rounded-sm border border-line px-4 font-mono text-2xs text-faint">Opens {formatRelative(session.startsAt)}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
