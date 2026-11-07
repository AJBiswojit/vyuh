import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, RotateCw } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, ErrorState, Skeleton } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatNumber } from '@/shared/lib/format.js'
import { MathText } from '@/features/exam/components/MathText.jsx'
import { useStudentId } from '@/features/student/hooks/useStudentWorkspace.js'
import { useTopicRevision } from '../hooks/useAnalysis.js'

/** Targeted revision destination from a question drawer. */
export function TopicRevisionPage() {
  const { topicId } = useParams()
  const [params] = useSearchParams()
  const studentId = useStudentId()
  const revision = useTopicRevision(studentId, topicId)
  const data = revision.data
  const examId = params.get('exam')
  const attemptId = params.get('attempt')
  const back = examId ? `/student/exams/${examId}/result${attemptId ? `?attempt=${encodeURIComponent(attemptId)}` : ''}` : '/student/performance'
  useDocumentTitle(data ? `Revise ${data.topicName}` : 'Topic revision')
  return (
    <>
      <PageHeader eyebrow="Revision" title={data?.topicName ?? 'Topic revision'} description={data ? `${data.subjectName} · targeted practice from the result sheet` : 'Questions and explanations for the topic you opened.'}
        actions={<Link to={back} className="inline-flex min-h-9 items-center gap-1 rounded-xs px-1.5 text-2xs font-[560] text-heading hover:text-ember-press"><ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />Back to result</Link>} />
      {revision.isPending ? <div role="status" aria-busy="true"><span className="sr-only">Loading topic</span><Skeleton.Block className="h-64" /></div> : revision.isError ? (
        <ErrorState code="E_REVISION" title="Topic could not load" description={/** @type {any} */ (revision.error)?.message ?? 'Try again.'} action={<Button variant="secondary" icon={<RotateCw strokeWidth={1.5} />} onClick={() => revision.refetch()} loading={revision.isRefetching}>Try again</Button>} />
      ) : !data ? null : (
        <div className="flex flex-col gap-5">
          <Card tone="sunken" eyebrow="Topic signal" title={data.topicName} action={<Badge tone="info" variant="outline" shape="none">{data.questions.length} questions</Badge>}>
            <dl className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
              <div><dt className="rule-label">Sheet accuracy</dt><dd className="mt-1 font-mono text-xl tabular-nums text-heading">{formatNumber(data.mastery, { digits: 1, suffix: '%' })}</dd></div>
              <div><dt className="rule-label">Weightage</dt><dd className="mt-1 font-mono text-xl tabular-nums text-heading">{formatNumber(data.weightage, { digits: 1, suffix: '%' })}</dd></div>
              <div className="col-span-2 sm:col-span-1"><dt className="rule-label">Advice</dt><dd className="mt-1 leading-relaxed text-body">{data.advice}</dd></div>
            </dl>
          </Card>
          <ol className="flex flex-col gap-4" aria-label="Revision questions">
            {data.questions.map((question) => (
              <li key={question.id}>
                <Card eyebrow={`Question ${question.number}`} title="Worked key" wrapTitle>
                  <div className="flex flex-col gap-3">
                    <MathText text={question.body} className="block text-sm leading-relaxed text-heading" />
                    <p className="text-xs text-muted">Correct answer: <span className="font-mono text-answer-fg">{question.correctAnswer.join(', ')}</span></p>
                    <div className="rounded-sm border border-line bg-surface-sunken px-3 py-2"><MathText text={question.explanation} className="block text-xs leading-relaxed text-body" /></div>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
          <p className="flex items-center gap-2 text-2xs text-muted"><BookOpen className="size-3.5" strokeWidth={1.5} aria-hidden="true" />Re-solve these untimed, then return to the ledger and check the mistake tag.</p>
        </div>
      )}
    </>
  )
}
