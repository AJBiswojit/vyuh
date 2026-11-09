import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, BarChart3, FileText, Play, RotateCw, ScrollText } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton, Tabs, Tab, TabList, TabPanel } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime, formatMarks } from '@/shared/lib/format.js'
import { canEnterExamHall, canShowResultSheet, examHallNotice } from '@/shared/lib/examAvailability.js'
import { useActiveExamAttempt, useSubmittedExamAttempt } from '@/features/exam/hooks/useExamFlow.js'
import { useAttempts, useExams, useStudentId } from '../hooks/useStudentWorkspace.js'
import { PatternChips } from '../components/PatternChips.jsx'

const TABS = /** @type {const} */ (['upcoming', 'live', 'past'])
/** @typedef {typeof TABS[number]} ExamTab */
/** @typedef {import('@/contracts/student.js').Exam} Exam */

/**
 * The one place every exam action is chosen, driven entirely by real state:
 * local store (started / submitted on this device) layered on the published
 * ledger. No action button is ever decorative.
 * @param {{ exam: Exam & { playable?: boolean, unavailableReason?: string | null }, size?: 'sm' | 'lg' }} props
 */
function ExamActions({ exam, size = 'sm' }) {
  const navigate = useNavigate()
  const studentId = useStudentId()
  const active = useActiveExamAttempt(exam.id, studentId)
  const submitted = useSubmittedExamAttempt(exam.id, studentId)
  if (exam.status === 'live') {
    /* Per-exam CTAs are secondary: the live tab carries several equal next steps,
       so ember is reserved for page-defining actions (one per view, by rule). */
    return (
      <div className="flex flex-wrap items-center gap-2">
        {submitted ? (
          <Button variant="secondary" size={size} icon={<ScrollText strokeWidth={1.5} />} onClick={() => navigate(`/student/exams/${exam.id}/confirmation`)}>View submission</Button>
        ) : active ? (
          <Button variant="secondary" size={size} icon={<Play strokeWidth={1.5} />} onClick={() => navigate(`/student/exams/${exam.id}/hall`)}>Resume exam</Button>
        ) : canEnterExamHall(exam) ? (
          <Button variant="secondary" size={size} trailingIcon={<ArrowRight strokeWidth={1.5} />} onClick={() => navigate(`/student/exams/${exam.id}/instructions`)}>Join exam</Button>
        ) : (
          <Button variant="secondary" size={size} disabled>Join exam</Button>
        )}
        {canShowResultSheet(exam) ? <Button variant="ghost" size={size} icon={<BarChart3 strokeWidth={1.5} />} onClick={() => navigate(`/student/exams/${exam.id}/result`)}>View result</Button> : null}
      </div>
    )
  }
  if (exam.status === 'closed') {
    const resultAvailable = canShowResultSheet(exam)
    return (
      <div className="flex flex-wrap items-center gap-2">
        {resultAvailable ? <Button variant="secondary" size={size} icon={<BarChart3 strokeWidth={1.5} />} onClick={() => navigate(`/student/exams/${exam.id}/result`)}>View result</Button> : null}
        {submitted ? <Button variant={resultAvailable ? 'ghost' : 'secondary'} size={size} icon={<ScrollText strokeWidth={1.5} />} onClick={() => navigate(`/student/exams/${exam.id}/confirmation`)}>View submission</Button> : null}
        {!resultAvailable && !submitted ? <span className="self-center text-2xs text-muted">Result not published</span> : null}
      </div>
    )
  }
  return <Button variant="secondary" size={size} onClick={() => navigate(`/student/exams/${exam.id}`)}>View details</Button>
}

/** Prominent live-exam card: window, pattern, attempt state and one obvious action.
 * @param {{ exam: Exam & { playable?: boolean, unavailableReason?: string | null } }} props */
