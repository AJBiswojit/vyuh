import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/shared/lib/services.js'
import { queryKeys } from '@/app/providers/queryClient.js'
import { useExamStore } from '../store/examStore.js'
import { countStatuses, remainingSeconds as computeRemaining, submissionCounts } from '../lib/examState.js'

/** @typedef {import('@/contracts/exam.js').ExamPaper} ExamPaper */
/** @typedef {import('@/contracts/exam.js').ExamStartReceipt} ExamStartReceipt */
/** @typedef {import('@/contracts/exam.js').SubmitReason} SubmitReason */
/** @typedef {import('../lib/examState.js').ExamAttemptState} ExamAttemptState */

/** @param {string | undefined} examId @param {string | undefined} studentId */
export function useExamPaper(examId, studentId) {
  return useQuery({
    queryKey: queryKeys.examPaper(examId ?? 'unknown', studentId ?? 'unknown'),
    queryFn: () => services.examFlow.getPaper(/** @type {string} */ (examId), /** @type {string} */ (studentId)),
    enabled: Boolean(examId && studentId),
    staleTime: 60_000,
  })
}

export function useStartExam() {
  return useMutation({
    mutationFn: (/** @type {import('@/contracts/exam.js').ExamStartInput} */ input) => services.examFlow.startAttempt(input),
  })
}

/** @param {string | null | undefined} attemptId */
export function useExamAttempt(attemptId) {
  return useExamStore((state) => (attemptId ? state.attempts[attemptId] : undefined))
}

/** @param {string | undefined} examId @param {string | undefined} studentId */
export function useActiveExamAttempt(examId, studentId) {
  return useExamStore((state) => Object.values(state.attempts).find((attempt) => attempt.examId === examId && attempt.studentId === studentId && attempt.status !== 'submitted'))
}

/** Server-corrected timer. The worker owns the interval; the component only
 * receives whole-second payloads. A non-worker fallback exists for jsdom.
 * @param {ExamAttemptState | undefined} attempt
 * @param {(remaining: number) => void} onExpire
 */
export function useExamTimer(attempt, onExpire) {
  const [remaining, setRemaining] = useState(() => attempt ? computeRemaining(new Date(attempt.deadlineAt).getTime(), Date.now(), attempt.offsetMs) : 0)
  const source = /** @type {'worker'|'fallback'} */ (typeof Worker === 'undefined' ? 'fallback' : 'worker')
  const fired = useRef(false)
  const onExpireRef = useRef(onExpire)
  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])

  const attemptId = attempt?.attemptId
  const deadline = attempt?.deadlineAt
  const offset = attempt?.offsetMs
  const status = attempt?.status
  useEffect(() => {
    fired.current = false
    if (!attemptId || !deadline || status !== 'active') return
    const deadlineAt = new Date(deadline).getTime()
    const offsetMs = offset ?? 0
    /** @param {number} value */
    const apply = (value) => {
      setRemaining(value)
      if (value === 0 && !fired.current) { fired.current = true; onExpireRef.current(0) }
    }
    apply(computeRemaining(deadlineAt, Date.now(), offsetMs))
    if (typeof Worker === 'undefined') {
      const timer = setInterval(() => apply(computeRemaining(deadlineAt, Date.now(), offsetMs)), 250)
      return () => clearInterval(timer)
    }
    const worker = new Worker(new URL('../workers/examTimer.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = (/** @type {MessageEvent<{ type: string, remainingSeconds: number }>} */ event) => {
      if (event.data?.type === 'tick') apply(event.data.remainingSeconds)
    }
    worker.postMessage({ type: 'start', deadlineAt, offsetMs })
    return () => { worker.postMessage({ type: 'stop' }); worker.terminate() }
  }, [attemptId, deadline, offset, status])

  return { remaining, source }
}

/** Queues local changes while offline and syncs the latest revision on return.
 * @param {ExamAttemptState | undefined} attempt
 */
export function useExamSync(attempt) {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine)
  const markSyncing = useExamStore((state) => state.markSyncing)
  const markSynced = useExamStore((state) => state.markSynced)
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])
  const attemptId = attempt?.attemptId
  const revision = attempt?.revision ?? 0
  const pending = attempt?.pendingSync ?? 0
  const status = attempt?.status
  useEffect(() => {
    if (!attemptId || !online || pending === 0 || status === 'submitted') return
    let cancelled = false
    const timer = setTimeout(async () => {
      const current = useExamStore.getState().attempts[attemptId]
      if (!current || current.pendingSync === 0) return
      markSyncing(attemptId)
      try {
        const receipt = await services.examFlow.syncAttempt({
          attemptId, revision: current.revision, entries: current.questionIds.map((id) => current.entries[id]).filter(Boolean),
          confidences: current.confidences, integrityEvents: current.integrityEvents,
        })
        if (!cancelled) markSynced(attemptId, receipt.revision, receipt.syncedAt)
      } catch {
        if (!cancelled) useExamStore.setState((store) => {
          const item = store.attempts[attemptId]
          return item ? { attempts: { ...store.attempts, [attemptId]: { ...item, syncState: 'pending' } } } : store
        })
      }
    }, 350)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [attemptId, revision, pending, online, status, markSyncing, markSynced])
  return { online }
}

