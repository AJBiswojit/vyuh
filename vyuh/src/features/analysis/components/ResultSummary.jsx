import { AlarmClock, Target, TriangleAlert } from 'lucide-react'
import { formatClock, formatDuration, formatNumber } from '@/shared/lib/format.js'
import { useCountUp } from '../hooks/useCountUp.js'

/** Score hero plus rank/percentile/accuracy and the cost of mistakes. @param {{ summary: import('@/contracts/analysis.js').AnalysisSummary }} props */
export function ResultSummary({ summary }) {
  const score = useCountUp(summary.score)
  const cost = summary.cost
  return (
    <section aria-label="Result summary" className="grid grid-cols-1 border-y border-line lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]" data-testid="result-summary">
      <div className="flex flex-col justify-between gap-6 py-6 lg:border-r lg:border-line lg:pr-8">
        <div>
          <p className="rule-label">Final score</p>
          <p className="mt-3 font-display text-display font-[var(--font-weight-display)] leading-none tracking-tightest text-heading" role="img" aria-label={`Score ${summary.score} out of ${summary.maxMarks}`} data-testid="score-hero">
            <span aria-hidden="true">{formatNumber(score)}</span>
            <span className="ml-2 align-baseline font-sans text-sm font-[var(--font-weight-ui)] tracking-normal text-faint" aria-hidden="true">/ {formatNumber(summary.maxMarks)}</span>
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-4 border-t border-dashed border-line pt-4 text-xs">
          <div><dt className="rule-label">Correct</dt><dd className="mt-1 font-mono tabular-nums text-answer-fg">{summary.correct}</dd></div>
          <div><dt className="rule-label">Wrong</dt><dd className="mt-1 font-mono tabular-nums text-danger-fg">{summary.wrong}</dd></div>
          <div><dt className="rule-label">Skipped</dt><dd className="mt-1 font-mono tabular-nums text-idle-fg">{summary.skipped}</dd></div>
        </dl>
      </div>
      <div className="flex flex-col gap-6 py-6 lg:pl-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div><p className="rule-label">Rank</p><p className="mt-1 font-mono text-xl tabular-nums text-heading">{formatNumber(summary.rank)}<span className="ml-1 text-2xs text-faint">/ {formatNumber(summary.cohortSize)}</span></p></div>
          <div className="sm:col-span-1"><p className="rule-label">Percentile</p><p className="mt-1 font-mono text-xl tabular-nums text-heading">{formatNumber(summary.percentile, { digits: 1 })}</p>
            <div className="mt-2 h-1.5 rounded-full bg-surface-sunken" role="img" aria-label={`Percentile ${summary.percentile} of ${summary.cohortSize} students`}>
              <div className="relative h-full rounded-full bg-ember" style={{ width: `${summary.percentile}%` }}><span className="absolute -right-1 -top-1 size-3.5 rounded-full border-2 border-surface-raised bg-heading" aria-hidden="true" /></div>
            </div>
          </div>
          <div><p className="rule-label">Accuracy</p><p className="mt-1 font-mono text-xl tabular-nums text-heading">{formatNumber(summary.accuracy, { digits: 1, suffix: '%' })}</p><p className="mt-1 text-2xs text-muted">{summary.correct} of {summary.attempted} attempted</p></div>
        </div>
        <div className="rounded-md border border-line bg-surface-sunken px-4 py-4" aria-label="What it cost you">
          <p className="rule-label mb-3">What it cost you</p>
          <ul className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
            <li className="flex items-start gap-2"><TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger-fg" strokeWidth={1.5} aria-hidden="true" /><span><span className="block font-mono tabular-nums text-heading">−{formatNumber(cost.negativeMarksLost)} marks</span><span className="text-muted">to negative marking</span></span></li>
            <li className="flex items-start gap-2"><AlarmClock className="mt-0.5 size-4 shrink-0 text-review-fg" strokeWidth={1.5} aria-hidden="true" /><span><span className="block font-mono tabular-nums text-heading">{formatDuration(cost.timeOnWrongSeconds)}</span><span className="text-muted">on wrong answers</span></span></li>
            <li className="flex items-start gap-2"><Target className="mt-0.5 size-4 shrink-0 text-info-fg" strokeWidth={1.5} aria-hidden="true" /><span><span className="block font-mono tabular-nums text-heading">{formatNumber(cost.confidentMistakes)}</span><span className="text-muted">confident mistakes</span></span></li>
          </ul>
          <p className="mt-3 border-t border-dashed border-line pt-3 text-2xs text-muted">Total time on the sheet: <span className="font-mono tabular-nums text-body">{formatClock(summary.durationSeconds)}</span>.</p>
        </div>
      </div>
    </section>
  )
}
