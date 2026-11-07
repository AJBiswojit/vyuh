import { Badge, EmptyState } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'
import { formatDate } from '@/shared/lib/format.js'

/**
 * The bank's ledger. One row per question, ruled rather than carded, with the
 * selected row marked by an ember rule on the leading edge — the same "current
 * item" language the exam palette uses.
 *
 * The row is a button so the whole line is a target, and the label a screen
 * reader hears is the question code plus the first clause of the body, not
 * "button".
 *
 * @param {Object} props
 * @param {import('@/contracts/faculty.js').BankQuestion[]} props.items
 * @param {string|null} props.selectedId
 * @param {(question: import('@/contracts/faculty.js').BankQuestion) => void} props.onSelect
 * @param {string} [props.emptyTitle]
 * @param {string} [props.emptyDescription]
 */
export function QuestionTable({ items, selectedId, onSelect, emptyTitle = 'No question matches these filters', emptyDescription = 'Widen one filter, or clear them all and start from the full bank.' }) {
  if (items.length === 0) {
    return <EmptyState code="0 ROWS" title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="min-w-0">
      <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 border-b border-line px-3 pb-2 text-2xs uppercase tracking-widest text-faint md:grid-cols-[6rem_minmax(0,1fr)_6.5rem_4.5rem_4.5rem_5rem]" aria-hidden="true">
        <span>Code</span>
        <span>Question</span>
        <span className="hidden md:block">Type</span>
        <span className="hidden text-right md:block">Used</span>
        <span className="hidden md:block">Updated</span>
        <span className="text-right">Quality</span>
      </div>
      <ol className="divide-y divide-line" aria-label="Question bank rows">
        {items.map((question) => {
          const selected = question.id === selectedId
          const analysis = question.analysis
          return (
            <li key={question.id} className="relative">
              {selected ? <span className="absolute inset-y-0 left-0 w-[2px] bg-ember" aria-hidden="true" /> : null}
              <button
                type="button"
                onClick={() => onSelect(question)}
                aria-current={selected ? 'true' : undefined}
                data-testid={`bank-row-${question.id}`}
                className={cn(
                  'grid w-full grid-cols-[5.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 px-3 py-3 text-left transition-colors',
                  'hover:bg-[color-mix(in_oklab,var(--color-body)_4%,transparent)] focus-visible:bg-[color-mix(in_oklab,var(--color-body)_4%,transparent)]',
                  'md:grid-cols-[6rem_minmax(0,1fr)_6.5rem_4.5rem_4.5rem_5rem]',
                  selected && 'bg-[color-mix(in_oklab,var(--color-body)_3%,transparent)]',
                )}
              >
                <span className="font-mono text-2xs tabular-nums text-faint">{question.code}</span>
                <span className="min-w-0">
                  <span className="block truncate text-xs text-body">{stripLatex(question.body)}</span>
                  <span className="mt-0.5 block truncate text-2xs text-faint">
                    {question.subjectName} · {question.topicName} · {question.subtopic}
                  </span>
                </span>
                <span className="hidden md:block">
                  <Badge tone="neutral" variant="outline" shape="none" className="whitespace-nowrap">{KIND_LABELS[question.kind]}</Badge>
                </span>
                <span className="hidden text-right font-mono text-2xs tabular-nums text-muted md:block">{question.usageCount}</span>
                <span className="hidden font-mono text-2xs tabular-nums text-faint md:block">{formatDate(question.updatedAt).slice(0, 6)}</span>
                <span className="flex items-center justify-end gap-1.5">
                  <span className={cn('inline-block size-2 rounded-full', DIFFICULTY_DOT[question.difficulty])} aria-hidden="true" />
                  <span className="text-2xs text-muted">{DIFFICULTY_LABELS[question.difficulty]}</span>
                  {analysis && analysis.discrimination < 0.15 ? (
                    <Badge tone="review" variant="soft" shape="diamond" className="ml-1">Low</Badge>
                  ) : null}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

const KIND_LABELS = {
  single: 'Single',
  multi: 'Multi',
  numerical: 'Numerical',
  subjective: 'Subjective',
  image: 'Image',
}

const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

/** Difficulty is a shape as well as a colour: a filled, a ring and a hollow dot. */
const DIFFICULTY_DOT = {
  easy: 'bg-answer',
  medium: 'bg-review',
  hard: 'bg-danger',
}

/**
 * A one-line summary for the row. The full text, with maths, is in the preview
 * pane — truncating rendered KaTeX in a 1.5-line row would be unreadable.
 * @param {string} body
 */
function stripLatex(body) {
  return body
    .replace(/\$\$([\s\S]+?)\$\$/g, '$1')
    .replace(/\$([^$]+?)\$/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
