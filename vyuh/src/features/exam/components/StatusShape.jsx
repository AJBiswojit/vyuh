import { cn } from '@/shared/lib/cn.js'
import { STATUS_LABELS } from '../lib/examStatus.js'

/** @typedef {import('@/contracts/assessment.js').QuestionState} QuestionState */
/** Five NTA-style status shapes. Colour is never the only carrier.
 * @param {{ state: QuestionState, size?: 'sm'|'md', className?: string }} props
 */
export function StatusShape({ state, size = 'md', className }) {
  const box = size === 'sm' ? 'size-3' : 'size-5'
  if (state === 'not_visited') return <span className={cn('inline-block rounded-[2px] border border-line-strong bg-transparent', box, className)} aria-hidden="true" />
  if (state === 'not_answered') return <span className={cn('inline-block rounded-[2px] bg-danger', box, className)} aria-hidden="true" />
  if (state === 'answered') return <span className={cn('inline-block rounded-[5px] bg-answer', box, className)} aria-hidden="true" />
  if (state === 'review') return <span className={cn('inline-block rounded-full bg-review', box, className)} aria-hidden="true" />
  return <span className={cn('inline-block rounded-full border-2 border-answer bg-review', box, className)} aria-hidden="true" />
}

/** @param {{ counts?: import('@/contracts/exam.js').ExamStatusCounts, className?: string }} props */
export function StatusLegend({ counts, className }) {
  const order = /** @type {QuestionState[]} */ (['not_visited', 'not_answered', 'answered', 'review', 'review_answered'])
  return (
    <ul className={cn('flex flex-wrap gap-x-3 gap-y-1.5', className)} aria-label="Question status legend">
      {order.map((state) => (
        <li key={state} className="inline-flex items-center gap-1.5 text-2xs text-muted">
          <StatusShape state={state} size="sm" />
          <span>{STATUS_LABELS[state]}</span>
          {counts ? <span className="font-mono tabular-nums text-heading" data-count={state}>{counts[state]}</span> : null}
        </li>
      ))}
    </ul>
  )
}
