import { ClipboardCheck } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Card, EmptyState } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'

/**
 * Evaluation queue. Subjective answers wait here for a human; objective papers
 * never do, which is the point of the split.
 */
export function FacultyEvaluationPage() {
  useDocumentTitle('Evaluation')

  return (
    <>
      <PageHeader
        eyebrow="Faculty workspace"
        title="Evaluation"
        description="Subjective answers waiting on you, oldest first. Objective papers evaluate on submit and never reach this queue."
      />

      <Card tone="paper" eyebrow="How this works" title="One queue per paper, not per student">
        <div className="space-y-3 text-sm leading-relaxed text-body">
          <p>
            An answer is shown with the student&apos;s own handwriting or typed response next to the rubric, so a
            mark is a single decision rather than a hunt. Remarks are optional; a mark is not.
          </p>
          <p className="text-muted">
            The queue is empty outside a live evaluation window, and it is empty in this build because grading
            arrives with the faculty phase.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="idle" shape="dot">
            Queue idle
          </Badge>
          <Badge tone="neutral" shape="none" mono>
            0 awaiting
          </Badge>
        </div>
      </Card>

      <div className="mt-5">
        <EmptyState
          icon={<ClipboardCheck strokeWidth={1.5} />}
          code="0 ANSWERS WAITING"
          title="Nothing to evaluate right now"
          description="Answers land here when a subjective paper closes. The next one closes on 14 November at 11:00."
          action={null}
        />
      </div>
    </>
  )
}
