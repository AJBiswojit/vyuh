import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { Card } from '@/shared/ui/Card.jsx'
import { EmptyState } from '@/shared/ui/EmptyState.jsx'
import { formatRelative } from '@/shared/lib/format.js'

/** Last recording with a persisted progress strip; opens the Phase 6 player. */
/** @param {{ recording: import('@/contracts/student.js').Recording | null }} props */
export function ContinueWatchingCard({ recording }) {
  return (
    <Card eyebrow="Continue watching" title={recording ? recording.chapterName : 'Recordings'}>
      {!recording ? (
        <EmptyState title="Nothing to resume" description="Recordings you start will keep their place here." code="0 recordings" />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-[560] leading-snug text-heading">{recording.title}</p>
          <p className="text-2xs text-muted">{recording.subjectName} · {recording.facultyName} · {recording.durationMinutes} min</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken" role="progressbar" aria-valuenow={recording.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`Watched ${recording.progressPercent} percent`}>
            <span className="block h-full rounded-full bg-ember" style={{ width: `${recording.progressPercent}%` }} />
          </div>
          <p className="font-mono text-2xs tabular-nums text-faint">{recording.progressPercent}% watched · {formatRelative(recording.lastWatchedAt)}</p>
          <Link to={`/student/recordings/${recording.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-heading bg-heading px-4 text-xs font-[560] text-on-inverse hover:opacity-90"><Play className="size-4" strokeWidth={1.5} aria-hidden="true" />Continue watching</Link>
        </div>
      )}
    </Card>
  )
}
