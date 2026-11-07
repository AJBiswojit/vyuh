import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { clearAnswer, createAttemptState, markReview, setAnswer, visitQuestion } from '../lib/examState.js'

/** @typedef {import('../lib/examState.js').ExamAttemptState} ExamAttemptState */
/** @typedef {import('@/contracts/exam.js').ExamPaper} ExamPaper */
/** @typedef {import('@/contracts/exam.js').ExamStartReceipt} ExamStartReceipt */
/** @typedef {import('@/contracts/exam.js').ExamQuestion} ExamQuestion */
/** @typedef {import('@/contracts/exam.js').Confidence} Confidence */
/** @typedef {import('@/contracts/exam.js').IntegrityEvent} IntegrityEvent */
/** @typedef {import('@/contracts/exam.js').ExamSubmissionReceipt} ExamSubmissionReceipt */
/** @typedef {import('@/contracts/exam.js').ExamSubmissionInput} ExamSubmissionInput */

export const EXAM_STORAGE_KEY = 'vyuh.exam.flow.v1'

/** @param {ExamAttemptState} state @returns {ExamAttemptState} */
function touch(state) {
  return { ...state, revision: state.revision + 1, pendingSync: state.pendingSync + 1, syncState: 'pending' }
}

/** @typedef {Object} ExamStore
 * @property {Record<string, ExamAttemptState>} attempts
 * @property {string | null} activeAttemptId
 * @property {(start: ExamStartReceipt, paper: ExamPaper) => string} startAttempt
 * @property {(attemptId: string) => void} setActive
 * @property {(attemptId: string, index: number) => void} visit
 * @property {(attemptId: string, question: ExamQuestion, selected: string[]) => void} answer
 * @property {(attemptId: string, questionId: string, confidence: Confidence | null) => void} setConfidence
 * @property {(attemptId: string, questionId: string) => void} clear
 * @property {(attemptId: string, question: ExamQuestion) => void} review
 * @property {(attemptId: string, question: ExamQuestion) => void} saveAndNext
 * @property {(attemptId: string, question: ExamQuestion) => void} reviewAndNext
 * @property {(attemptId: string) => void} previous
 * @property {(attemptId: string, event: IntegrityEvent) => void} logIntegrity
 * @property {(attemptId: string, fontSize: number) => void} setFontSize
 * @property {(attemptId: string, highContrast: boolean) => void} setHighContrast
 * @property {(attemptId: string) => void} markSyncing
 * @property {(attemptId: string, revision: number, syncedAt: string) => void} markSynced
 * @property {(attemptId: string, receipt: ExamSubmissionReceipt, input: ExamSubmissionInput) => void} finalize
 * @property {(attemptId: string, receipt: ExamSubmissionReceipt) => void} updateReceipt
 * @property {() => void} resetForTests
 */

