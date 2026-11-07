import { LibraryBig } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Card, EmptyState } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'

/**
 * Question bank. Phase 0 scaffolds the screen and its empty state; the bank
 * itself (chapter tree, difficulty spread, paper assembly) is the faculty phase.
 *
 * The page states what is missing rather than showing a fake table, because a
 * mock table would read as a finished feature.
 */
export function FacultyBankPage() {
  useDocumentTitle('Question bank')

  return (
    <>
      <PageHeader
        eyebrow="Faculty workspace"
        title="Question bank"
        description="Questions by chapter, difficulty and previous use. Every question carries its blueprint tag, so a paper can be assembled against the real weightage."
      />

      <Card tone="paper" eyebrow="Phase 0" title="The bank is scaffolded, not populated">
        <div className="space-y-3 text-sm leading-relaxed text-body">
          <p>
            The schema is in place: a question belongs to a course and a chapter, carries a difficulty, an
            answer key and a marking scheme, and records which papers have already used it.
          </p>
          <p className="text-muted">
            Drafting, reviewing and paper assembly arrive with the faculty phase. Until then, papers are built
            from the fixtures in <span className="font-mono text-2xs">src/mock-data/assessments.js</span>.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="idle" shape="dot">
            Not yet available
          </Badge>
          <Badge tone="neutral" shape="none" mono>
            3 courses · 14 chapters
          </Badge>
        </div>
      </Card>

      <div className="mt-5">
        <EmptyState
          icon={<LibraryBig strokeWidth={1.5} />}
          code="0 QUESTIONS STORED"
          title="Nothing in the bank for this term"
          description="Questions appear here once a chapter blueprint is published. The next blueprint review is scheduled for 21 November."
          action={null}
        />
      </div>
    </>
  )
}