function LiveExamCard({ exam }) {
  const studentId = useStudentId()
  const active = useActiveExamAttempt(exam.id, studentId)
  const submitted = useSubmittedExamAttempt(exam.id, studentId)
  const notice = examHallNotice(exam)
  const attemptStatus = submitted
    ? 'Submitted — your receipt is saved.'
    : active
      ? 'Attempt in progress — your answers and timer are restored when you rejoin.'
      : 'Not started yet.'
  return (
    <li className="rounded-md border border-ember bg-[color-mix(in_oklab,var(--color-ember-wash)_28%,var(--color-surface-raised))] p-4 shadow-[var(--shadow-float)] sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="info" variant="solid" shape="none"><span className="inline-flex items-center gap-1.5"><span className="size-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />LIVE</span></Badge>
        <Badge tone="neutral" variant="outline" shape="none">{exam.kind}</Badge>
        <span className="font-mono text-2xs uppercase tracking-wide text-faint">{exam.track}</span>
      </div>
      <h3 className="mt-2 text-base font-[560] leading-snug text-heading">{exam.title}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-2xs sm:grid-cols-4 lg:grid-cols-6">
        <div><dt className="rule-label">Starts</dt><dd className="mt-0.5 font-mono text-heading">{exam.scheduledFor ? formatDateTime(exam.scheduledFor) : 'On release'}</dd></div>
        <div><dt className="rule-label">Window closes</dt><dd className="mt-0.5 font-mono text-heading">{exam.endsAt ? formatDateTime(exam.endsAt) : 'After duration'}</dd></div>
        <div><dt className="rule-label">Duration</dt><dd className="mt-0.5 font-mono text-heading">{exam.durationMinutes} min</dd></div>
        <div><dt className="rule-label">Questions</dt><dd className="mt-0.5 font-mono text-heading">{exam.questionCount}</dd></div>
        <div><dt className="rule-label">Maximum marks</dt><dd className="mt-0.5 font-mono text-heading">{exam.maxMarks}</dd></div>
        <div><dt className="rule-label">Sections</dt><dd className="mt-0.5 font-mono text-heading">{exam.sectionCount}</dd></div>
      </dl>
      <p className="mt-3 text-2xs font-[560] text-body" data-testid={`attempt-status-${exam.id}`}>{attemptStatus}</p>
      {notice ? <p data-testid={`exam-notice-${exam.id}`} className="mt-2 rounded-sm border border-line bg-surface-sunken px-3 py-2 text-2xs leading-relaxed text-muted">{notice}</p> : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <PatternChips exam={exam} />
        <ExamActions exam={exam} size="lg" />
      </div>
    </li>
  )
}

/** Past-paper ledger row. Score renders ONLY when a real seeded attempt exists.
 * @param {{ exam: Exam & { playable?: boolean }, attempt: import('@/contracts/student.js').AttemptSummary | undefined }} props */
function PastExamRow({ exam, attempt }) {
  const studentId = useStudentId()
  const submitted = useSubmittedExamAttempt(exam.id, studentId)
  const submissionAt = attempt?.submittedAt ?? submitted?.receipt?.submittedAt ?? null
  const resultAvailable = canShowResultSheet(exam)
  return (
    <li className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-xs font-[560] text-heading"><span className="truncate">{exam.title}</span><Badge tone="idle" variant="outline" shape="none">closed</Badge></p>
        <p className="mt-1 font-mono text-2xs tabular-nums text-faint">{exam.scheduledFor ? formatDateTime(exam.scheduledFor) : 'Timed on release'}</p>
        <p className="mt-1 text-2xs text-muted">
          Submission: <span className="text-heading">{submissionAt ? `Submitted ${formatDateTime(submissionAt)}` : 'Not attempted'}</span>
          {' · '}Result: <span className="text-heading">{resultAvailable ? 'Available' : 'Not published'}</span>
          {attempt ? <>{' · '}Score <span className="font-mono tabular-nums text-heading">{formatMarks(attempt.score, attempt.maxMarks)}</span> · <span className="font-mono tabular-nums text-heading">{attempt.percentile.toFixed(1)} pct</span></> : null}
        </p>
        <div className="mt-2"><PatternChips exam={exam} /></div>
      </div>
      <ExamActions exam={exam} />
    </li>
  )
}

/** @param {{ exam: Exam }} props */
function UpcomingExamRow({ exam }) {
  return (
    <li className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-xs font-[560] text-heading"><span className="truncate">{exam.title}</span><Badge tone="neutral" variant="outline" shape="none">scheduled</Badge></p>
        <p className="mt-1 font-mono text-2xs tabular-nums text-faint">{exam.scheduledFor ? formatDateTime(exam.scheduledFor) : 'Timed on release'}{exam.endsAt ? ` → ${formatDateTime(exam.endsAt)}` : ''}</p>
        <p className="mt-1 font-mono text-2xs tabular-nums text-faint">{exam.durationMinutes} min · {exam.questionCount} questions · {exam.maxMarks} marks · {exam.sectionCount} {exam.sectionCount === 1 ? 'section' : 'sections'}</p>
        <div className="mt-2"><PatternChips exam={exam} /></div>
        {exam.playable === false ? <p className="mt-1.5 font-mono text-2xs text-faint">Exam hall not published in this prototype</p> : null}
      </div>
      <ExamActions exam={exam} />
    </li>
  )
}

/** Exams as a ledger: prominent Live cards plus Upcoming / Past tabs. */
export function ExamsPage() {
  useDocumentTitle('Exams')
  const studentId = useStudentId()
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
      <PageHeader eyebrow="Student workspace" title="Exams" description="Live papers first: join, resume or review your submission. Upcoming and past papers stay honest about what is published." />
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
                <p className="text-xs text-muted">Starts {selected.scheduledFor ? formatDateTime(selected.scheduledFor) : 'on release'}. Open exam detail for the full flow: instructions, system check, hall and submission.</p>
                <ul className="list-disc space-y-1 pl-5 text-xs text-body">{selected.instructions.map((line) => <li key={line}>{line}</li>)}</ul>
                {selected.playable === false ? <p className="rounded-sm border border-line bg-surface-sunken px-3 py-2 text-2xs leading-relaxed text-muted">{selected.unavailableReason ?? 'The exam hall is not published for this paper in the mock prototype.'}</p> : null}
                <ExamActions exam={selected} />
              </div>
            </Card>
          ) : null}
          <Tabs value={tab} onValueChange={setTab}>
            <TabList aria-label="Exams by state">
              <Tab value="upcoming" count={grouped.upcoming.length}>Upcoming</Tab>
              <Tab value="live" count={grouped.live.length} className={grouped.live.length > 0 ? 'text-ember-press' : undefined}>
                {grouped.live.length > 0 ? <span className="inline-block size-1.5 animate-pulse rounded-full bg-ember" aria-hidden="true" /> : null}Live
              </Tab>
              <Tab value="past" count={grouped.past.length}>Past</Tab>
            </TabList>
            <TabPanel value="upcoming" className="pt-5">
              {grouped.upcoming.length === 0 ? (
                <EmptyState size="panel" icon={<FileText strokeWidth={1.5} />} title="No upcoming exams" description="Faculty-published papers appear here with their reporting time." code="0 upcoming" />
              ) : (
                <ul className="divide-y divide-line border-y border-line">{grouped.upcoming.map((exam) => <UpcomingExamRow key={exam.id} exam={exam} />)}</ul>
              )}
            </TabPanel>
            <TabPanel value="live" className="pt-5">
              {grouped.live.length === 0 ? (
                <EmptyState size="panel" icon={<FileText strokeWidth={1.5} />} title="No live exams" description="A paper appears here with a join button while its window is open." code="0 live" />
              ) : (
                <ul className="flex flex-col gap-4">{grouped.live.map((exam) => <LiveExamCard key={exam.id} exam={exam} />)}</ul>
              )}
            </TabPanel>
            <TabPanel value="past" className="pt-5">
              {grouped.past.length === 0 ? (
                <EmptyState size="panel" icon={<FileText strokeWidth={1.5} />} title="No past exams" description="Submitted papers appear here with their score once evaluated." code="0 past" />
              ) : (
                <ul className="divide-y divide-line border-y border-line">{grouped.past.map((exam) => <PastExamRow key={exam.id} exam={exam} attempt={attempts.data?.find((item) => item.examId === exam.id)} />)}</ul>
              )}
            </TabPanel>
          </Tabs>
        </>
      )}
    </>
  )
}
