import { Link } from 'react-router-dom'
import { ArrowUpRight, TrendingUp } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Card, EmptyState, ErrorState, Skeleton, Button } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { readChartTokens } from '@/shared/lib/chartTokens.js'
import { formatDate } from '@/shared/lib/format.js'
import { ChartFrame } from '@/features/analysis/components/ChartFrame.jsx'
import { useExams, usePerformance, useStudentId } from '../hooks/useStudentWorkspace.js'

/** Score trend across attempts, with table alternatives and a result-sheet handoff. */
export function PerformancePage() {
  useDocumentTitle('Performance')
  const studentId = useStudentId()
  const { data, isPending, isError, error, refetch, isRefetching } = usePerformance(studentId)
  const exams = useExams(studentId)
  const resultExam = exams.data?.find((exam) => exam.track === 'NEET')
  const tokens = readChartTokens()

  const subjectData = (data?.subjects ?? []).length
    ? (data?.scoreTrend ?? []).map((point, index) => {
        /** @type {Record<string, string | number | null>} */
        const row = { label: point.label }
        for (const subject of data?.subjects ?? []) row[subject.name] = subject.trend[index] ?? null
        return row
      })
    : []

  return (
    <>
      <PageHeader eyebrow="Student workspace" title="Performance" description="Score trend across attempts and subject-wise movement. Batch average is context, not a ranking."
        actions={resultExam ? <Link to={`/student/exams/${resultExam.id}/result`} className="inline-flex min-h-9 items-center gap-1 rounded-xs px-1.5 text-2xs font-[560] text-heading hover:text-ember-press">Open result sheet<ArrowUpRight className="size-3.5" strokeWidth={1.5} aria-hidden="true" /></Link> : undefined} />
      {isPending ? <Skeleton.Block className="h-72" /> : isError ? (
        <ErrorState code="E_PERFORMANCE" title="Performance could not load" description={/** @type {any} */ (error)?.message ?? 'Try again.'} action={<Button variant="secondary" onClick={() => refetch()} loading={isRefetching}>Try again</Button>} />
      ) : !data || data.attempts.length === 0 ? (
        <EmptyState size="panel" icon={<TrendingUp strokeWidth={1.5} />} title="No past attempts yet" description="Submit your first paper to start the trend. Until then there is nothing to chart and no baseline to compare." code="0 attempts" />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card eyebrow="Attempts" title="Papers evaluated"><p className="font-mono text-2xl tabular-nums text-heading">{data.attempts.length}</p></Card>
            <Card eyebrow="Latest score" title={data.attempts[0].title}><p className="font-mono text-2xl tabular-nums text-heading">{data.attempts[0].score}<span className="text-sm text-faint"> / {data.attempts[0].maxMarks}</span></p><p className="mt-1 text-2xs text-muted">{formatDate(data.attempts[0].submittedAt)}</p></Card>
            <Card eyebrow="Latest percentile" title="Against the cohort"><p className="font-mono text-2xl tabular-nums text-heading">{data.attempts[0].percentile.toFixed(1)}</p></Card>
          </div>
          <ChartFrame eyebrow="Score trend" title="Across attempts"
            table={{ caption: 'Score trend data by attempt', rows: data.scoreTrend, columns: [
              { key: 'label', label: 'Paper' }, { key: 'date', label: 'Date' }, { key: 'score', label: 'Score', align: 'right' },
              { key: 'percentile', label: 'Percentile', align: 'right' }, { key: 'cohortAverage', label: 'Batch average', align: 'right' },
            ] }}>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.scoreTrend} margin={{ top: 8, right: 12, bottom: 0, left: -12 }} accessibilityLayer>
                  <CartesianGrid stroke={tokens.grid} strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: tokens.axisText }} axisLine={{ stroke: tokens.grid }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: tokens.axisText }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip contentStyle={{ background: tokens.surface, border: `1px solid ${tokens.grid}`, borderRadius: 6, fontSize: 12 }} />
                  <Line type="monotone" dataKey="cohortAverage" name="Batch average" stroke={tokens.idle} strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="score" name="Your score" stroke={tokens.ember} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartFrame>
          <ChartFrame eyebrow="Subject-wise trends" title="Movement by subject"
            table={{ caption: 'Subject trend data by attempt', rows: subjectData, columns: [
              { key: 'label', label: 'Paper' }, ...(data.subjects ?? []).map((subject) => ({ key: subject.name, label: subject.name, align: /** @type {'right'} */ ('right') })),
            ] }}>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={subjectData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }} accessibilityLayer>
                  <CartesianGrid stroke={tokens.grid} strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: tokens.axisText }} axisLine={{ stroke: tokens.grid }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: tokens.axisText }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip contentStyle={{ background: tokens.surface, border: `1px solid ${tokens.grid}`, borderRadius: 6, fontSize: 12 }} />
                  {(data.subjects ?? []).map((subject, index) => (
                    <Line key={subject.subjectId} type="monotone" dataKey={subject.name} stroke={[tokens.ember, tokens.ink, tokens.idle][index % 3]} strokeWidth={2} dot={{ r: 2.5 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 flex flex-wrap gap-4">{data.subjects.map((subject) => <li key={subject.subjectId} className="text-2xs text-muted"><span className="font-[560] text-heading">{subject.name}</span> {subject.score}/100 · avg {subject.batchAverage}</li>)}</ul>
          </ChartFrame>
        </div>
      )}
    </>
  )
}
