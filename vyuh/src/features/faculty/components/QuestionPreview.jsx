import { Check } from 'lucide-react'
import { Badge } from '@/shared/ui'
import { MathText } from '@/features/exam/components/MathText.jsx'
import { formatDate } from '@/shared/lib/format.js'

/**
 * The preview pane. It renders the question exactly as a candidate would meet
 * it — KaTeX, options, key — and then adds what only faculty see: the
 * explanation, the blueprint tags and the historical item statistics.
 *
 * @param {Object} props
 * @param {import('@/contracts/faculty.js').BankQuestion} props.question
 * @param {React.ReactNode} [props.actions]
 * @param {boolean} [props.compact]
 */
export function QuestionPreview({ question, actions, compact = false }) {
  const isChoice = question.kind === 'single' || question.kind === 'multi' || question.kind === 'image'
  return (
    <article aria-label={`Preview of ${question.code}`} className="flex flex-col gap-4" data-testid="question-preview">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="rule-label">{question.code}</p>
          <h3 className="mt-1 text-sm leading-snug tracking-tight text-heading">{question.topicName}</h3>
          <p className="mt-1 text-2xs text-muted">
            {question.subjectName} · {question.subtopic} · {question.source.replace('_', ' ')}
          </p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral" variant="outline" shape="none">{KIND_LABELS[question.kind]}</Badge>
        <Badge tone="neutral" variant="soft" shape="none">Difficulty · {question.difficulty}</Badge>
        <Badge tone="neutral" variant="soft" shape="none">Bloom · {question.bloom}</Badge>
        <span className="font-mono text-2xs tabular-nums text-faint">+{question.marks} / −{question.negativeMarks}</span>
        <span className="font-mono text-2xs tabular-nums text-faint">used in {question.usageCount} papers</span>
      </div>

      <div className="text-sm leading-relaxed text-body">
        <MathText text={question.body} />
      </div>

      {question.imageUrl ? (
        <figure className="overflow-hidden rounded-sm border border-line bg-surface-sunken">
          <img src={question.imageUrl} alt="Question figure" className="h-48 w-full object-contain" />
          <figcaption className="border-t border-line px-3 py-1.5 text-2xs text-faint">Figure attached to this question</figcaption>
        </figure>
      ) : null}

      {isChoice ? (
        <ol className="flex flex-col gap-2" aria-label="Options">
          {question.options.map((option) => {
            const correct = question.correctOptions.includes(option.key)
            return (
              <li
                key={option.key}
                className="flex items-start gap-3 rounded-sm border border-line px-3 py-2 text-xs"
                data-correct={correct ? 'true' : 'false'}
              >
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-xs border border-line-strong font-mono text-2xs text-heading">
                  {option.key}
                </span>
                <span className="min-w-0 flex-1 text-body">
                  <MathText text={option.body} />
                </span>
                {correct ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-2xs font-[560] text-answer-fg">
                    <Check className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
                    Key
                  </span>
                ) : null}
              </li>
            )
          })}
        </ol>
      ) : null}

      {question.kind === 'numerical' ? (
        <p className="rounded-sm border border-line bg-surface-sunken px-3 py-2 text-xs text-body">
          Answer <span className="font-mono tabular-nums text-heading">{question.correctNumeric}</span>
          {question.unit ? ` ${question.unit}` : ''} · tolerance ±{question.numericTolerance}
        </p>
      ) : null}

      {question.kind === 'subjective' ? (
        <p className="rounded-sm border border-line bg-surface-sunken px-3 py-2 text-xs leading-relaxed text-body">
          Evaluated by hand against the model answer below.
        </p>
      ) : null}

      {compact ? null : (
        <section aria-label="Explanation" className="border-l-2 border-l-line-strong pl-4">
          <p className="rule-label mb-1.5">Explanation</p>
          <div className="text-xs leading-relaxed text-body">
            <MathText text={question.explanation} />
          </div>
        </section>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-3 text-2xs">
        <div>
          <dt className="rule-label">Tags</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {question.tags.map((tag) => (
              <span key={tag} className="rounded-xs bg-surface-sunken px-1.5 py-0.5 text-2xs text-muted">{tag}</span>
            ))}
          </dd>
        </div>
        <div>
          <dt className="rule-label">Last edited</dt>
          <dd className="mt-1 font-mono tabular-nums text-muted">{formatDate(question.updatedAt)}</dd>
        </div>
        {question.analysis ? (
          <>
            <div>
              <dt className="rule-label">Historical p</dt>
              <dd className="mt-1 font-mono tabular-nums text-muted">
                {question.analysis.difficultyIndex.toFixed(2)} over {question.analysis.attempts} responses
              </dd>
            </div>
            <div>
              <dt className="rule-label">Historical r</dt>
              <dd className="mt-1 font-mono tabular-nums text-muted">{question.analysis.discrimination.toFixed(2)}</dd>
            </div>
          </>
        ) : (
          <div className="col-span-2">
            <dt className="rule-label">Item history</dt>
            <dd className="mt-1 text-2xs text-muted">New question — no responses recorded yet.</dd>
          </div>
        )}
      </dl>
    </article>
  )
}

const KIND_LABELS = {
  single: 'Single correct',
  multi: 'Multi correct',
  numerical: 'Numerical',
  subjective: 'Subjective',
  image: 'Image based',
}
