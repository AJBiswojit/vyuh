import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BarChart3, RotateCw } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, ErrorState, Skeleton } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime } from '@/shared/lib/format.js'
import { useExams, useStudentId } from '@/features/student/hooks/useStudentWorkspace.js'
import { PatternChips } from '@/features/student/components/PatternChips.jsx'
import { useActiveExamAttempt } from '../hooks/useExamFlow.js'

/** Exam detail: the factual front door before instructions and the hall. */
export function ExamDetailPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const studentId = useStudentId()
  const exams = useExams(studentId)
  const active = useActiveExamAttempt(examId, studentId)
  const exam = exams.data?.find((item) => item.id === examId)
  useDocumentTitle(exam?.title ?? 'Exam detail')
  const playerReady = exam?.track === 'NEET' && exam.status !== 'closed' && exam.status !== 'draft'

  return (
    <>
      <PageHeader eyebrow="Exam flow" title="Exam detail" description="Pattern, schedule and rules before you enter the hall." />
      {exams.isPending ? (
        <div role="status" aria-busy="true" className="space-y-3"><span className="sr-only">Loading exam</span><Skeleton.Block className="h-40" /><Skeleton.Block className="h-24" /></div>
      ) : exams.isError ? (
        <ErrorState code="E_EXAM" title="Exam could not load" description={/** @type {any} */ (exams.error)?.message ?? 'Try again.'} action={<Button variant="secondary" icon={<RotateCw strokeWidth={1.5} />} onClick={() => exams.refetch()}>Try again</Button>} />
      ) : !exam ? (
        <ErrorState code="E_EXAM_MISSING" title="Exam not found" description="This paper is not in your ledger." action={<Button variant="secondary" onClick={() => navigate('/student/exams')}>Back to exams</Button>} />
      ) : (
        <div className="flex flex-col gap-5">
          <Card eyebrow={exam.kind} title={exam.title} wrapTitle action={<Badge tone={exam.status === 'live' ? 'info' : 'neutral'} variant="outline">{exam.status}</Badge>}>
            <div className="flex flex-col gap-4">
              <PatternChips exam={exam} />
              <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                <div><dt className="rule-label">Starts</dt><dd className="mt-1 text-heading">{exam.scheduledFor ? formatDateTime(exam.scheduledFor) : 'On release'}</dd></div>
                <div><dt className="rule-label">Window closes</dt><dd className="mt-1 text-heading">{exam.endsAt ? formatDateTime(exam.endsAt) : 'After duration'}</dd></div>
                <div><dt className="rule-label">Negative marking</dt><dd className="mt-1 font-mono tabular-nums text-heading">−{exam.negativeMarks} per wrong response</dd></div>
              </dl>
              <ul className="list-disc space-y-1 pl-5 text-xs text-body">{exam.instructions.map((line) => <li key={line}>{line}</li>)}</ul>
            </div>
          </Card>
          {!playerReady ? <p className="rounded-sm border border-line bg-surface-sunken px-4 py-3 text-xs text-muted">The Phase 4 player is published for the live NEET practice paper. This ledger entry keeps its Phase 3 summary.</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" icon={<ArrowLeft strokeWidth={1.5} />} onClick={() => navigate('/student/exams')}>Back to exams</Button>
            {exam.track === 'NEET' ? <Button variant="ghost" icon={<BarChart3 strokeWidth={1.5} />} onClick={() => navigate(`/student/exams/${exam.id}/result`)}>Result sheet</Button> : null}
            <Button variant="primary" trailingIcon={<ArrowRight strokeWidth={1.5} />} disabled={!active && !playerReady} onClick={() => navigate(`/student/exams/${exam.id}/${active ? 'hall' : 'instructions'}`)}>{active ? 'Resume exam' : 'Read instructions'}</Button>
          </div>
        </div>
      )}
    </>
  )
}
