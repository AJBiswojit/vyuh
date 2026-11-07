import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, LibraryBig, Plus } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Button, Card, ErrorState, Input, Select, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime, formatRelative } from '@/shared/lib/format.js'
import { useCreateExam, useExamPatterns, useFacultyExams } from '../hooks/useFaculty.js'
import { ExamStatusBadge } from '../components/ExamStatusBadge.jsx'

/**
 * Papers, not a calendar. Each row says what state the paper is in and what it
 * wants next: a draft opens in the builder, a live paper opens the monitor, a
 * completed one opens its analysis.
 */
export function FacultyExamsPage() {
  useDocumentTitle('Exams')
  const navigate = useNavigate()
  const toast = useToast()
  const exams = useFacultyExams()
  const patterns = useExamPatterns()
  const create = useCreateExam()
  const [title, setTitle] = useState('')
  const [preset, setPreset] = useState('NEET')
  const [error, setError] = useState('')

  const selectedPattern = patterns.data?.find((pattern) => pattern.id === preset)

  const submit = (event) => {
    event.preventDefault()
    setError('')
    create.mutate(
      { title: title.trim(), preset: /** @type {any} */ (preset) },
      {
        onSuccess: (exam) => {
          toast.success('Paper created', `${exam.title} starts empty. Add questions from the bank.`)
          navigate(`/faculty/exams/${exam.id}`)
        },
        onError: (/** @type {Error} */ mutationError) => setError(mutationError.message),
      },
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Faculty workspace · Papers"
        title="Exams"
        description="Draft, send for approval, schedule and read the result. A paper keeps the questions it was sat with, so editing an item never rewrites a finished sitting."
        meta={
          <>
            <span className="font-mono text-2xs tabular-nums text-muted">{exams.data?.length ?? 0} papers</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <span className="font-mono text-2xs tabular-nums text-muted">
              {exams.data?.filter((exam) => exam.status === 'pending_approval').length ?? 0} awaiting approval
            </span>
          </>
        }
        actions={
          <Link to="/faculty/bank" className="inline-flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border border-line px-3 text-xs font-[560] text-heading hover:border-line-strong">
            <LibraryBig className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Open the bank
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          {exams.isPending ? (
            <div className="space-y-2" role="status" aria-busy="true">
              <span className="sr-only">Loading papers</span>
              {[0, 1, 2, 3, 4].map((index) => <Skeleton.Block key={index} className="h-14 rounded-sm" />)}
            </div>
          ) : exams.isError ? (
            <ErrorState
              code="E_EXAMS"
              title="Papers did not load"
              description={/** @type {Error} */ (exams.error)?.message ?? 'Nothing was changed. Try again.'}
              action={<Button variant="secondary" onClick={() => exams.refetch()} loading={exams.isFetching}>Try again</Button>}
            />
          ) : (
            <div className="overflow-x-auto rounded-sm border border-line bg-surface-raised">
              <table className="w-full min-w-[44rem] text-left text-xs" data-testid="exam-ledger">
                <caption className="sr-only">Papers owned by this faculty seat</caption>
                <thead>
                  <tr className="border-b border-line text-2xs uppercase tracking-widest text-faint">
                    <th scope="col" className="px-3 py-2 font-normal">Paper</th>
                    <th scope="col" className="px-3 py-2 font-normal">State</th>
                    <th scope="col" className="px-3 py-2 text-right font-normal">Questions</th>
                    <th scope="col" className="px-3 py-2 text-right font-normal">Marks</th>
                    <th scope="col" className="px-3 py-2 font-normal">Window</th>
                    <th scope="col" className="px-3 py-2 font-normal">Next</th>
                  </tr>
                </thead>
                <tbody>
                  {(exams.data ?? []).map((exam) => {
                    const next = nextAction(exam)
                    return (
                      <tr key={exam.id} className="border-b border-line last:border-0 hover:bg-surface-sunken">
                        <th scope="row" className="max-w-[22rem] px-3 py-2.5 text-left">
                          <Link to={`/faculty/exams/${exam.id}`} className="block truncate font-[560] text-heading hover:text-ember-press">
                            {exam.title}
                          </Link>
                          <span className="mt-0.5 block truncate text-2xs text-faint">
                            {exam.presetLabel} · {exam.batchName} · updated {formatRelative(exam.updatedAt)}
                          </span>
                        </th>
                        <td className="px-3 py-2.5"><ExamStatusBadge status={exam.status} /></td>
                        <td className="px-3 py-2.5 text-right font-mono text-2xs tabular-nums text-heading">{exam.totalQuestions}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-2xs tabular-nums text-muted">{exam.totalMarks}</td>
                        <td className="px-3 py-2.5 font-mono text-2xs tabular-nums text-muted">
                          {exam.scheduleStart ? formatDateTime(exam.scheduleStart) : 'Not set'}
                        </td>
                        <td className="px-3 py-2.5">
                          <Link to={next.to} className="inline-flex items-center gap-1 whitespace-nowrap text-2xs font-[560] text-heading hover:text-ember-press">
                            {next.label}
                            <ArrowUpRight className="size-3" strokeWidth={1.75} aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {(exams.data ?? []).length === 0 ? (
                <p className="px-3 py-6 text-center text-2xs text-muted">No papers yet. Create the first one on the right.</p>
              ) : null}
            </div>
          )}
        </div>

        <Card eyebrow="New paper" title="Start from a pattern" action={<Plus className="size-4 text-faint" strokeWidth={1.5} aria-hidden="true" />}>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <Input
              label="Paper title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="NEET Mock 09 — Full Syllabus"
              hint="At least four characters. The batch is set on the builder."
              error={error || undefined}
            />
            <Select
              label="Pattern preset"
              value={preset}
              onChange={(event) => setPreset(event.target.value)}
              options={(patterns.data ?? []).map((pattern) => ({ value: pattern.id, label: pattern.label }))}
              hint={selectedPattern?.description ?? 'Sections, marks and limits seed the builder; every one can be changed.'}
            />
            {selectedPattern ? (
              <dl className="grid grid-cols-3 gap-2 border-y border-line py-2.5">
                <div>
                  <dt className="rule-label">Duration</dt>
                  <dd className="mt-0.5 font-mono text-2xs tabular-nums text-heading">{selectedPattern.durationMinutes} min</dd>
                </div>
                <div>
                  <dt className="rule-label">Marks</dt>
                  <dd className="mt-0.5 font-mono text-2xs tabular-nums text-heading">+{selectedPattern.marksPerQuestion} / −{selectedPattern.negativeMarks}</dd>
                </div>
                <div>
                  <dt className="rule-label">Sections</dt>
                  <dd className="mt-0.5 font-mono text-2xs tabular-nums text-heading">{selectedPattern.sections.length}</dd>
                </div>
              </dl>
            ) : null}
            <Button type="submit" variant="primary" loading={create.isPending} disabled={title.trim().length < 4}>
              Create paper
            </Button>
            <p className="text-2xs text-muted">
              The paper is created as a draft and opens in the builder. Questions are added from the bank; nothing is published until it passes approval.
            </p>
          </form>
        </Card>
      </div>
    </>
  )
}

/** @param {import('@/contracts/faculty.js').FacultyExam} exam */
function nextAction(exam) {
  if (exam.status === 'live') return { label: 'Monitor', to: `/faculty/exams/${exam.id}/monitor` }
  if (exam.status === 'completed') return { label: 'Analysis', to: `/faculty/analysis?exam=${encodeURIComponent(exam.id)}` }
  return { label: 'Builder', to: `/faculty/exams/${exam.id}` }
}
