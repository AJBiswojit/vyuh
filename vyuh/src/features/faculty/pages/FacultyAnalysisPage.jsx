import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, ErrorState, Select, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { cn } from '@/shared/lib/cn.js'
import { discriminationLabel } from '@/shared/lib/facultyMath.js'
import { useFacultyExams, useItemAnalysis, useMarkFaulty } from '../hooks/useFaculty.js'
import { ItemScatter } from '../components/ItemScatter.jsx'
import { WeakTopicList } from '../components/WeakTopicList.jsx'
import { ScoreImpactTable } from '../components/ScoreImpactTable.jsx'
import { ConfirmAction } from '../components/ConfirmAction.jsx'

/**
 * Cohort and item analysis. One question drives the page: which items failed to
 * separate the strong from the weak? The scatter is the overview, the ledger is
 * the evidence, and "mark as faulty" is the only action that changes a student's
 * score — so it asks first and shows exactly who moves.
 */
export function FacultyAnalysisPage() {
  useDocumentTitle('Cohort & item analysis')
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const exams = useFacultyExams()
  const completed = (exams.data ?? []).filter((exam) => exam.status === 'completed')
  const fallback = completed[0]?.id ?? exams.data?.[0]?.id ?? ''
  const examId = params.get('exam') ?? fallback

  const analysis = useItemAnalysis(examId)
  const { mark, restore } = useMarkFaulty(examId)
  const [selectedId, setSelectedId] = useState('')
  const [view, setView] = useState('flagged')

  const points = analysis.data?.points ?? []
  const rows = useMemo(() => {
    if (view === 'flagged') return points.filter((point) => point.flagged || point.faulty)
    if (view === 'faulty') return points.filter((point) => point.faulty)
    return points
  }, [points, view])

  if (analysis.isError) {
    return (
      <ErrorState
        code="E_ANALYSIS"
        title="This sitting has no analysis yet"
        description={/** @type {Error} */ (analysis.error)?.message ?? 'Analysis is built from submitted papers. It appears once the sitting closes.'}
        action={<Button variant="secondary" onClick={() => analysis.refetch()} loading={analysis.isFetching}>Try again</Button>}
      />
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Faculty workspace · Cohort & item analysis"
        title="Cohort & item analysis"
        description="Difficulty against discrimination for every item in the sitting, with the items that separate nobody called out. Marking an item faulty removes its penalty from every candidate's score."
        meta={
          analysis.data ? (
            <>
              <span className="font-mono text-2xs tabular-nums text-muted">{analysis.data.cohortSize} candidates</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="font-mono text-2xs tabular-nums text-muted">{analysis.data.points.length} items</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="font-mono text-2xs tabular-nums text-muted">KR-20 {analysis.data.summary.reliability.toFixed(2)}</span>
            </>
          ) : null
        }
        actions={
          <Link
            to={`/faculty/exams/${examId}`}
            className="inline-flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border border-line px-3 text-xs font-[560] text-heading hover:border-line-strong"
          >
            Open the paper
            <ArrowUpRight className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-sm border border-line bg-surface-raised px-3 py-2.5">
        <div className="w-full max-w-sm">
          <Select
            label="Sitting"
            value={examId}
            onChange={(event) => {
              const next = new URLSearchParams(params)
              next.set('exam', event.target.value)
              setParams(next)
              setSelectedId('')
            }}
            options={(exams.data ?? []).map((exam) => ({
              value: exam.id,
              label: `${exam.title} · ${exam.status === 'completed' ? 'completed' : exam.status.replace('_', ' ')}`,
            }))}
            hint="Analysis belongs to a finished sitting. Other papers show the same cohort fixture in this build."
          />
        </div>
        {analysis.data ? (
          <p className="text-2xs text-muted" aria-live="polite">
            {analysis.data.examTitle} · {analysis.data.batchName} · max {analysis.data.maxMarks} marks
          </p>
        ) : null}
      </div>

      {analysis.isPending ? (
        <div className="space-y-4" role="status" aria-busy="true">
          <span className="sr-only">Building the analysis</span>
          <Skeleton.Block className="h-96 rounded-sm" />
          <Skeleton.Block className="h-64 rounded-sm" />
        </div>
      ) : analysis.data ? (
        <div className="flex flex-col gap-5">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Mean difficulty" value={analysis.data.summary.meanDifficulty.toFixed(2)} />
            <Stat label="Mean discrimination" value={analysis.data.summary.meanDiscrimination.toFixed(2)} />
            <Stat label="Flagged items" value={String(analysis.data.summary.flaggedCount)} tone={analysis.data.summary.flaggedCount > 0 ? 'review' : undefined} />
            <Stat label="Marked faulty" value={String(analysis.data.summary.faultyCount)} tone={analysis.data.summary.faultyCount > 0 ? 'danger' : undefined} />
            <Stat label="Reliability (KR-20)" value={analysis.data.summary.reliability.toFixed(2)} />
          </dl>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <ItemScatter points={points} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
            <div className="min-w-0">
              <WeakTopicList topics={analysis.data.weakTopics} />
            </div>
          </div>

          <Card
            eyebrow="Item ledger"
            title="Items that separate nobody"
            action={<span className="font-mono text-2xs tabular-nums text-faint">{rows.length} shown</span>}
          >
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div className="w-full max-w-[16rem]">
                <Select
                  label="Show"
                  value={view}
                  onChange={(event) => setView(event.target.value)}
                  options={[
                    { value: 'flagged', label: 'Flagged and faulty' },
                    { value: 'faulty', label: 'Faulty only' },
                    { value: 'all', label: 'Every item' },
                  ]}
                />
              </div>
              <p className="max-w-prose text-2xs text-muted">
                A flag means strong and weak candidates answered alike. A fault is a faculty decision that also changes scores.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] text-left text-xs" data-testid="item-ledger">
                <caption className="sr-only">Item statistics for the selected sitting</caption>
                <thead>
                  <tr className="border-b border-line text-2xs uppercase tracking-widest text-faint">
                    <th scope="col" className="py-2 pr-3 font-normal">Q</th>
                    <th scope="col" className="py-2 pr-3 font-normal">Item</th>
                    <th scope="col" className="py-2 pr-3 font-normal">Topic</th>
                    <th scope="col" className="py-2 pr-3 text-right font-normal">p</th>
                    <th scope="col" className="py-2 pr-3 text-right font-normal">r</th>
                    <th scope="col" className="py-2 pr-3 text-right font-normal">Strong</th>
                    <th scope="col" className="py-2 pr-3 text-right font-normal">Weak</th>
                    <th scope="col" className="py-2 pr-3 font-normal">Reading</th>
                    <th scope="col" className="py-2 font-normal"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((point) => (
                    <tr
                      key={point.questionId}
                      className={cn(
                        'border-b border-line last:border-0 transition-colors',
                        selectedId === point.questionId ? 'bg-surface-sunken' : 'hover:bg-surface-sunken',
                        point.faulty && 'text-muted',
                      )}
                    >
                      <th scope="row" className="py-2 pr-3 text-left font-mono text-2xs tabular-nums text-faint">{point.number}</th>
                      <td className="max-w-[16rem] py-2 pr-3">
                        <button
                          type="button"
                          onClick={() => setSelectedId(point.questionId)}
                          className="block max-w-full truncate text-left text-2xs text-heading underline decoration-line-strong decoration-1 underline-offset-2 hover:text-ember-press"
                        >
                          {point.questionId}
                        </button>
                        <span className="mt-0.5 block truncate text-2xs text-faint">{point.body}</span>
                      </td>
                      <td className="py-2 pr-3 text-2xs text-muted">{point.topicName}</td>
                      <td className="py-2 pr-3 text-right font-mono text-2xs tabular-nums text-heading">{point.difficultyIndex.toFixed(2)}</td>
                      <td className={cn('py-2 pr-3 text-right font-mono text-2xs tabular-nums', point.flagged ? 'text-review-fg' : 'text-heading')}>
                        {point.discrimination.toFixed(2)}
                      </td>
                      <td className="py-2 pr-3 text-right font-mono text-2xs tabular-nums text-muted">{point.strongPercent}%</td>
                      <td className="py-2 pr-3 text-right font-mono text-2xs tabular-nums text-muted">{point.weakPercent}%</td>
                      <td className="max-w-[15rem] py-2 pr-3 text-2xs leading-relaxed">
                        {point.faulty ? (
                          <Badge tone="danger" variant="soft" shape="ring">Marked faulty</Badge>
                        ) : point.flagged ? (
                          <span className="text-review-fg">{point.flagReason ?? `Weak separation · ${discriminationLabel(point.discrimination)}`}</span>
                        ) : (
                          <span className="text-muted">{discriminationLabel(point.discrimination)}</span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        {point.faulty ? (
                          <ConfirmAction
                            title="Restore this item?"
                            description="Its penalty returns to every candidate's score. Students see the corrected register the next time they open their result."
                            detail={`Q${point.number} · ${point.topicName}`}
                            confirmLabel="Restore item"
                            tone="neutral"
                            busy={restore.isPending}
                            onConfirm={() =>
                              restore.mutate(point.questionId, {
                                onSuccess: (next) => toast.show({ title: 'Item restored', description: `${next.summary.faultyCount} items remain faulty.`, tone: 'neutral' }),
                                onError: (/** @type {Error} */ error) => toast.error('Not restored', error.message),
                              })
                            }
                          >
                            {(open) => (
                              <Button variant="ghost" size="sm" onClick={open} disabled={restore.isPending}>
                                Restore
                              </Button>
                            )}
                          </ConfirmAction>
                        ) : (
                          <ConfirmAction
                            title="Mark this question faulty?"
                            description="Its penalty is removed from every candidate's score and a correct answer keeps its mark as grace. The score register below recalculates, and students see the new total on their result sheet."
                            detail={`Q${point.number} · p ${point.difficultyIndex.toFixed(2)} · r ${point.discrimination.toFixed(2)} · ${point.topicName}`}
                            confirmLabel="Mark as faulty"
                            busy={mark.isPending}
                            onConfirm={() =>
                              mark.mutate(point.questionId, {
                                onSuccess: (next) => {
                                  const moved = next.scoreImpact.filter((row) => row.delta !== 0).length
                                  toast.show({ title: 'Question marked faulty', description: `${moved} candidates' scores changed. Students now see the recalculated total.`, tone: 'neutral' })
                                },
                                onError: (/** @type {Error} */ error) => toast.error('Not marked', error.message),
                              })
                            }
                          >
                            {(open) => (
                              <Button variant="danger" size="sm" icon={<ShieldAlert strokeWidth={1.5} />} onClick={open} disabled={mark.isPending}>
                                Faulty
                              </Button>
                            )}
                          </ConfirmAction>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 ? (
                <p className="py-6 text-center text-2xs text-muted">No item in this sitting meets that filter.</p>
              ) : null}
            </div>
          </Card>

          <ScoreImpactTable rows={analysis.data.scoreImpact} maxMarks={analysis.data.maxMarks} faultyCount={analysis.data.summary.faultyCount} />
        </div>
      ) : null}
    </>
  )
}

/** @param {{ label: string, value: string, tone?: 'review'|'danger' }} props */
function Stat({ label, value, tone }) {
  return (
    <div className="bg-surface-raised px-3 py-2.5">
      <dt className="rule-label">{label}</dt>
      <dd className={cn('mt-1 font-mono text-lg tabular-nums leading-none', tone === 'review' ? 'text-review-fg' : tone === 'danger' ? 'text-danger-fg' : 'text-heading')}>
        {value}
      </dd>
    </div>
  )
}
