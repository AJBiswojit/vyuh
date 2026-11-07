import { LockKeyhole, RotateCw } from 'lucide-react'
import { Button, Card } from '@/shared/ui'
import { formatClock, formatDateTime } from '@/shared/lib/format.js'

/** @param {{ release: import('@/contracts/analysis.js').ReleasePolicy, seconds: number, onRefresh: () => void, refreshing?: boolean }} props */
export function ReleaseLock({ release, seconds, onRefresh, refreshing }) {
  return (
    <Card tone="sunken" eyebrow="Result release" title="This sheet is still locked" data-testid="release-lock">
      <div className="flex flex-col gap-4">
        <p className="flex items-center gap-2 text-xs text-body"><LockKeyhole className="size-4 shrink-0 text-review-fg" strokeWidth={1.5} aria-hidden="true" />Question analysis stays hidden until the release rule is satisfied.</p>
        <p className="font-mono text-3xl tabular-nums text-heading" role="timer" aria-label={`Results release in ${formatClock(seconds)}`} data-testid="release-countdown">{formatClock(seconds)}</p>
        <p className="text-xs leading-relaxed text-muted">{release.rule}</p>
        {release.releaseAt ? <p className="font-mono text-2xs text-faint">Scheduled release: {formatDateTime(release.releaseAt)}</p> : null}
        <div><Button variant="secondary" size="sm" icon={<RotateCw strokeWidth={1.5} />} onClick={onRefresh} loading={refreshing}>Check again</Button></div>
      </div>
    </Card>
  )
}
