import { beforeEach, describe, expect, it } from 'vitest'
import { buildQuestionBank, authoredSections, configuredQuestionCount, questions } from '../../src/mock-data/questions.js'
import { calculateExpression, formatCalculatorResult } from '../../src/features/exam/lib/calculator.js'
import { countStatuses, createAttemptState, hasResponse, isTypingTarget, isValidNumericAnswer, remainingSeconds, submissionCounts } from '../../src/features/exam/lib/examState.js'
import { createTimerTick } from '../../src/features/exam/workers/examTimer.worker.js'
import { useExamStore } from '../../src/features/exam/store/examStore.js'

/** @param {number} count */
function paper(count = 6) {
  const authored = buildQuestionBank(count)
  const publicQuestions = authored.map(({ correctOptions: _correctOptions, correctNumeric: _correctNumeric, explanation: _explanation, ...question }) => question)
  return {
    exam: { id: 'exam-neet-practice', title: 'NEET Practice', durationMinutes: 180, questionCount: count, maxMarks: count * 4, negativeMarks: 1, instructions: [], kind: 'mock', status: 'live', track: 'NEET', scheduledFor: null, endsAt: null, subjectIds: [], activeAttemptId: null, sectionCount: 3, totalMarksApplied: 0 },
    sections: authoredSections.map((section) => ({ ...section, questionIds: publicQuestions.filter((q) => q.sectionId === section.id).map((q) => q.id) })),
    questions: publicQuestions,
    candidate: { name: 'Ananya Sahoo', rollNumber: 'VY-25-0187' },
    serverNow: '2026-11-07T04:00:00.000Z', offsetMs: 0, durationSeconds: 10_800,
    rules: [], markingScheme: { correct: 4, incorrect: -1, unattempted: 0 }, declaration: 'I accept.',
  }
}
function start() {
  return { attemptId: 'att-test', examId: 'exam-neet-practice', studentId: 'stu-ananya', startedAt: '2026-11-07T04:00:00.000Z', deadlineAt: '2026-11-07T07:00:00.000Z', serverNow: '2026-11-07T04:00:00.000Z', offsetMs: 0, durationSeconds: 10_800, resumed: false }
}

beforeEach(() => {
  localStorage.clear()
  useExamStore.getState().resetForTests()
})

describe('exam status invariant', () => {
  it('keeps five statuses summing to the paper total through answer/review/clear', () => {
    const p = paper(9)
    let state = createAttemptState(start(), p)
    const ids = state.questionIds
    const sum = () => {
      const counts = countStatuses(state.entries, ids)
      expect(counts.answered + counts.not_answered + counts.review + counts.review_answered + counts.not_visited).toBe(counts.total)
      return counts
    }
    expect(sum().not_visited).toBe(9)
    useExamStore.getState().startAttempt(start(), p)
    state = useExamStore.getState().attempts['att-test']
    expect(sum().not_visited).toBe(8)
    expect(sum().not_answered).toBe(1)
    const store = useExamStore.getState()
    store.answer('att-test', p.questions[0], ['A'])
    store.review('att-test', p.questions[1])
    store.answer('att-test', p.questions[1], ['B'])
    store.visit('att-test', 2)
    store.clear('att-test', p.questions[0].id)
    state = useExamStore.getState().attempts['att-test']
    const counts = sum()
    expect(counts.review_answered).toBe(1)
    expect(counts.not_answered).toBe(2)
    expect(counts.not_visited).toBe(6)
    expect(submissionCounts(counts).answered).toBe(1)
  })
})

describe('timer math', () => {
  it('recomputes from the absolute deadline with server offset', () => {
    expect(remainingSeconds(10_000, 1_000, 500)).toBe(9)
    expect(remainingSeconds(10_000, 12_000, 0)).toBe(0)
    const now = Date.now()
    const tick = createTimerTick({ deadlineAt: now + 20_000, offsetMs: 250 })()
    expect(tick.type).toBe('tick')
    expect(tick.remainingSeconds).toBeGreaterThanOrEqual(19)
    expect(tick.remainingSeconds).toBeLessThanOrEqual(20)
    expect(tick.serverNow).toBeGreaterThanOrEqual(now + 250)
  })
})