/** @type {import('zustand').UseBoundStore<import('zustand').StoreApi<ExamStore>>} */
export const useExamStore = create(
  persist(
    (set, get) => ({
      attempts: {},
      activeAttemptId: null,
      startAttempt(start, paper) {
        const existing = Object.values(get().attempts).find((attempt) => attempt.examId === start.examId && attempt.studentId === start.studentId && attempt.status !== 'submitted')
        if (existing) { set({ activeAttemptId: existing.attemptId }); return existing.attemptId }
        const state = visitQuestion(createAttemptState(start, paper), 0, start.serverNow)
        set((store) => ({ attempts: { ...store.attempts, [state.attemptId]: state }, activeAttemptId: state.attemptId }))
        return state.attemptId
      },
      setActive(attemptId) { set({ activeAttemptId: attemptId }) },
      visit(attemptId, index) {
        set((store) => {
          const attempt = store.attempts[attemptId]
          if (!attempt || attempt.status !== 'active') return store
          return { attempts: { ...store.attempts, [attemptId]: touch(visitQuestion(attempt, index, new Date().toISOString())) } }
        })
      },
      answer(attemptId, question, selected) {
        set((store) => {
          const attempt = store.attempts[attemptId]
          if (!attempt || attempt.status !== 'active') return store
          return { attempts: { ...store.attempts, [attemptId]: touch(setAnswer(attempt, question.id, selected, question)) } }
        })
      },
      setConfidence(attemptId, questionId, confidence) {
        set((store) => {
          const attempt = store.attempts[attemptId]
          if (!attempt || attempt.status !== 'active') return store
          return { attempts: { ...store.attempts, [attemptId]: touch({ ...attempt, confidences: { ...attempt.confidences, [questionId]: confidence } }) } }
        })
      },
      clear(attemptId, questionId) {
        set((store) => {
          const attempt = store.attempts[attemptId]
          if (!attempt || attempt.status !== 'active') return store
          return { attempts: { ...store.attempts, [attemptId]: touch(clearAnswer(attempt, questionId)) } }
        })
      },
      review(attemptId, question) {
        set((store) => {
          const attempt = store.attempts[attemptId]
          if (!attempt || attempt.status !== 'active') return store
          return { attempts: { ...store.attempts, [attemptId]: touch(markReview(attempt, question.id, question)) } }
        })
      },
      saveAndNext(attemptId, question) {
        get().answer(attemptId, question, get().attempts[attemptId]?.entries[question.id]?.selected ?? [])
        get().visit(attemptId, (get().attempts[attemptId]?.currentIndex ?? 0) + 1)
      },
      reviewAndNext(attemptId, question) {
        get().review(attemptId, question)
        get().visit(attemptId, (get().attempts[attemptId]?.currentIndex ?? 0) + 1)
      },
      previous(attemptId) { get().visit(attemptId, (get().attempts[attemptId]?.currentIndex ?? 0) - 1) },
      logIntegrity(attemptId, event) {
        set((store) => {
          const attempt = store.attempts[attemptId]
          if (!attempt) return store
          const next = { ...attempt, integrityEvents: [...attempt.integrityEvents, event], tabSwitches: attempt.tabSwitches + (event.type === 'tab_switch' ? 1 : 0) }
          return { attempts: { ...store.attempts, [attemptId]: touch(next) } }
        })
      },
      setFontSize(attemptId, fontSize) {
        set((store) => {
          const attempt = store.attempts[attemptId]
          if (!attempt) return store
          return { attempts: { ...store.attempts, [attemptId]: { ...attempt, fontSize: Math.max(16, Math.min(28, fontSize)) } } }
        })
      },
      setHighContrast(attemptId, highContrast) {
        set((store) => {
          const attempt = store.attempts[attemptId]
          if (!attempt) return store
          return { attempts: { ...store.attempts, [attemptId]: { ...attempt, highContrast } } }
        })
      },
      markSyncing(attemptId) {
        set((store) => {
          const attempt = store.attempts[attemptId]
          if (!attempt) return store
          return { attempts: { ...store.attempts, [attemptId]: { ...attempt, syncState: 'syncing' } } }
        })
      },
      markSynced(attemptId, revision, syncedAt) {
        set((store) => {
          const attempt = store.attempts[attemptId]
          if (!attempt) return store
          const current = attempt.revision === revision
          return { attempts: { ...store.attempts, [attemptId]: { ...attempt, syncState: current ? 'synced' : 'pending', pendingSync: current ? 0 : attempt.pendingSync, lastSyncedAt: syncedAt } } }
        })
      },
      finalize(attemptId, receipt, input) {
        set((store) => {
          const attempt = store.attempts[attemptId]
          if (!attempt || attempt.status === 'submitted') return store
          return { attempts: { ...store.attempts, [attemptId]: { ...attempt, status: 'submitted', receipt, submissionInput: input, remainingSeconds: input.remainingSeconds } } }
        })
      },
      updateReceipt(attemptId, receipt) {
        set((store) => {
          const attempt = store.attempts[attemptId]
          if (!attempt) return store
          return { attempts: { ...store.attempts, [attemptId]: { ...attempt, receipt, submissionInput: receipt.pendingSync ? attempt.submissionInput : null, syncState: 'synced', pendingSync: 0 } } }
        })
      },
      resetForTests() { set({ attempts: {}, activeAttemptId: null }) },
    }),
    {
      name: EXAM_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ attempts: state.attempts, activeAttemptId: state.activeAttemptId }),
    },
  ),
)
