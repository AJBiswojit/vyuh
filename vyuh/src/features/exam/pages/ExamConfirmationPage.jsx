import { Link, useNavigate, useParams } from 'react-router-dom'
import { BarChart3, CheckCircle2, FileText, RotateCw } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime } from '@/shared/lib/format.js'
import { useStudentId, useExams } from '@/features/student/hooks/useStudentWorkspace.js'
import { canShowResultSheet } from '@/shared/lib/examAvailability.js'
import { useExamStore } from '../store/examStore.js'
import { useExamSubmissionSync } from '../hooks/useExamFlow.js'

/**
 * Confirmation after final submission, with the result-sheet handoff.
 *
 * Batch 1 replaces the old silent `navigate('/student/exams')` and `return null`
 * with explicit loading, empty and error states. A direct URL (or a cleared
 * device) now explains what is missing and always offers a way onward.
 */
export function ExamConfirmationPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const studentId = useStudentId()
  const attempt = useExamStore((state) => Object.values(state.attempts).find((item) => item.examId === examId && item.studentId === studentId && item.status === 'submitted'))
  const exams = useExams(studentId)
  const exam = exams.data?.find((item) => item.id === examId)
  const resultAvailable = canShowResultSheet(exam)
  // Flushes an offline final receipt when the connection returns.
  useExamSubmissionSync(attempt)
  useDocumentTitle('Submission confirmed')

  const backToExams = <Link to="/student/exams" className="inline-flex min-h-11 items-center rounded-sm border border-line-strong px-4 text-xs font-[560] text-heading hover:border-heading">Back to exams</Link>

  let body
  if (!studentId) {
    // Loading: the shell is still restoring the session, so the attempt lookup
    // cannot be trusted yet. Mirror the layout of the receipt card.
    body = (
      <Skeleton.Region label="Restoring your submission">
        <div className="space-y-4"><Skeleton.Block className="h-10 w-56" /><Skeleton.Block className="h-56" /><Skeleton.Block className="h-11 w-72" /></div>
      </Skeleton.Region>
    )
  } else if (!attempt) {
    // Empty: no submitted attempt for this paper on this device.
    body = (
      <EmptyState
        size="panel"
        code="0 SUBMISSIONS"
        icon={<FileText strokeWidth={1.5} />}
        title="No submission to confirm here"
        description="We could not find a submitted attempt for this paper on this device. Open the exam to read the instructions, or return to your exam ledger."
        action={<div className="flex flex-wrap gap-2">{backToExams}<Link to={`/student/exams/${examId}`} className="inline-flex min-h-11 items-center rounded-sm border border-line px-4 text-xs font-[560] text-heading hover:border-line-strong">Open exam detail</Link></div>}
      />
    )
  } else if (!attempt.receipt) {
    // Error: the attempt was finalised but its receipt is missing/corrupt.
    body = (
      <ErrorState
        size="panel"
        code="E_RECEIPT"
        icon={<RotateCw strokeWidth={1.5} />}
        title="The submission receipt could not be read"
        description="This attempt is marked submitted, but the local receipt is missing. Your exam ledger and result sheet can still be opened; do not start a second attempt without checking them first."
        action={<div className="flex flex-wrap gap-2">{backToExams}<Link to={`/student/exams/${examId}/result`} className="inline-flex min-h-11 items-center rounded-sm border border-line px-4 text-xs font-[560] text-heading hover:border-line-strong">Open result sheet</Link></div>}
      />
    )
  } else {
    const receipt = attempt.receipt
    const rows = [['Answered', receipt.counts.answered], ['Not answered', receipt.counts.notAnswered], ['Marked for review', receipt.counts.review], ['Not visited', receipt.counts.notVisited], ['Total', receipt.counts.total], ['Submitted at', formatDateTime(receipt.submittedAt)], ['Result', resultAvailable ? 'Available' : 'Not yet available']]
    body = (
      <div className="flex flex-col gap-5">
        <Card title={receipt.examTitle} wrapTitle action={<Badge tone={receipt.pendingSync ? 'review' : 'answer'} variant="outline" shape="none">{receipt.pendingSync ? 'Sync pending' : 'Submitted'}</Badge>}>
          <div className="flex flex-col gap-4">
            <p className="flex items-center gap-2 text-xs text-answer-fg"><CheckCircle2 className="size-4" strokeWidth={1.5} aria-hidden="true" />{receipt.reason === 'timer_expired' ? 'Auto-submitted when the timer reached zero.' : 'Final answers submitted.'}</p>
            <p className="text-xs text-muted">Attempt <span className="font-mono">{receipt.attemptId}</span> · {formatDateTime(receipt.submittedAt)}</p>
            <ol className="divide-y divide-dashed divide-line border-y border-line font-mono text-sm tabular-nums" aria-label="Submission receipt">
              {rows.map(([label, value]) => <li key={label} className="flex justify-between py-3"><span className="text-body">{label}</span><span className="text-heading">{value}</span></li>)}
            </ol>
            {!resultAvailable ? <p role="status" className="rounded-sm border border-line bg-surface-sunken px-3 py-2 text-xs leading-relaxed text-body">Your examination has been submitted. Results are not yet available.</p> : null}
            {receipt.pendingSync ? <p role="status" aria-live="polite" className="text-xs text-review-fg">Saved on this device. The final sheet and result analysis will sync when you are online.</p> : null}
          </div>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => navigate('/student')}>Back to dashboard</Button>
          <Button variant="ghost" onClick={() => navigate('/student/exams')}>Back to exams</Button>
          {resultAvailable ? (receipt.pendingSync ? (
            <span className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line px-4 text-xs font-[560] text-faint" aria-disabled="true"><BarChart3 className="size-4" strokeWidth={1.5} aria-hidden="true" />View result sheet</span>
          ) : (
            <Link to={`/student/exams/${receipt.examId}/result?attempt=${encodeURIComponent(receipt.attemptId)}`} className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-heading bg-heading px-4 text-xs font-[560] text-on-inverse hover:opacity-90">
              <BarChart3 className="size-4" strokeWidth={1.5} aria-hidden="true" />View result sheet
            </Link>
          )) : null}
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader eyebrow="Exam flow" title="Submission confirmed" description="Your sheet is finalised. Open the result sheet for the score, question ledger and mistake analysis." />
      {body}
    </>
  )
}
