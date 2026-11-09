import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/cn.js'
import { spring } from '@/shared/lib/motion.js'
import { countStatuses } from '../lib/examState.js'
import { STATUS_LABELS } from '../lib/examStatus.js'
import { StatusLegend, StatusShape } from './StatusShape.jsx'

/** @param {{ questionIds: string[], entries: Record<string, import('@/contracts/assessment.js').AnswerEntry>, currentIndex: number, onJump: (index: number) => void }} props */
export function QuestionPalette({ questionIds, entries, currentIndex, onJump }) {
  const counts = countStatuses(entries, questionIds)
  return (
    <aside aria-label="Question palette" className="flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto rounded-md border border-line bg-surface-raised p-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-[560] text-heading">Question palette</h2>
        <p className="font-mono text-2xs tabular-nums text-muted" data-testid="palette-total">{counts.answered + counts.not_answered + counts.review + counts.review_answered + counts.not_visited} / {counts.total}</p>
      </div>
      <StatusLegend counts={counts} className="gap-x-2 gap-y-1" />
      <ol className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5" aria-label="Questions">
        {questionIds.map((id, index) => {
          const state = entries[id]?.state ?? 'not_visited'
          const current = index === currentIndex
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onJump(index)}
                aria-label={`Question ${index + 1}, ${STATUS_LABELS[state]}`}
                aria-current={current ? 'true' : undefined}
                data-status={state}
                className={cn('relative flex size-10 flex-col items-center justify-center gap-0.5 rounded-sm border border-line bg-surface transition-colors hover:border-line-strong', current && 'outline-2 outline-offset-2 outline-ember')}
              >
                <motion.span key={state} initial={{ scale: 0.55 }} animate={{ scale: 1 }} transition={/** @type {import("framer-motion").Transition} */ (spring)} className="inline-flex">
                  <StatusShape state={state} size="sm" />
                </motion.span>
                <span className="font-mono text-[10px] leading-none tabular-nums text-muted">{index + 1}</span>
              </button>
            </li>
          )
        })}
      </ol>
      <p className="text-2xs text-muted">Answered includes responses also marked for review. Counts always sum to the paper total.</p>
    </aside>
  )
}
