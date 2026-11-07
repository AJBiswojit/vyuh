import { AlertTriangle, X } from 'lucide-react'
import { IconButton, SectionLabel } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'
import { StatusLegend, StatusShape } from '@/features/exam/components/StatusShape.jsx'
import { ConfirmAction } from './ConfirmAction.jsx'

/**
 * The student's palette for the paper being built. Same shapes, same order and
 * same numbering as the hall; the only difference is that every cell starts
 * unvisited, because nobody has sat the paper yet.
 *
 * Faculty read this for balance: a section that ends on an odd number, a paper
 * whose marks do not add up, a question that no longer exists in the bank.
 *
 * @param {Object} props
 * @param {import('@/contracts/faculty.js').ExamPreview} props.preview
 * @param {boolean} [props.compact]
 * @param {(questionId: string, sectionId: string, number: number) => void} [props.onRemove]
 */
export function PalettePreview({ preview, compact = false, onRemove }) {
  return (
    <section aria-label="Student palette preview" data-testid="palette-preview" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <SectionLabel>Palette preview</SectionLabel>
          <p className="mt-2 text-2xs text-muted">
            {preview.totalQuestions} questions · {preview.totalMarks} marks · {preview.durationMinutes} min
            {preview.sectionTimeTotal > 0 ? ` · ${preview.sectionTimeTotal} min in section limits` : ''}
          </p>
        </div>
        <p className="font-mono text-2xs tabular-nums text-faint">As the candidate will see it</p>
      </div>

      <StatusLegend className="gap-x-3" />

      <div className={cn('flex flex-col', compact ? 'gap-4' : 'gap-6')}>
        {preview.sections.map((section) => (
          <div key={section.id}>
            <div className="mb-2 flex items-baseline justify-between gap-3 border-b border-line pb-1.5">
              <h4 className="text-2xs font-[560] tracking-tight text-heading">{section.name}</h4>
              <span className="font-mono text-2xs tabular-nums text-faint">{section.cells.length} questions</span>
            </div>
            {section.cells.length === 0 ? (
              <p className="py-3 text-2xs text-muted">No questions in this section yet. Add them from the bank.</p>
            ) : (
              <ol className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-6" aria-label={`${section.name} palette`}>
                {section.cells.map((cell) => (
                  <li key={cell.questionId} className="relative">
                    <div
                      className={cn(
                        'flex h-11 items-center justify-center gap-1 rounded-sm border bg-surface',
                        cell.missing ? 'border-danger' : 'border-line',
                      )}
                      data-testid={`palette-cell-${cell.number}`}
                      data-question-id={cell.questionId}
                      title={`Q${cell.number} · ${cell.subjectName}`}
                    >
                      <StatusShape state={cell.state} />
                      <span className="font-mono text-2xs tabular-nums text-faint">{cell.number}</span>
                    </div>
                    {onRemove ? (
                      <span className="absolute -right-1.5 -top-1.5">
                        <ConfirmAction
                          title={`Remove question ${cell.number} from ${section.name}?`}
                          description="The cell disappears from the candidate's palette and the section total drops. The question stays in the bank."
                          detail={`Q${cell.number} · ${cell.subjectName}`}
                          confirmLabel="Remove from paper"
                          onConfirm={() => onRemove(cell.questionId, section.id, cell.number)}
                        >
                          {(open) => (
                            <IconButton
                              icon={<X strokeWidth={2} />}
                              label={`Remove question ${cell.number} from ${section.name}`}
                              size="sm"
                              variant="secondary"
                              className="size-6 [&>span>svg]:size-3"
                              onClick={open}
                            />
                          )}
                        </ConfirmAction>
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>

      {preview.warnings.length > 0 ? (
        <ul className="flex flex-col gap-1.5 border-l-2 border-l-review pl-3" aria-label="Build warnings">
          {preview.warnings.map((warning) => (
            <li key={warning} className="flex items-start gap-2 text-2xs leading-relaxed text-review-fg">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-2xs text-answer-fg">Marks, sections and limits agree. Ready for approval.</p>
      )}
    </section>
  )
}
