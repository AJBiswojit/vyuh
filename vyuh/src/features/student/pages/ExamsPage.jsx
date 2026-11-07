import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BarChart3, FileText, RotateCw } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton, Tabs, Tab, TabList, TabPanel } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime, formatMarks } from '@/shared/lib/format.js'
import { useAttempts, useExams, useStudentId } from '../hooks/useStudentWorkspace.js'
import { PatternChips } from '../components/PatternChips.jsx'

const TABS = /** @type {const} */ (['upcoming', 'live', 'past'])
/** @typedef {typeof TABS[number]} ExamTab */

/** Exams as ruled ledger rows, grouped into Upcoming / Live / Past tabs. */
export function ExamsPage() {
  useDocumentTitle('Exams')
  const studentId = useStudentId()
  const navigate = useNavigate()
  const exams = useExams(studentId)
  const attempts = useAttempts(studentId)
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('exam')
  const requested = params.get('tab') ?? params.get('filter')
  const selected = exams.data?.find((exam) => exam.id === selectedId)
  const tab = /** @type {ExamTab} */ (TABS.includes(/** @type {ExamTab} */ (requested ?? '')) ? requested : selected ? (selected.status === 'live' ? 'live' : selected.status === 'closed' ? 'past' : 'upcoming') : 'upcoming')

  const grouped = useMemo(() => {
    const items = exams.data ?? []
    return {
      upcoming: items.filter((exam) => exam.status === 'scheduled' || exam.status === 'draft'),
      live: items.filter((exam) => exam.status === 'live'),
      past: items.filter((exam) => exam.status === 'closed'),
    }
  }, [exams.data])

  /** @param {string} value */
  const setTab = (value) => setParams((current) => { const next = new URLSearchParams(current); next.set('tab', TABS.includes(/** @type {ExamTab} */ (value)) ? value : 'upcoming'); next.delete('filter'); next.delete('exam'); return next }, { replace: true })

  return (
    <>
      <PageHeader eyebrow="Student workspace" title="Exams" description="Upcoming, live and past papers. Pattern chips state the facts before you enter the hall." />
      {exams.isPending ? (
        <div role="status" aria-busy="true" className="space-y-3"><span className="sr-only">Loading exams</span><Skeleton.Block className="h-16" /><Skeleton.Block className="h-16" /><Skeleton.Block className="h-16" /></div>
      ) : exams.isError ? (
        <ErrorState code="E_EXAMS" title="Exams could not load" description={/** @type {any} */ (exams.error)?.message ?? 'Try again.'} action={<Button variant="secondary" icon={<RotateCw strokeWidth={1.5} />} onClick={() => exams.refetch()} loading={exams.isRefetching}>Try again</Button>} />
      ) : (
        <>
          {selected ? (
            <Card className="mb-5" eyebrow="Exam hall" title={selected.title} action={<Badge tone={selected.status === 'live' ? 'info' : 'neutral'} variant="outline">{selected.status}</Badge>}>
              <div className="flex flex-col gap-4">
                <PatternChips exam={selected} />
                <p className="text-xs text-muted">Starts {selected.scheduledFor ? formatDateTime(selected.scheduledFor) : 'on release'}. Open exam detail for the full Phase 4 flow: instructions, system check, hall and submission.</p>
                <ul className="list-disc space-y-1 pl-5 text-xs text-body">{selected.instructions.map((line) => <li key={line}>{line}</li>)}</ul>
                <div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={() => navigate(`/student/exams/${selected.id}`)}>Open exam detail</Button>{selected.track === 'NEET' ? <Button variant="ghost" size="sm" icon={<BarChart3 strokeWidth={1.5} />} onClick={() => navigate(`/student/exams/${selected.id}/result`)}>Result sheet</Button> : null}</div>
              </div>
            </Card>
          ) : null}
          <Tabs value={tab} onValueChange={setTab}>
            <TabList aria-label="Exams by state">
              <Tab value="upcoming" count={grouped.upcoming.length}>Upcoming</Tab>
              <Tab value="live" count={grouped.live.length}>Live</Tab>
              <Tab value="past" count={grouped.past.length}>Past</Tab>
            </TabList>
            {TABS.map((value) => (
              <TabPanel key={value} value={value} className="pt-5">
                {grouped[value].length === 0 ? (
                  <EmptyState size="panel" icon={<FileText strokeWidth={1.5} />} title={`No ${value} exams`} description={value === 'past' ? 'Submitted papers appear here with their score once evaluated.' : value === 'live' ? 'A paper appears here while its window is open.' : 'Faculty-published papers appear here with their reporting time.'} code={`0 ${value}`} />
                ) : (
                  <ul className="divide-y divide-line border-y border-line">
                    {grouped[value].map((exam) => {
                      const attempt = attempts.data?.find((item) => item.examId === exam.id)
                      return (
                        <li key={exam.id} className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-2 text-xs font-[560] text-heading"><span className="truncate">{exam.title}</span><Badge tone={exam.status === 'live' ? 'info' : exam.status === 'closed' ? 'idle' : 'neutral'} variant="outline" shape="none">{exam.status}</Badge></p>
                            <p className="mt-1 font-mono text-2xs tabular-nums text-faint">{exam.scheduledFor ? formatDateTime(exam.scheduledFor) : 'Timed on release'}{attempt ? ` · ${formatMarks(attempt.score, attempt.maxMarks)} · ${attempt.percentile.toFixed(1)} pct` : ''}</p>
                            <div className="mt-2"><PatternChips exam={exam} /></div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set('exam', exam.id); next.set('tab', TABS.includes(/** @type {ExamTab} */ (value)) ? value : 'upcoming'); return next }, { replace: true })}>View rules</Button>
                            <Button variant="secondary" size="sm" onClick={() => navigate(`/student/exams/${exam.id}`)}>Exam detail</Button>
                            {exam.track === 'NEET' ? <Button variant="ghost" size="sm" icon={<BarChart3 strokeWidth={1.5} />} onClick={() => navigate(`/student/exams/${exam.id}/result`)}>Result sheet</Button> : null}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </TabPanel>
            ))}
          </Tabs>
        </>
      )}
    </>
  )
}
