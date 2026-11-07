import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BarChart3, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime } from '@/shared/lib/format.js'
import { useStudentId } from '@/features/student/hooks/useStudentWorkspace.js'
import { useExamStore } from '../store/examStore.js'
import { useExamSubmissionSync } from '../hooks/useExamFlow.js'

/** Confirmation after final submission, with the Phase 5 result-sheet handoff. */
export function ExamConfirmationPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const studentId = useStudentId()
  const attempt = useExamStore((state) => Object.values(state.attempts).find((item) => item.examId === examId && item.studentId === studentId && item.status === 'submitted'))
  useExamSubmissionSync(attempt)
  useDocumentTitle('Submission confirmed')
  useEffect(() => { if (!attempt) navigate('/student/exams', { replace: true }) }, [attempt, navigate])
  if (!attempt?.receipt) return null
  const receipt = attempt.receipt
  const rows = [['Answered', receipt.counts.answered], ['Not answered', receipt.counts.notAnswered], ['Marked for review', receipt.counts.review], ['Not visited', receipt.counts.notVisited], ['Total', receipt.counts.total]]
  return (
    <>
      <PageHeader eyebrow="Exam flow" title="Submission confirmed" description="Your sheet is finalised. Open the result sheet for the score, question ledger and mistake analysis." />
      <div className="flex flex-col gap-5">
        <Card title={receipt.examTitle} wrapTitle action={<Badge tone={receipt.pendingSync ? 'review' : 'answer'} variant="outline" shape="none">{receipt.pendingSync ? 'Sync pending' : 'Submitted'}</Badge>}>
          <div className="flex flex-col gap-4">
            <p className="flex items-center gap-2 text-xs text-answer-fg"><CheckCircle2 className="size-4" strokeWidth={1.5} aria-hidden="true" />{receipt.reason === 'timer_expired' ? 'Auto-submitted when the timer reached zero.' : 'Final answers submitted.'}</p>
            <p className="text-xs text-muted">Attempt <span className="font-mono">{receipt.attemptId}</span> · {formatDateTime(receipt.submittedAt)}</p>
            <ol className="divide-y divide-dashed divide-line border-y border-line font-mono text-sm tabular-nums" aria-label="Submission receipt">
              {rows.map(([label, value]) => <li key={label} className="flex justify-between py-3"><span className="text-body">{label}</span><span className="text-heading">{value}</span></li>)}
            </ol>
            {receipt.pendingSync ? <p role="status" className="text-xs text-review-fg">Saved on this device. The final sheet and result analysis will sync when you are online.</p> : null}
          </div>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => navigate('/student')}>Back to dashboard</Button>
          <Button variant="ghost" onClick={() => navigate('/student/exams')}>Back to exams</Button>
          <Button variant="primary" icon={<BarChart3 strokeWidth={1.5} />} disabled={receipt.pendingSync} onClick={() => navigate(`/student/exams/${receipt.examId}/result?attempt=${encodeURIComponent(receipt.attemptId)}`)}>View result sheet</Button>
        </div>
      </div>
    </>
  )
}
