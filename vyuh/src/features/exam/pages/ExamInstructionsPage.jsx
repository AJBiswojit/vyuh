import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, RotateCw } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, Checkbox, ErrorState, Skeleton } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { useStudentId } from '@/features/student/hooks/useStudentWorkspace.js'
import { useActiveExamAttempt, useExamPaper, useStartExam, useSubmittedExamAttempt } from '../hooks/useExamFlow.js'
import { useExamStore } from '../store/examStore.js'
import { formatDateTime } from '@/shared/lib/format.js'
import { StatusLegend } from '../components/StatusShape.jsx'

/** Instructions, marking scheme, system check and declaration before the hall. */
export function ExamInstructionsPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const studentId = useStudentId()
  const paper = useExamPaper(examId, studentId)
  const active = useActiveExamAttempt(examId, studentId)
  const submitted = useSubmittedExamAttempt(examId, studentId)
  const start = useStartExam()
  const startAttempt = useExamStore((state) => state.startAttempt)
  const [declaration, setDeclaration] = useState(false)
  const [checks, setChecks] = useState(/** @type {null | Array<{ id: string, label: string, ok: boolean, detail: string }>} */ (null))
  useDocumentTitle('Exam instructions')

  function runChecks() {
    let storage = false
    try { localStorage.setItem('vyuh.exam.systemCheck', '1'); localStorage.removeItem('vyuh.exam.systemCheck'); storage = true } catch { storage = false }
    setChecks([
      { id: 'network', label: 'Network', ok: navigator.onLine, detail: navigator.onLine ? 'Online. Saves will sync.' : 'Offline. Saves will queue on this device.' },
      { id: 'storage', label: 'Local persistence', ok: storage, detail: storage ? 'Answers and timer can survive refresh.' : 'Storage is blocked; refresh recovery is unavailable.' },
      { id: 'worker', label: 'Timer worker', ok: typeof Worker !== 'undefined', detail: typeof Worker !== 'undefined' ? 'Background-safe timer available.' : 'Worker unavailable; fallback interval will run.' },
      { id: 'viewport', label: 'Screen width', ok: window.innerWidth >= 768, detail: window.innerWidth >= 768 ? 'Hall layout fits this screen.' : 'Best on a larger screen; a notice will stay visible.' },
    ])
  }
  /* Storage is the only hard requirement; network, screen fit and the timer worker are advisory choices the hall tolerates with an honest notice or fallback. */
  const checked = checks?.every((item) => item.ok || item.id === 'network' || item.id === 'viewport' || item.id === 'worker') ?? false
  const exam = paper.data?.exam
  const now = Date.now()
  const startsAt = exam?.scheduledFor ? new Date(exam.scheduledFor).getTime() : null
  const endsAt = exam?.endsAt ? new Date(exam.endsAt).getTime() : null
  const notYet = startsAt !== null && startsAt > now
  const windowClosed = endsAt !== null && endsAt <= now
  const canEnter = Boolean(checked && declaration && paper.data && studentId && examId && !notYet && !windowClosed)

  async function enter() {
    if (!paper.data || !studentId || !examId || !canEnter) return
    try {
      const receipt = await start.mutateAsync({ examId, studentId, declarationAccepted: declaration, systemCheckPassed: checked })
      startAttempt(receipt, paper.data)
      navigate(`/student/exams/${examId}/hall`)
    } catch { /* mutation error renders below */ }
  }

  return (
    <>
      <PageHeader eyebrow="Exam flow" title="Instructions" description="Read the rules, run the system check, and accept the declaration." />
      {paper.isPending ? (
        <div role="status" aria-busy="true" className="space-y-3"><span className="sr-only">Loading instructions</span><Skeleton.Block className="h-40" /><Skeleton.Block className="h-32" /></div>
      ) : paper.isError || !paper.data ? (
        <ErrorState code="E_PAPER" title="Paper could not load" description={/** @type {any} */ (paper.error)?.message ?? 'Try again.'} action={<Button variant="secondary" icon={<RotateCw strokeWidth={1.5} />} onClick={() => paper.refetch()}>Try again</Button>} />
      ) : (
        <div className="flex flex-col gap-5">
          <Card eyebrow={paper.data.exam.track} title={paper.data.exam.title} wrapTitle action={<Badge tone="info" variant="outline">{paper.data.questions.length} questions</Badge>}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div><p className="rule-label">Duration</p><p className="mt-1 font-mono text-sm tabular-nums text-heading">{Math.floor(paper.data.durationSeconds / 60)} min</p></div>
              <div><p className="rule-label">Questions</p><p className="mt-1 font-mono text-sm tabular-nums text-heading">{paper.data.questions.length}</p></div>
              <div><p className="rule-label">Maximum marks</p><p className="mt-1 font-mono text-sm tabular-nums text-heading">{paper.data.exam.maxMarks}</p></div>
              <div><p className="rule-label">Sections</p><p className="mt-1 font-mono text-sm tabular-nums text-heading">{paper.data.sections.length}</p></div>
              <div><p className="rule-label">Correct answer</p><p className="mt-1 font-mono text-sm tabular-nums text-heading">+{paper.data.markingScheme.correct}</p></div>
              <div><p className="rule-label">Incorrect answer</p><p className="mt-1 font-mono text-sm tabular-nums text-heading">−{Math.abs(paper.data.markingScheme.incorrect)}</p></div>
              <div><p className="rule-label">Unattempted</p><p className="mt-1 font-mono text-sm tabular-nums text-heading">{paper.data.markingScheme.unattempted}</p></div>
              <div><p className="rule-label">Window</p><p className="mt-1 text-2xs leading-snug text-heading">{paper.data.exam.scheduledFor ? `${formatDateTime(paper.data.exam.scheduledFor)} → ${paper.data.exam.endsAt ? formatDateTime(paper.data.exam.endsAt) : 'close'}` : 'On release'}</p></div>
            </div>
            <div className="mt-4"><p className="rule-label">Section names</p><p className="mt-1 text-xs text-heading">{paper.data.sections.map((section) => section.name).join(' · ')}</p></div>
          </Card>
          <Card title="Rules">
            <ol className="list-decimal space-y-2 pl-5 text-xs leading-relaxed text-body">{paper.data.rules.map((rule) => <li key={rule}>{rule}</li>)}</ol>
          </Card>
          <Card title="How the hall works">
            <ol className="list-decimal space-y-2 pl-5 text-xs leading-relaxed text-body">
              <li>Select an option to record your response. Nothing is final until you confirm submission.</li>
              <li>Use <span className="font-[560] text-heading">Save and next</span> to save a response and move to the next question.</li>
              <li>Use <span className="font-[560] text-heading">Mark for review and next</span> to flag a question you want to revisit. Marked-for-review responses are still counted as answered.</li>
              <li>Jump to any question or section from the palette and the section tabs. Your answers and review flags are kept when you switch.</li>
              <li>Use <span className="font-[560] text-heading">Submit exam</span> whenever you are done. You will be asked to confirm before the sheet is finalised.</li>
              <li>When the timer reaches zero the sheet submits automatically, wherever you are.</li>
            </ol>
          </Card>
          <Card title="Question status legend">
            <StatusLegend />
            <p className="mt-2 text-2xs leading-relaxed text-muted">The palette shows one of these five states for every question. Counts in the palette always add up to the paper total.</p>
          </Card>
          <Card title="System check" action={<Button variant="secondary" size="sm" onClick={runChecks}>Run checks</Button>}>
            {checks ? (
              <ul className="divide-y divide-line" data-testid="system-checks">
                {checks.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 py-3 text-xs">
                    {item.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-answer-fg" strokeWidth={1.5} aria-hidden="true" /> : <Circle className="mt-0.5 size-4 shrink-0 text-review-fg" strokeWidth={1.5} aria-hidden="true" />}
                    <div><p className="font-[560] text-heading">{item.label}</p><p className="mt-0.5 text-muted">{item.detail}</p></div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-xs text-muted">Run the check to confirm persistence, timer and screen fit.</p>}
          </Card>
          <Card title="Declaration">
            <Checkbox label="I have read and understood the instructions." description={paper.data.declaration} checked={declaration} onChange={(event) => setDeclaration(event.target.checked)} />
          </Card>
          {start.isError ? <p role="alert" className="text-xs text-danger-fg">{/** @type {any} */ (start.error)?.message ?? 'Could not start the exam.'}</p> : null}
          {notYet ? <p role="status" className="text-xs text-review-fg">This paper opens at {exam?.scheduledFor ? formatDateTime(exam.scheduledFor) : 'the scheduled time'}. Start exam stays disabled until then.</p> : null}
          {windowClosed ? <p role="status" className="text-xs text-danger-fg">The examination window closed at {exam?.endsAt ? formatDateTime(exam.endsAt) : 'the scheduled close'}. This attempt can no longer be started.</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" icon={<ArrowLeft strokeWidth={1.5} />} onClick={() => navigate(`/student/exams/${examId}`)}>Back to detail</Button>
            {submitted ? (
              <Button variant="secondary" trailingIcon={<ArrowRight strokeWidth={1.5} />} onClick={() => navigate(`/student/exams/${examId}/confirmation`)}>View submission</Button>
            ) : (
              <Button variant="primary" trailingIcon={<ArrowRight strokeWidth={1.5} />} disabled={!active && !canEnter} loading={start.isPending} onClick={active ? () => navigate(`/student/exams/${examId}/hall`) : enter}>{active ? 'Resume exam' : notYet ? 'Start exam at start time' : windowClosed ? 'Window closed' : 'Start exam'}</Button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
