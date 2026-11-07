import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FileText, RotateCw } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, ErrorState, Skeleton } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime } from '@/shared/lib/format.js'
import { useStudentId } from '@/features/student/hooks/useStudentWorkspace.js'
import { useExamAnalysis, useReleaseCountdown } from '../hooks/useAnalysis.js'
import { ResultSummary } from '../components/ResultSummary.jsx'
import { ReleaseLock } from '../components/ReleaseLock.jsx'
import { QuestionLedger } from '../components/QuestionLedger.jsx'
import { QuestionDrawer } from '../components/QuestionDrawer.jsx'
import { PacingChart } from '../components/PacingChart.jsx'
import { AttemptPathChart } from '../components/AttemptPathChart.jsx'
import { MistakeDnaChart } from '../components/MistakeDnaChart.jsx'
import { AccuracyHeatmap } from '../components/AccuracyHeatmap.jsx'
import { WhatIfPanel } from '../components/WhatIfPanel.jsx'
import { AttemptTrendChart } from '../components/AttemptTrendChart.jsx'
import { FILTERS } from '../lib/labels.js'

/** @typedef {import('@/contracts/analysis.js').LedgerFilter} LedgerFilter */
/** @typedef {import('@/contracts/analysis.js').QuestionAnalysis} QuestionAnalysis */

/** Phase 5 result sheet: summary, question ledger, drawer, charts and what-if. */
export function ExamResultPage() {
  const { examId } = useParams()
  const [params, setParams] = useSearchParams()
  const studentId = useStudentId()
  const attemptId = params.get('attempt') ?? undefined
  const requestedFilter = params.get('filter')
  const filter = /** @type {LedgerFilter} */ (FILTERS.some((item) => item.id === requestedFilter) ? requestedFilter : 'all')
  const analysis = useExamAnalysis(examId, studentId, attemptId)
  const { refetch } = analysis
  const data = analysis.data
  const seconds = useReleaseCountdown(data?.release)
  const [row, setRow] = useState(/** @type {QuestionAnalysis | null} */ (null))
  const refreshedRelease = useRef(/** @type {string | null} */ (null))
  useDocumentTitle(data ? `Result sheet · ${data.examTitle}` : 'Result sheet')

  useEffect(() => {
    const releaseAt = data?.release.releaseAt
    if (!data || data.release.released || seconds > 0 || !releaseAt || refreshedRelease.current === releaseAt) return
    refreshedRelease.current = releaseAt
    refetch()
  }, [data, seconds, refetch])

  const onFilter = useCallback((/** @type {LedgerFilter} */ value) => {
    setParams((current) => { const next = new URLSearchParams(current); if (value === 'all') next.delete('filter'); else next.set('filter', value); return next }, { replace: true })
  }, [setParams])
  const onOpen = useCallback((/** @type {QuestionAnalysis} */ value) => setRow(value), [])
  const onClose = useCallback(() => setRow(null), [])

  return (
    <>
      <PageHeader eyebrow="Result sheet" title="Result sheet" description={data ? `${data.examTitle} · ${data.candidateName} · ${data.rollNumber}` : 'Score, question ledger and the analysis behind every mark.'}
        meta={data ? <><Badge tone={data.source === 'submission' ? 'answer' : 'info'} variant="outline" shape="none">{data.source === 'submission' ? 'Your submission' : 'Published example'}</Badge><span className="font-mono text-2xs text-faint">{data.attemptId}</span><span className="text-2xs text-muted">Submitted {formatDateTime(data.submittedAt)}</span></> : undefined}
        actions={<Link to="/student/exams" className="inline-flex min-h-9 items-center gap-1 rounded-xs px-1.5 text-2xs font-[560] text-heading hover:text-ember-press"><ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />Exams</Link>} />
      {analysis.isPending ? (
        <div role="status" aria-busy="true" className="space-y-4"><span className="sr-only">Loading result sheet</span><Skeleton.Block className="h-56" /><Skeleton.Block className="h-96" /></div>
      ) : analysis.isError ? (
        <ErrorState code="E_ANALYSIS" title="Result sheet could not load" description={/** @type {any} */ (analysis.error)?.message ?? 'Try again.'} action={<Button variant="secondary" icon={<RotateCw strokeWidth={1.5} />} onClick={() => refetch()} loading={analysis.isRefetching}>Try again</Button>} />
      ) : !data ? null : !data.details ? (
        <ReleaseLock release={data.release} seconds={seconds} onRefresh={() => refetch()} refreshing={analysis.isRefetching} />
      ) : (
        <div className="flex flex-col gap-8">
          {data.source === 'fixture' ? <p className="rounded-sm border border-line bg-surface-sunken px-4 py-3 text-xs text-muted">Published example sheet. Submit this paper to replace it with your own stored attempt.</p> : null}
          <ResultSummary summary={data.details.summary} />
          <QuestionLedger rows={data.details.questions} filter={filter} onFilter={onFilter} onOpen={onOpen} />
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <PacingChart points={data.details.pacing} />
            <AttemptPathChart visits={data.details.path} />
            <MistakeDnaChart slices={data.details.mistakeDna} dominant={data.details.dominantMistake} advice={data.details.mistakeAdvice} />
            <AccuracyHeatmap cells={data.details.heatmap} />
            <WhatIfPanel rows={data.details.questions} maxMarks={data.details.summary.maxMarks} />
            <AttemptTrendChart points={data.details.attemptTrend} />
          </div>
          <div className="flex flex-wrap gap-3 border-t border-line pt-5">
            <Link to="/student/performance" className="inline-flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border border-line px-4 text-xs font-[560] text-heading hover:border-line-strong"><FileText className="size-3.5" strokeWidth={1.5} aria-hidden="true" />Performance</Link>
            <Link to={`/student/exams/${data.examId}`} className="inline-flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border border-heading bg-heading px-4 text-xs font-[560] text-on-inverse hover:opacity-90">Back to exam</Link>
          </div>
          <QuestionDrawer row={row} onClose={onClose} examId={data.examId} attemptId={data.source === 'submission' ? data.attemptId : ''} />
        </div>
      )}
    </>
  )
}
