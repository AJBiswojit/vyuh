import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Expand, LayoutGrid, WifiOff } from 'lucide-react'
import { Button, ErrorState, Sheet, Skeleton } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { useStudentId } from '@/features/student/hooks/useStudentWorkspace.js'
import { countStatuses, submissionCounts } from '../lib/examState.js'
import { useExamPaper, useExamShortcuts, useExamSync, useExamTimer, useSubmitExam } from '../hooks/useExamFlow.js'
import { useExamIntegrity } from '../hooks/useExamIntegrity.js'
import { useExamStore } from '../store/examStore.js'
import { ExamHallHeader } from '../components/ExamHallHeader.jsx'
import { SectionTabs } from '../components/SectionTabs.jsx'
import { QuestionPalette } from '../components/QuestionPalette.jsx'
import { QuestionPanel } from '../components/QuestionPanel.jsx'
import { ToolsDock } from '../components/ToolsDock.jsx'
import { CalculatorPanel } from '../components/CalculatorPanel.jsx'
import { RoughSheetPanel } from '../components/RoughSheetPanel.jsx'
import { FontSizePanel } from '../components/FontSizePanel.jsx'
import { SubmitSheet } from '../components/SubmitSheet.jsx'
import { ShortcutSheet } from '../components/ShortcutSheet.jsx'

/** NTA-style exam hall. The attempt lives in persisted Zustand state; the timer
 * runs in a worker; saves queue offline; integrity events are logged lightly. */
