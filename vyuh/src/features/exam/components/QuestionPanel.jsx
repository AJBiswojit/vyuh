import { cn } from '@/shared/lib/cn.js'
import { Badge } from '@/shared/ui'
import { MathText } from './MathText.jsx'
import { NumericKeypad } from './NumericKeypad.jsx'

/** @typedef {import('@/contracts/exam.js').ExamQuestion} ExamQuestion */
/** @typedef {import('@/contracts/exam.js').Confidence} Confidence */
const CONFIDENCE = /** @type {Array<{ id: Confidence, label: string }>} */ ([
  { id: 'sure', label: 'Sure' }, { id: 'unsure', label: 'Unsure' }, { id: 'guessing', label: 'Guessing' },
])

/** @param {{ question: ExamQuestion, entry: import('@/contracts/assessment.js').AnswerEntry, confidence: Confidence | null, fontSize: number, onAnswer: (selected: string[]) => void, onConfidence: (value: Confidence | null) => void }} props */
export function QuestionPanel({ question, entry, confidence, fontSize, onAnswer, onConfidence }) {
  const selected = entry.selected
  return (
    <article aria-label={`Question ${question.number}`} className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-[560] text-heading" data-testid="question-number">Question {question.number}</h2>
          <Badge tone="neutral" variant="outline" shape="none">{question.type === 'numeric' ? 'Numerical' : question.type === 'multiple' ? 'Multiple correct' : 'Single correct'}</Badge>
        </div>
        <p className="font-mono text-2xs tabular-nums text-muted" aria-label={`Marks plus ${question.marks}, negative ${question.negativeMarks}`}>+{question.marks} / −{question.negativeMarks}</p>
      </header>
      <div className="exam-question-text leading-relaxed text-heading" style={{ fontSize: `${fontSize}px` }}>
        <MathText text={question.body} />
        {question.unit ? <span className="ml-2 text-sm text-muted">({question.unit})</span> : null}
      </div>
      {question.type === 'numeric' ? (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-xs font-[560] text-heading">
            Numerical answer
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={selected[0] ?? ''}
              onChange={(event) => onAnswer([event.target.value])}
              className="min-h-12 max-w-xs rounded-sm border border-line-strong bg-surface-raised px-3 font-mono text-sm tabular-nums text-heading outline-none focus-visible:border-ember"
              placeholder="Enter a number"
            />
          </label>
          <NumericKeypad value={selected[0] ?? ''} onChange={(value) => onAnswer([value])} />
        </div>
      ) : (
        <div role="radiogroup" aria-label="Answer options" className="flex flex-col gap-3">
          {question.options.map((option) => {
            const checked = selected.includes(option.key)
            return (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-label={`Option ${option.key}: ${option.body.replace(/\$/g, '')}`}
                aria-checked={checked}
                onClick={() => onAnswer([option.key])}
                className={cn('flex min-h-14 w-full items-center gap-3 rounded-sm border bg-surface-raised px-4 py-3 text-left transition-colors hover:border-line-strong', checked ? 'border-ember ring-2 ring-ember' : 'border-line')}
              >
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-sm border font-mono text-xs', checked ? 'border-ember bg-ember-wash text-ember-press' : 'border-line-strong text-muted')} aria-hidden="true">{option.key}</span>
                <span className="min-w-0 flex-1 text-sm text-heading"><MathText text={option.body} /></span>
                <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border', checked ? 'border-ember' : 'border-line-strong')} aria-hidden="true">
                  {checked ? <span className="size-2.5 rounded-full bg-ember" /> : null}
                </span>
              </button>
            )
          })}
        </div>
      )}
      <fieldset className="rounded-sm border border-line px-4 py-3">
        <legend className="px-1 text-xs font-[560] text-heading">Confidence</legend>
        <p className="mb-2 text-2xs text-muted">Asked so review can prioritise uncertain answers. It does not change marks.</p>
        <div className="flex flex-wrap gap-2">
          {CONFIDENCE.map((item) => (
            <button key={item.id} type="button" aria-pressed={confidence === item.id} onClick={() => onConfidence(confidence === item.id ? null : item.id)}
              className={cn('min-h-11 rounded-sm border px-3 text-xs transition-colors', confidence === item.id ? 'border-ember text-ember-press ring-1 ring-ember' : 'border-line-strong text-body hover:border-heading')}>
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>
    </article>
  )
}
