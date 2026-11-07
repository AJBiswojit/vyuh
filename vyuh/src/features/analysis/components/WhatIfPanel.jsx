import { useState } from 'react'
import { Card, Checkbox } from '@/shared/ui'
import { formatNumber } from '@/shared/lib/format.js'
import { calculateWhatIf } from '@/shared/lib/analysisMath.js'

/** @param {{ rows: import('@/contracts/analysis.js').QuestionAnalysis[], maxMarks: number }} props */
export function WhatIfPanel({ rows, maxMarks }) {
  const [removeNegative, setRemoveNegative] = useState(false)
  const result = calculateWhatIf(rows)
  const shown = removeNegative ? result.scoreWithoutNegative : result.actualScore
  return (
    <Card eyebrow="What if" title="Score without negative marking" data-testid="what-if-panel">
      <div className="flex flex-col gap-4">
        <Checkbox label="Remove negative marking" description="Keep every positive award and zero the penalties. Skipped questions stay at zero." checked={removeNegative} onChange={(event) => setRemoveNegative(event.target.checked)} />
        <p className="font-display text-4xl tracking-tight text-heading" aria-live="polite" data-testid="what-if-score">{formatNumber(shown)}<span className="ml-2 font-sans text-sm text-faint">/ {formatNumber(maxMarks)}</span></p>
        <dl className="grid grid-cols-3 gap-3 border-t border-dashed border-line pt-3 text-xs">
          <div><dt className="rule-label">Actual</dt><dd className="mt-1 font-mono tabular-nums text-body">{formatNumber(result.actualScore)}</dd></div>
          <div><dt className="rule-label">Difference</dt><dd className="mt-1 font-mono tabular-nums text-answer-fg">+{formatNumber(result.difference)}</dd></div>
          <div><dt className="rule-label">Wrong</dt><dd className="mt-1 font-mono tabular-nums text-body">{formatNumber(result.wrongCount)}</dd></div>
        </dl>
        <p className="text-2xs text-muted">Negative marking cost <span className="font-mono tabular-nums text-heading">{formatNumber(result.negativeMarksLost)}</span> marks on this sheet.</p>
      </div>
    </Card>
  )
}