/** Finalises locally first, then confirms with the service. Offline finals stay
 * pending and are flushed by useExamSubmissionSync on the confirmation page.
 * @param {string | undefined} attemptId
 */
export function useSubmitExam(attemptId) {
  const client = useQueryClient()
  const [isPending, setIsPending] = useState(false)
  const submit = useCallback(async (/** @type {SubmitReason} */ reason, /** @type {number} */ remaining) => {
    if (!attemptId) return null
    const store = useExamStore.getState()
    const attempt = store.attempts[attemptId]
    if (!attempt) return null
    if (attempt.status === 'submitted' && attempt.receipt) return attempt.receipt
    const entries = attempt.questionIds.map((id) => attempt.entries[id]).filter(Boolean)
    const counts = submissionCounts(countStatuses(attempt.entries, attempt.questionIds))
    const submittedAt = new Date().toISOString()
    /** @type {import('@/contracts/exam.js').ExamSubmissionInput} */
    const input = { attemptId, examId: attempt.examId, studentId: attempt.studentId, submittedAt, reason, remainingSeconds: Math.max(0, remaining), entries, confidences: attempt.confidences, integrityEvents: attempt.integrityEvents, visits: attempt.visits ?? [] }
    /** @type {import('@/contracts/exam.js').ExamSubmissionReceipt} */
    const localReceipt = { attemptId, examId: attempt.examId, examTitle: attempt.examTitle, studentId: attempt.studentId, submittedAt, reason, counts, pendingSync: true }
    store.finalize(attemptId, localReceipt, input)
    setIsPending(true)
    try {
      if (navigator.onLine) {
        const receipt = await services.examFlow.submitAttempt(input)
        useExamStore.getState().updateReceipt(attemptId, receipt)
        client.invalidateQueries({ queryKey: ['exams', input.examId, 'analysis', input.studentId] })
        return receipt
      }
    } catch { /* local receipt remains pending; confirmation will retry */ }
    finally { setIsPending(false) }
    return localReceipt
  }, [attemptId, client])
  return { submit, isPending }
}

/** @param {ExamAttemptState | undefined} attempt */
export function useExamSubmissionSync(attempt) {
  const client = useQueryClient()
  const updateReceipt = useExamStore((state) => state.updateReceipt)
  const attemptId = attempt?.attemptId
  const pending = attempt?.receipt?.pendingSync
  const input = attempt?.submissionInput
  useEffect(() => {
    if (!attemptId || !pending || !input) return
    let cancelled = false
    /** @param {boolean} [force] */
    const flush = async (force) => {
      if (!navigator.onLine && !force) return
      try {
        const receipt = await services.examFlow.submitAttempt(input)
        if (!cancelled) {
          updateReceipt(attemptId, receipt)
          client.invalidateQueries({ queryKey: ['exams', input.examId, 'analysis', input.studentId] })
        }
      } catch { /* retry on next online event */ }
    }
    const up = () => { void flush() }
    window.addEventListener('online', up)
    void flush()
    return () => { cancelled = true; window.removeEventListener('online', up) }
  }, [attemptId, pending, input, updateReceipt, client])
}

/** @param {{ enabled: boolean, onSelect: (index: number) => void, onSave: () => void, onReview: () => void, onClear: () => void, onPrevious: () => void, onShortcuts: () => void }} handlers */
export function useExamShortcuts(handlers) {
  const ref = useRef(handlers)
  useEffect(() => { ref.current = handlers }, [handlers])
  useEffect(() => {
    /** @param {KeyboardEvent} event */
    const onKey = (event) => {
      const current = ref.current
      if (!current.enabled || event.metaKey || event.ctrlKey || event.altKey) return
      const target = /** @type {EventTarget | null} */ (event.target)
      if (isTypingTarget(target)) return
      const key = event.key
      if (key >= '1' && key <= '4') { event.preventDefault(); current.onSelect(Number(key) - 1); return }
      const lower = key.toLowerCase()
      if (lower === 'n') { event.preventDefault(); current.onSave() }
      else if (lower === 'm') { event.preventDefault(); current.onReview() }
      else if (lower === 'c') { event.preventDefault(); current.onClear() }
      else if (lower === 'p') { event.preventDefault(); current.onPrevious() }
      else if (key === '?') { event.preventDefault(); current.onShortcuts() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/** @param {EventTarget | null} target */
export function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  const editable = target.getAttribute('contenteditable')
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable || editable === '' || editable === 'true'
}