export function ExamHallPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const studentId = useStudentId()
  const paper = useExamPaper(examId, studentId)
  const attempt = useExamStore((state) => Object.values(state.attempts).find((item) => item.examId === examId && item.studentId === studentId))
  const [submitOpen, setSubmitOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [openTool, setOpenTool] = useState(/** @type {'calculator'|'rough'|'font'|null} */ (null))
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { submit, isPending } = useSubmitExam(attempt?.attemptId)
  const { online } = useExamSync(attempt)
  const { fullscreen, enterFullscreen } = useExamIntegrity(attempt?.attemptId, attempt?.status === 'active')
  useDocumentTitle(attempt ? `${attempt.examTitle} — hall` : 'Exam hall')

  const onExpire = useCallback((/** @type {number} */ remaining) => {
    if (attempt?.status !== 'active') return
    void submit('timer_expired', remaining).then(() => navigate(`/student/exams/${examId}/confirmation`, { replace: true }))
  }, [attempt?.status, submit, navigate, examId])
  const { remaining, source } = useExamTimer(attempt, onExpire)

  const questions = paper.data?.questions ?? []
  const currentQuestion = attempt ? questions.find((question) => question.id === attempt.questionIds[attempt.currentIndex]) ?? questions[attempt.currentIndex] : undefined
  const entry = attempt && currentQuestion ? attempt.entries[currentQuestion.id] ?? { questionId: currentQuestion.id, state: /** @type {const} */ ('not_answered'), selected: [], timeSpentSeconds: 0 } : undefined
  const confidence = attempt && currentQuestion ? attempt.confidences[currentQuestion.id] ?? null : null
  const activeSectionId = currentQuestion?.sectionId ?? attempt?.sections[0]?.id ?? ''
  const counts = attempt ? countStatuses(attempt.entries, attempt.questionIds) : { answered: 0, not_answered: 0, review: 0, review_answered: 0, not_visited: 0, total: 0 }
  const submitCounts = submissionCounts(counts)

  useEffect(() => {
    if (paper.isPending) return
    if (!attempt) { navigate(`/student/exams/${examId}/instructions`, { replace: true }); return }
    if (attempt.status === 'submitted') navigate(`/student/exams/${examId}/confirmation`, { replace: true })
  }, [attempt, paper.isPending, navigate, examId])

  /** @param {string[]} selected */
  const answer = useCallback((/** @type {string[]} */ selected) => {
    if (!attempt || !currentQuestion) return
    useExamStore.getState().answer(attempt.attemptId, currentQuestion, selected)
  }, [attempt, currentQuestion])
  const saveNext = useCallback(() => {
    if (!attempt || !currentQuestion) return
    if (attempt.currentIndex >= attempt.questionIds.length - 1) {
      useExamStore.getState().answer(attempt.attemptId, currentQuestion, attempt.entries[currentQuestion.id]?.selected ?? [])
      setSubmitOpen(true)
      return
    }
    useExamStore.getState().saveAndNext(attempt.attemptId, currentQuestion)
  }, [attempt, currentQuestion])
  const reviewNext = useCallback(() => {
    if (!attempt || !currentQuestion) return
    useExamStore.getState().reviewAndNext(attempt.attemptId, currentQuestion)
  }, [attempt, currentQuestion])
  const clear = useCallback(() => {
    if (!attempt || !currentQuestion) return
    useExamStore.getState().clear(attempt.attemptId, currentQuestion.id)
  }, [attempt, currentQuestion])
  const previous = useCallback(() => { if (attempt) useExamStore.getState().previous(attempt.attemptId) }, [attempt])

  useExamShortcuts({
    enabled: Boolean(attempt?.status === 'active' && currentQuestion && !submitOpen && !shortcutsOpen),
    onSelect: (index) => { if (currentQuestion?.type !== 'numeric' && currentQuestion?.options[index]) answer([currentQuestion.options[index].key]) },
    onSave: saveNext,
    onReview: reviewNext,
    onClear: clear,
    onPrevious: previous,
    onShortcuts: () => setShortcutsOpen(true),
  })

  async function finalSubmit() {
    const receipt = await submit('manual', remaining)
    if (receipt) navigate(`/student/exams/${examId}/confirmation`, { replace: true })
  }

  if (paper.isPending || (!attempt && !paper.isError)) {
    return <div className="mx-auto max-w-5xl p-6" role="status" aria-busy="true"><span className="sr-only">Loading exam hall</span><Skeleton.Block className="h-24" /><Skeleton.Block className="mt-4 h-96" /></div>
  }
  if (paper.isError || !paper.data || !attempt || !currentQuestion || !entry) {
    return <div className="mx-auto max-w-3xl p-6"><ErrorState code="E_HALL" title="Exam hall could not load" description={/** @type {any} */ (paper.error)?.message ?? 'Return to instructions and start the paper again.'} action={<Button variant="secondary" onClick={() => navigate(`/student/exams/${examId}/instructions`)}>Back to instructions</Button>} /></div>
  }

  const toolInitial = { x: Math.max(16, window.innerWidth - 400), y: 132 }
  return (
    <div data-exam-hall data-high-contrast={attempt.highContrast ? 'true' : 'false'} className={cn('exam-hall flex min-h-dvh flex-col bg-surface text-body', attempt.highContrast && 'exam-hall-contrast')}>
      <ExamHallHeader examTitle={attempt.examTitle} candidate={attempt.candidate} remaining={remaining} timerSource={source} tabSwitches={attempt.tabSwitches} onSubmit={() => setSubmitOpen(true)} />
      <div className="flex flex-col gap-2 px-4 pt-3">
        <p role="note" className="rounded-sm border border-review bg-[color-mix(in_oklab,var(--color-review)_18%,transparent)] px-3 py-2 text-xs text-review-fg md:hidden">Best on a larger screen. The hall is designed for 768px and above.</p>
        {!online ? <p role="status" data-testid="offline-banner" className="flex items-center gap-2 rounded-sm border border-review bg-[color-mix(in_oklab,var(--color-review)_18%,transparent)] px-3 py-2 text-xs text-review-fg"><WifiOff className="size-4" strokeWidth={1.5} aria-hidden="true" />Offline. Answers are saved on this device and will sync when the connection returns.</p> : null}
        {!fullscreen ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-line bg-surface-sunken px-3 py-2 text-xs text-muted">
            <span>Fullscreen is recommended for the hall.</span>
            <Button variant="secondary" size="sm" icon={<Expand strokeWidth={1.5} />} onClick={enterFullscreen}>Enter fullscreen</Button>
          </div>
        ) : null}
        <p className="text-2xs text-muted" data-testid="sync-state">{!online ? 'Sync queued' : attempt.syncState === 'syncing' ? 'Syncing answers…' : attempt.pendingSync > 0 ? 'Changes pending sync' : 'All changes synced'}</p>
      </div>
      <main className="mx-auto grid w-full max-w-[90rem] flex-1 grid-cols-1 gap-5 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-label="Question area" className="flex min-w-0 flex-col gap-4">
          <SectionTabs sections={attempt.sections} entries={attempt.entries} activeSectionId={activeSectionId} onSelect={(section) => {
            const index = attempt.questionIds.indexOf(section.questionIds[0])
            if (index >= 0) useExamStore.getState().visit(attempt.attemptId, index)
          }} />
          <div className="rounded-md border border-line bg-surface-raised p-4 sm:p-5">
            <AnimatePresence initial={false} mode="wait">
              <motion.div key={currentQuestion.id} initial={{ opacity: 0, x: attempt.direction * 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: attempt.direction * -28 }} transition={{ duration: 0.175 }}>
                <QuestionPanel question={currentQuestion} entry={entry} confidence={confidence} fontSize={attempt.fontSize} onAnswer={answer} onConfidence={(value) => useExamStore.getState().setConfidence(attempt.attemptId, currentQuestion.id, value)} />
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
        <div className="hidden lg:block">
          <QuestionPalette questionIds={attempt.questionIds} entries={attempt.entries} currentIndex={attempt.currentIndex} onJump={(index) => useExamStore.getState().visit(attempt.attemptId, index)} />
        </div>
      </main>
      <div className="sticky bottom-0 z-10 border-t border-line bg-surface-raised">
        <ToolsDock openTool={openTool} onToggleTool={(tool) => setOpenTool((current) => current === tool ? null : tool)} highContrast={attempt.highContrast} onContrast={() => useExamStore.getState().setHighContrast(attempt.attemptId, !attempt.highContrast)} onShortcuts={() => setShortcutsOpen(true)} />
        <footer className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
        <Button variant="secondary" size="sm" className="lg:hidden" icon={<LayoutGrid strokeWidth={1.5} />} onClick={() => setPaletteOpen(true)}>Palette {counts.answered + counts.review_answered}/{counts.total}</Button>
        <Button variant="ghost" size="sm" onClick={clear} disabled={entry.selected.length === 0}>Clear response</Button>
        <Button variant="secondary" size="sm" onClick={reviewNext}>Mark for review and next</Button>
        <Button variant="ghost" size="sm" onClick={previous} disabled={attempt.currentIndex === 0}>Previous</Button>
        <Button variant="primary" size="sm" className="ml-auto" onClick={saveNext}>Save and next</Button>
        </footer>
      </div>
      {openTool === 'calculator' ? <CalculatorPanel onClose={() => setOpenTool(null)} initial={toolInitial} /> : null}
      {openTool === 'rough' ? <RoughSheetPanel onClose={() => setOpenTool(null)} initial={{ x: 64, y: 150 }} /> : null}
      {openTool === 'font' ? <FontSizePanel fontSize={attempt.fontSize} onChange={(value) => useExamStore.getState().setFontSize(attempt.attemptId, value)} onClose={() => setOpenTool(null)} initial={{ x: 96, y: 170 }} /> : null}
      <Sheet open={paletteOpen} onClose={() => setPaletteOpen(false)} title="Question palette" description="Jump to any question. Answers and review flags are kept." side="right" size="sm">
        <QuestionPalette questionIds={attempt.questionIds} entries={attempt.entries} currentIndex={attempt.currentIndex} onJump={(index) => { useExamStore.getState().visit(attempt.attemptId, index); setPaletteOpen(false) }} />
      </Sheet>
      <SubmitSheet open={submitOpen} onClose={() => setSubmitOpen(false)} counts={submitCounts} onSubmit={finalSubmit} isPending={isPending} online={online} remainingSeconds={remaining} />
      <ShortcutSheet open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}
