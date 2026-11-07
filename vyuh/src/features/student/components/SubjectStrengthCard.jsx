import { Card } from '@/shared/ui/Card.jsx'
import { EmptyState } from '@/shared/ui/EmptyState.jsx'

/**
 * Horizontal subject bars with a dotted batch-average marker. This is a
 * comparison against the batch, never a leaderboard or rank.
 * @param {{ items: import('@/contracts/student.js').SubjectStrength[] }} props
 */
/** @param {{ items: import('@/contracts/student.js').SubjectStrength[] }} props */
export function SubjectStrengthCard({ items }) {
  return (
    <Card eyebrow="Subject strength" title="Where you are strong" footer={<p className="text-2xs text-muted">Dotted marker is the batch average. No leaderboard, no rank.</p>}>
      {items.length === 0 ? (
        <EmptyState title="No subject strength yet" description="Your first evaluated paper will set the baseline for each subject." code="0 subjects" />
      ) : (
        <ul className="flex flex-col gap-5">
          {items.map((item) => (
            <li key={item.subjectId}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <p className="text-xs font-[560] text-heading">{item.name}</p>
                <p className="font-mono text-2xs tabular-nums text-muted"><span className="text-heading">{item.score}</span> / 100 · avg {item.batchAverage}</p>
              </div>
              <div className="relative h-2.5 rounded-full bg-surface-sunken" role="img" aria-label={`${item.name}: ${item.score} out of 100, batch average ${item.batchAverage}`}>
                <span className="absolute inset-y-0 left-0 rounded-full bg-heading" style={{ width: `${item.score}%` }} />
                <span className="absolute -top-1 bottom-[-0.25rem] border-l border-dotted border-ember-press" style={{ left: `${item.batchAverage}%` }} aria-hidden="true" />
              </div>
              <p className="mt-1 font-mono text-2xs tabular-nums text-faint">{item.delta >= 0 ? '+' : '−'}{Math.abs(item.delta)} since last attempt</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
