import { ClipboardList, Minus, Plus } from 'lucide-react'
import { Button, Badge, IconButton, Input, Select } from '@/shared/ui'
import { ConfirmAction } from './ConfirmAction.jsx'

/**
 * One section of the paper. Marks, penalty and limit live per section because a
 * JEE Advanced paper marks a multi-correct question differently from a numerical
 * one — the paper total is derived, never typed.
 *
 * @param {Object} props
 * @param {import('@/contracts/faculty.js').ExamSectionDraft} props.section
 * @param {number} props.index
 * @param {Map<string, import('@/contracts/faculty.js').BankQuestion>} props.bank
 * @param {{ value: string, label: string }[]} props.subjectOptions
 * @param {boolean} props.locked
 * @param {(patch: Partial<import('@/contracts/faculty.js').ExamSectionDraft>) => void} props.onChange
 * @param {(questionId: string) => void} props.onRemoveQuestion
 * @param {() => void} props.onOpenPicker
 */
export function ExamSectionEditor({ section, index, bank, subjectOptions, locked, onChange, onRemoveQuestion, onOpenPicker }) {
  const sectionMarks = section.questionIds.reduce((sum, id) => sum + (bank.get(id)?.marks ?? section.marksPerQuestion), 0)
  const subjectName = subjectOptions.find((option) => option.value === section.subjectId)?.label ?? 'No subject'

  return (
    <section className="rounded-sm border border-line bg-surface-raised" aria-labelledby={`section-${section.id}`}>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-3 py-2.5">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="font-mono text-2xs tabular-nums text-faint">{String(index + 1).padStart(2, '0')}</span>
          <h3 id={`section-${section.id}`} className="truncate text-xs font-[560] tracking-tight text-heading">{section.name}</h3>
          <Badge tone="neutral" variant="outline" shape="none" mono>{section.questionIds.length} questions</Badge>
        </div>
        <div className="flex items-center gap-3 font-mono text-2xs tabular-nums text-muted">
          <span>{sectionMarks} marks</span>
          <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
          <span>{section.timeLimitMinutes > 0 ? `${section.timeLimitMinutes} min limit` : 'No section limit'}</span>
        </div>
      </header>

      <div className="grid gap-3 px-3 py-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          label="Section name"
          value={section.name}
          disabled={locked}
          onChange={(event) => onChange({ name: event.target.value })}
          containerClassName="sm:col-span-2 lg:col-span-1"
        />
        <Select
          label="Subject"
          value={section.subjectId}
          disabled={locked}
          onChange={(event) => onChange({ subjectId: event.target.value })}
          options={subjectOptions}
        />
        <Input
          label="Marks / question"
          type="number"
          min={1}
          max={10}
          value={section.marksPerQuestion}
          disabled={locked}
          onChange={(event) => onChange({ marksPerQuestion: Number(event.target.value) })}
        />
        <Input
          label="Negative"
          type="number"
          min={0}
          step={0.25}
          value={section.negativeMarks}
          disabled={locked}
          onChange={(event) => onChange({ negativeMarks: Number(event.target.value) })}
          hint="0 for none."
        />
        <Input
          label="Time limit (min)"
          type="number"
          min={0}
          value={section.timeLimitMinutes}
          disabled={locked}
          onChange={(event) => onChange({ timeLimitMinutes: Math.max(0, Number(event.target.value)) })}
          hint="0 = shared clock."
        />
      </div>

      <div className="border-t border-line px-3 py-2">
        {section.questionIds.length === 0 ? (
          <p className="flex items-center gap-2 py-2 text-2xs text-muted">
            <ClipboardList className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            {subjectName} · nothing added yet. The palette on the right shows the gap.
          </p>
        ) : (
          <ol className="flex flex-col divide-y divide-line" data-testid={`section-questions-${section.id}`}>
            {section.questionIds.map((questionId, position) => {
              const question = bank.get(questionId)
              return (
                <li key={`${questionId}-${position}`} className="flex items-center gap-3 py-1.5">
                  <span className="w-6 shrink-0 font-mono text-2xs tabular-nums text-faint">{position + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-2xs text-body">
                      {question ? (
                        <>
                          <span className="font-mono text-faint">{question.code}</span> · {question.topicName}
                        </>
                      ) : (
                        <span className="text-danger-fg">Missing question {questionId}</span>
                      )}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-2xs tabular-nums text-muted">
                    {question?.marks ?? section.marksPerQuestion}
                  </span>
                  <ConfirmAction
                    title={`Remove question ${position + 1} from ${section.name}?`}
                    description="It leaves this paper only. The item stays in the bank with its usage count one lower."
                    detail={question ? `${question.code} · ${question.topicName}` : questionId}
                    confirmLabel="Remove from paper"
                    onConfirm={() => onRemoveQuestion(questionId)}
                  >
                    {(open) => (
                      <IconButton
                        icon={<Minus strokeWidth={1.8} />}
                        label={`Remove question ${position + 1} from ${section.name}`}
                        size="sm"
                        disabled={locked}
                        onClick={open}
                      />
                    )}
                  </ConfirmAction>
                </li>
              )
            })}
          </ol>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" icon={<Plus strokeWidth={1.5} />} onClick={onOpenPicker} disabled={locked}>
            Add from bank
          </Button>
          <span className="font-mono text-2xs tabular-nums text-faint">
            {section.questionIds.length} questions · {sectionMarks} marks
          </span>
        </div>
      </div>
    </section>
  )
}
