import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { Check, Minus, X } from 'lucide-react'
import { Badge } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'
import { formatClock } from '@/shared/lib/format.js'
import { durations, easeEntrance } from '@/shared/lib/motion.js'
import { countFilters, filterQuestions, timeScale } from '@/shared/lib/analysisMath.js'
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion.js'
import { answerLabel, FILTERS, mistakeTone, OUTCOME_LABELS, signedMarks } from '../lib/labels.js'

/** @typedef {import('@/contracts/analysis.js').QuestionAnalysis} QuestionAnalysis */
/** @typedef {import('@/contracts/analysis.js').LedgerFilter} LedgerFilter */

/** @param {{ outcome: QuestionAnalysis['outcome'] }} props */
function OutcomeGlyph({ outcome }) {
  if (outcome === 'correct') return <Check className="size-4 text-answer-fg" strokeWidth={2} aria-hidden="true" />
  if (outcome === 'wrong') return <X className="size-4 text-danger-fg" strokeWidth={2} aria-hidden="true" />
  return <Minus className="size-4 text-idle-fg" strokeWidth={2} aria-hidden="true" />
}

/** @param {{ row: QuestionAnalysis, onOpen: (row: QuestionAnalysis) => void }} props */
function LedgerRow({ row, onOpen }) {
  const scale = timeScale(row.timeSpentSeconds, row.cohortAverageSeconds)
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      data-testid={`question-row-${row.number}`}
      className="grid w-full grid-cols-[auto_2.5rem_1fr_auto] items-center gap-x-3 gap-y-2 px-1 py-4 text-left transition-colors hover:bg-[color-mix(in_oklab,var(--color-body)_4%,transparent)] focus-visible:bg-[color-mix(in_oklab,var(--color-body)_4%,transparent)] md:grid-cols-[auto_3rem_minmax(0,1.2fr)_minmax(9rem,1fr)_4.5rem_minmax(7rem,auto)]"
    >
      <span className="sr-only">{OUTCOME_LABELS[row.outcome]}. </span>
      <OutcomeGlyph outcome={row.outcome} />
      <span className="font-mono text-sm tabular-nums text-heading">Q{row.number}</span>
      <span className="col-span-2 min-w-0 text-xs md:col-span-1">
        <span className="block truncate text-body">You <span className="font-mono text-heading">{answerLabel(row, row.studentAnswer)}</span> · Key <span className="font-mono text-heading">{answerLabel(row, row.correctAnswer)}</span></span>
        <span className="mt-0.5 block truncate text-2xs text-faint">{row.sectionName} · {row.topicName}</span>
      </span>
      <span className="col-span-4 block md:col-span-1">
        <span className="relative block h-1.5 rounded-full bg-surface-sunken" aria-hidden="true">
          <span className="absolute inset-y-0 left-0 rounded-full bg-heading" style={{ width: `${(row.timeSpentSeconds / scale) * 100}%` }} />
          <span className="absolute -top-0.5 h-2.5 w-px bg-ember" style={{ left: `${(row.cohortAverageSeconds / scale) * 100}%` }} />
        </span>
        <span className="mt-1 block font-mono text-2xs tabular-nums text-muted">{formatClock(row.timeSpentSeconds)} <span className="text-faint">vs avg {formatClock(row.cohortAverageSeconds)}</span></span>
      </span>
      <span className={cn('col-start-4 row-start-1 font-mono text-sm tabular-nums md:col-start-auto md:row-start-auto', row.marksDelta > 0 ? 'text-answer-fg' : row.marksDelta < 0 ? 'text-danger-fg' : 'text-idle-fg')}>{signedMarks(row.marksDelta)}</span>
      <span className="col-span-4 md:col-span-1"><Badge tone={row.mistakeCategory ? mistakeTone(row.mistakeCategory) : row.outcome === 'correct' ? 'answer' : 'idle'} variant="outline" shape="none">{row.mistakeLabel}</Badge></span>
    </button>
  )
}

/** @param {{ rows: QuestionAnalysis[], filter: LedgerFilter, onFilter: (filter: LedgerFilter) => void, onOpen: (row: QuestionAnalysis) => void }} props */
export function QuestionLedger({ rows, filter, onFilter, onOpen }) {
  const counts = countFilters(rows)
  const visible = filterQuestions(rows, filter)
  const reduced = usePrefersReducedMotion()
  return (
    <section aria-label="Question ledger" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div><h2 className="text-sm tracking-tight text-heading">Question ledger</h2><p className="mt-1 text-2xs text-muted">One row per question. Open a row for the key, explanation and batch response split.</p></div>
        <p className="font-mono text-2xs tabular-nums text-faint" aria-live="polite">{visible.length} of {rows.length} rows</p>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter questions">
        {FILTERS.map((item) => (
          <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => onFilter(item.id)} data-testid={`filter-${item.id}`}
            className={cn('inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-2xs font-[560] transition-colors', filter === item.id ? 'border-heading bg-heading text-on-inverse' : 'border-line bg-surface-raised text-body hover:border-line-strong')}>
            {item.label}<span className="font-mono tabular-nums opacity-80" data-count={item.id}>{counts[item.id]}</span>
          </button>
        ))}
      </div>
      <LayoutGroup>
        <ol className="divide-y divide-line border-y border-line" aria-label="Questions" data-testid="question-ledger">
          <AnimatePresence initial={false}>
            {visible.map((row) => (
              <motion.li key={row.id} layout={!reduced} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -8 }} transition={{ duration: durations.standard, ease: easeEntrance }}>
                <LedgerRow row={row} onOpen={onOpen} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      </LayoutGroup>
      {visible.length === 0 ? <p className="py-6 text-center text-xs text-muted">No questions match this filter.</p> : null}
    </section>
  )
}
