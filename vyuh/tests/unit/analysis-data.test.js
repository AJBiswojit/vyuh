import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  analysisFixture, analysisOutcomes, attemptTrend, buildAnalysisFromSubmission, buildTopicRevision,
  cohortDistribution, perQuestionAnalysis, percentileForScore,
} from '../../src/mock-data/analysis.js'
import { attempts } from '../../src/mock-data/attempts.js'
import { questions } from '../../src/mock-data/questions.js'
import { calculateWhatIf, countFilters, filterQuestions } from '../../src/shared/lib/analysisMath.js'
import { analysisService } from '../../src/services/mock/analysis.js'
import { examAnalysisSchema } from '../../src/services/api/schemas.js'
import { signInDemoStudent } from '../helpers/workspaceIdentity.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

/* BATCH 3.2: `stu-ananya` requires a real, valid, matching demo session. */
beforeEach(async () => { localStorage.clear(); await signInDemoStudent() })

describe('analysis fixture arithmetic', () => {
  it('derives summary, filters and what-if from the same rows', () => {
    const rows = perQuestionAnalysis
    expect(rows).toHaveLength(60)
    const counts = countFilters(rows)
    expect(counts.all).toBe(counts.correct + counts.wrong + counts.skipped)
    expect(counts.wrong).toBe(analysisOutcomes.wrong.length)
    expect(counts.skipped).toBe(analysisOutcomes.skipped.length)
    expect(counts.confident).toBe(analysisOutcomes.confidentWrong.length)
    expect(counts.lucky).toBe(analysisOutcomes.luckyCorrect.length)
    for (const filter of /** @type {const} */ (['all', 'correct', 'wrong', 'skipped', 'confident', 'lucky'])) {
      expect(filterQuestions(rows, filter)).toHaveLength(counts[filter])
    }
    expect(analysisFixture.summary.score).toBe(rows.reduce((sum, row) => sum + row.marksDelta, 0))
    expect(analysisFixture.whatIf).toEqual(calculateWhatIf(rows))
    expect(analysisFixture.whatIf.scoreWithoutNegative).toBe(rows.filter((row) => row.marksDelta > 0).reduce((sum, row) => sum + row.marksDelta, 0))
    expect(analysisFixture.pacing).toHaveLength(rows.length)
    expect(analysisFixture.heatmap.every((cell) => cell.accuracy >= 0 && cell.accuracy <= 100)).toBe(true)
  })
  it('keeps cohort distributions complete and trends sourced from attempts.js', () => {
    for (const row of perQuestionAnalysis) {
      expect(row.responseDistribution.reduce((sum, item) => sum + item.count, 0)).toBe(cohortDistribution.batchSize)
      expect(row.difficultyIndex).toBeGreaterThanOrEqual(0)
      expect(row.difficultyIndex).toBeLessThanOrEqual(100)
      expect(row.explanation.length).toBeGreaterThan(0)
    }
    expect(attemptTrend).toHaveLength(attempts.length)
    expect(attemptTrend.map((point) => point.score)).toEqual(attempts.slice().reverse().map((attempt) => attempt.score))
    expect(buildTopicRevision('ch-cell').questions.length).toBeGreaterThan(0)
  })
  it('validates the published sheet against the API schema', () => {
    const payload = { examId: 'exam-neet-practice', examTitle: 'NEET Practice 01', attemptId: 'att-example', studentId: 'stu-ananya', candidateName: 'Ananya Sahoo', rollNumber: 'VY-25-0187', submittedAt: '2026-10-18T12:00:00.000Z', source: 'fixture', release: { released: true, releaseAt: null, serverNow: '2026-10-18T12:00:00.000Z', offsetMs: 0, rule: 'Published.' }, details: analysisFixture }
    expect(examAnalysisSchema.safeParse(payload).success).toBe(true)
  })
})

describe('stored submission evaluator', () => {
  it('grades correct, wrong and skipped responses and recalculates what-if', () => {
    const [first, second, third] = questions
    const input = {
      attemptId: 'att-test', examId: 'exam-neet-practice', studentId: 'stu-ananya', submittedAt: '2026-11-07T04:00:00.000Z', reason: 'manual', remainingSeconds: 100,
      entries: [
        { questionId: first.id, state: 'answered', selected: first.correctOptions, timeSpentSeconds: 20 },
        { questionId: second.id, state: 'answered', selected: ['A'], timeSpentSeconds: 50 },
        { questionId: third.id, state: 'not_answered', selected: [], timeSpentSeconds: 5 },
      ],
      confidences: { [first.id]: 'guessing', [second.id]: 'sure', [third.id]: null }, integrityEvents: [],
      visits: [{ questionId: first.id, enteredAt: '2026-11-07T03:58:00.000Z', leftAt: '2026-11-07T03:58:20.000Z', durationSeconds: 20 }],
    }
    const details = buildAnalysisFromSubmission(input)
    expect(details.summary.score).toBe(3)
    expect(details.summary.correct).toBe(1)
    expect(details.summary.wrong).toBe(1)
    expect(details.summary.skipped).toBe(1)
    expect(details.whatIf.scoreWithoutNegative).toBe(4)
    expect(details.whatIf.difference).toBe(1)
    expect(details.summary.cost.confidentMistakes).toBe(1)
    expect(details.questions[0].luckyGuess).toBe(true)
    expect(details.questions[1].mistakeCategory).toBe('conceptual')
    expect(details.path).toHaveLength(1)
    expect(details.summary.percentile).toBe(percentileForScore(3, 12))
  })
})

describe('release policy service', () => {
  it('locks details until release and exposes the rule', async () => {
    localStorage.setItem('vyuh.mock.analysisLocked', 'true')
    localStorage.setItem('vyuh.mock.analysisReleaseInSeconds', '60')
    const locked = await analysisService.getAnalysis('exam-neet-practice', 'stu-ananya')
    expect(locked.release.released).toBe(false)
    expect(locked.details).toBeNull()
    expect(locked.release.rule.length).toBeGreaterThan(0)
    expect(Date.parse(locked.release.releaseAt ?? '')).toBeGreaterThan(Date.now())
    localStorage.setItem('vyuh.mock.analysisLocked', 'false')
    const released = await analysisService.getAnalysis('exam-neet-practice', 'stu-ananya')
    expect(released.release.released).toBe(true)
    expect(released.details?.questions).toHaveLength(60)
  })
})