describe('numeric answers and calculator', () => {
  it('validates decimal and signed numeric responses', () => {
    expect(isValidNumericAnswer('-2.5')).toBe(true)
    expect(isValidNumericAnswer('.5')).toBe(true)
    expect(isValidNumericAnswer('1e3')).toBe(false)
    expect(isValidNumericAnswer('')).toBe(false)
    const q = buildQuestionBank(60).find((item) => item.type === 'numeric')
    expect(hasResponse(q, { questionId: q.id, state: 'answered', selected: ['10'], timeSpentSeconds: 0 })).toBe(true)
  })
  it('evaluates safe arithmetic and scientific expressions without eval', () => {
    expect(calculateExpression('2+3*4')).toBe(14)
    expect(calculateExpression('(2+3)*4')).toBe(20)
    expect(calculateExpression('sin(90)', 'deg')).toBe(1)
    expect(calculateExpression('sqrt(16)+2^3')).toBe(12)
    expect(calculateExpression('5!')).toBe(120)
    expect(calculateExpression('50%')).toBe(0.5)
    expect(() => calculateExpression('1/0')).toThrow(/zero/)
    expect(() => calculateExpression('alert(1)')).toThrow()
    expect(formatCalculatorResult(0.1 + 0.2)).toBe('0.3')
  })
})

describe('question bank fixture', () => {
  it('ships 60 authored questions in three contiguous sections with keys and LaTeX', () => {
    expect(questions).toHaveLength(60)
    expect(authoredSections).toHaveLength(3)
    expect(questions.filter((q) => q.sectionId === 'sec-phy')).toHaveLength(20)
    expect(questions.filter((q) => q.sectionId === 'sec-che')).toHaveLength(20)
    expect(questions.filter((q) => q.sectionId === 'sec-bio')).toHaveLength(20)
    expect(questions.filter((q) => q.body.includes('$') || q.options.some((o) => o.body.includes('$'))).length).toBeGreaterThanOrEqual(10)
    expect(questions.some((q) => q.type === 'numeric')).toBe(true)
    expect(questions.every((q) => q.explanation && (q.correctOptions.length > 0 || q.correctNumeric !== null))).toBe(true)
    expect(questions.map((q) => q.number)).toEqual(Array.from({ length: 60 }, (_, i) => i + 1))
  })
  it('clamps configurable count and keeps sections balanced', () => {
    localStorage.setItem('vyuh.mock.examQuestionCount', '10')
    expect(configuredQuestionCount()).toBe(10)
    const bank = buildQuestionBank()
    expect(bank).toHaveLength(10)
    expect(bank.filter((q) => q.sectionId === 'sec-phy')).toHaveLength(4)
    expect(bank.filter((q) => q.sectionId === 'sec-che')).toHaveLength(3)
    expect(bank.filter((q) => q.sectionId === 'sec-bio')).toHaveLength(3)
    expect(buildQuestionBank(999)).toHaveLength(60)
    expect(buildQuestionBank(1)).toHaveLength(3)
  })
})

describe('shortcut typing guard', () => {
  it('ignores inputs, textareas, selects and contenteditable targets', () => {
    const input = document.createElement('input')
    const textarea = document.createElement('textarea')
    const select = document.createElement('select')
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')
    const button = document.createElement('button')
    expect(isTypingTarget(input)).toBe(true)
    expect(isTypingTarget(textarea)).toBe(true)
    expect(isTypingTarget(select)).toBe(true)
    expect(isTypingTarget(editable)).toBe(true)
    expect(isTypingTarget(button)).toBe(false)
    expect(isTypingTarget(null)).toBe(false)
  })
})
