import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  EXAM_QUESTION_SETS, EXAM_UNAVAILABLE_REASON, examDefinitions, examDefinitionById,
  isPlayableExam, listPlayableExams, listUnplayableExams, authoredQuestionsFor,
  gradingQuestionsFor, examSectionsFor, seededAttemptFor, withExamDefinition,
} from '../../src/mock-data/examDefinitions.js'
import { exams } from '../../src/mock-data/exams.js'
import { questions } from '../../src/mock-data/questions.js'
import { attempts } from '../../src/mock-data/attempts.js'
import { buildAnalysisFromSubmission } from '../../src/mock-data/analysis.js'
import { examFlowService } from '../../src/services/mock/examFlow.js'
import { analysisService } from '../../src/services/mock/analysis.js'
import { assessmentService } from '../../src/services/mock/students.js'
import { examAnalysisSchema } from '../../src/services/api/schemas.js'
import { signInDemoStudent } from '../helpers/workspaceIdentity.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

/* BATCH 3.2: `stu-ananya` is only a valid identity WITH its matching demo session. */
beforeEach(async () => { localStorage.clear(); await signInDemoStudent() })

describe('shared examDefinitions registry', () => {
  it('covers every seeded exam exactly once and marks exactly one as playable', () => {
    expect(examDefinitions).toHaveLength(exams.length)
    expect(new Set(examDefinitions.map((definition) => definition.id)).size).toBe(exams.length)
    expect(examDefinitions.map((definition) => definition.id)).toEqual(exams.map((exam) => exam.id))
    expect(listPlayableExams().map((definition) => definition.id)).toEqual(['exam-neet-practice'])
    expect(Object.keys(EXAM_QUESTION_SETS)).toEqual(['neet-practice-01'])
    expect(isPlayableExam('exam-neet-practice')).toBe(true)
    expect(isPlayableExam('exam-mock-09')).toBe(false)
    expect(isPlayableExam('not-an-exam')).toBe(false)
    expect(examDefinitionById('not-an-exam')).toBeNull()
  })

  it('explicitly distinguishes ledger-only papers from playable papers', () => {
    for (const definition of listUnplayableExams()) {
      expect(definition.playable).toBe(false)
      expect(definition.questionSetId).toBeNull()
      expect(definition.unavailableReason).toBe(EXAM_UNAVAILABLE_REASON)
      expect(definition.resultMode === 'score_summary' || definition.resultMode === 'unpublished').toBe(true)
    }
    expect(examDefinitionById('exam-neet-practice')).toMatchObject({ playable: true, questionSetId: 'neet-practice-01', resultMode: 'question_level', unavailableReason: null })
  })

  it('never fabricates questions, keys, sections or grading banks for ledger-only papers', () => {
    expect(authoredQuestionsFor('exam-mock-09')).toEqual([])
    expect(gradingQuestionsFor('exam-mock-09')).toEqual([])
    expect(examSectionsFor('exam-mock-09', questions)).toEqual([])
    expect(authoredQuestionsFor('exam-neet-practice', 6)).toHaveLength(6)
    expect(gradingQuestionsFor('exam-neet-practice')).toHaveLength(60)
    expect(examSectionsFor('exam-neet-practice', questions).map((section) => section.questionIds.length)).toEqual([20, 20, 20])
  })

  it('uses real seeded score summaries and never duplicates exam titles', () => {
    const seeded = seededAttemptFor('exam-mock-08')
    expect(seeded?.score).toBe(512)
    expect(seeded).toBe(attempts.find((attempt) => attempt.examId === 'exam-mock-08'))
    expect(seededAttemptFor('exam-mock-09')).toBeNull()
    for (const definition of examDefinitions) expect(definition.title).toBe(exams.find((exam) => exam.id === definition.id)?.title)
  })

  it('decorates the student exam read model without mutating the fixture', () => {
    const source = exams.find((exam) => exam.id === 'exam-mock-09')
    const decorated = withExamDefinition(source)
    expect(decorated.playable).toBe(false)
    expect(decorated.resultMode).toBe('unpublished')
    expect(source.playable).toBeUndefined()
  })
})

describe('exam entry is registry-driven, not hard-coded to NEET', () => {
  it('serves an answer-key-free paper for the playable exam', async () => {
    const paper = await examFlowService.getPaper('exam-neet-practice', 'stu-ananya')
    expect(paper.questions.length).toBeGreaterThan(0)
    expect(paper.sections.every((section) => section.questionIds.length > 0)).toBe(true)
    for (const question of paper.questions) {
      expect(question.correctOptions).toBeUndefined()
      expect(question.correctNumeric).toBeUndefined()
      expect(question.explanation).toBeUndefined()
    }
  })

  it('explains a ledger-only paper instead of a NEET-specific message', async () => {
    await expect(examFlowService.getPaper('exam-mock-09', 'stu-ananya')).rejects.toMatchObject({ code: 'paper_not_playable' })
    try {
      await examFlowService.getPaper('exam-mock-09', 'stu-ananya')
    } catch (error) {
      expect(error.message).toBe(EXAM_UNAVAILABLE_REASON)
      expect(error.message).not.toContain('NEET Practice 01')
    }
  })

  it('still rejects an exam that is not in the registry at all', async () => {
    await expect(examFlowService.getPaper('exam-unknown', 'stu-ananya')).rejects.toMatchObject({ code: 'not_found' })
  })

  it('removed both single-paper hard gates from the service source', () => {
    const files = ['src/services/mock/examFlow.js', 'src/services/mock/analysis.js']
    for (const file of files) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8')
      expect(source.includes('paper_unavailable')).toBe(false)
      expect(source.includes('analysis_unavailable')).toBe(false)
    }
  })

  it('submission counts come from the same authored set the hall received', async () => {
    const paper = await examFlowService.getPaper('exam-neet-practice', 'stu-ananya')
    const entries = paper.questions.slice(0, 2).map((question) => ({ questionId: question.id, state: /** @type {const} */ ('answered'), selected: ['A'], timeSpentSeconds: 10 }))
    const receipt = await examFlowService.submitAttempt({
      attemptId: 'att-registry-1', examId: 'exam-neet-practice', studentId: 'stu-ananya',
      submittedAt: new Date().toISOString(), reason: 'manual', remainingSeconds: 100,
      entries, confidences: {}, integrityEvents: [], visits: [],
    })
    expect(receipt.counts.total).toBe(paper.questions.length)
    expect(receipt.counts.answered).toBe(2)
  })
})

describe('result analysis is registry-driven and never fabricates analytics', () => {
  it('still produces the 60-question published sheet for the playable exam', async () => {
    const result = await analysisService.getAnalysis('exam-neet-practice', 'stu-ananya')
    expect(result.source).toBe('fixture')
    expect(result.details?.questions).toHaveLength(60)
    expect(result.notice).toBeNull()
    expect(result.scoreSummary).toBeNull()
    expect(examAnalysisSchema.safeParse(result).success).toBe(true)
  })

  it('no longer throws analysis_unavailable for a paper without an authored set', async () => {
    const result = await analysisService.getAnalysis('exam-mock-09', 'stu-ananya')
    expect(result.source).toBe('unpublished')
    expect(result.details).toBeNull()
    expect(result.notice).toContain('no authored question set')
    expect(result.scoreSummary).toBeNull()
    expect(examAnalysisSchema.safeParse(result).success).toBe(true)
  })

  it('shows the REAL seeded score summary for a closed paper, not borrowed analytics', async () => {
    const result = await analysisService.getAnalysis('exam-mock-08', 'stu-ananya')
    const seeded = attempts.find((attempt) => attempt.examId === 'exam-mock-08')
    expect(result.source).toBe('unpublished')
    expect(result.details).toBeNull()
    expect(result.scoreSummary).toMatchObject({ score: seeded.score, maxMarks: seeded.maxMarks, percentile: seeded.percentile, accuracy: seeded.accuracy })
    expect(result.scoreSummary.subjects).toHaveLength(seeded.subjects.length)
    expect(result.notice).toContain('published score summary')
    expect(examAnalysisSchema.safeParse(result).success).toBe(true)
  })

  it('grades a stored submission against an explicitly supplied authored bank', () => {
    const bank = gradingQuestionsFor('exam-neet-practice')
    const [first, second] = bank
    const input = {
      attemptId: 'att-registry-2', examId: 'exam-neet-practice', studentId: 'stu-ananya',
      submittedAt: '2026-11-07T04:00:00.000Z', reason: 'manual', remainingSeconds: 100,
      entries: [
        { questionId: first.id, state: 'answered', selected: first.correctOptions, timeSpentSeconds: 20 },
        { questionId: second.id, state: 'answered', selected: ['A'], timeSpentSeconds: 50 },
      ],
      confidences: {}, integrityEvents: [], visits: [],
    }
    expect(buildAnalysisFromSubmission(input, bank)).toEqual(buildAnalysisFromSubmission(input))
    expect(buildAnalysisFromSubmission(input, []).questions).toHaveLength(0)
  })

  it('rejects an exam absent from the registry', async () => {
    await expect(analysisService.getAnalysis('exam-unknown', 'stu-ananya')).rejects.toMatchObject({ code: 'not_found' })
  })
})

describe('student exam ledger read model', () => {
  it('exposes playability and result mode on every row', async () => {
    const rows = await assessmentService.listExams('stu-ananya')
    expect(rows).toHaveLength(exams.length)
    expect(rows.filter((row) => row.playable)).toHaveLength(1)
    expect(rows.find((row) => row.id === 'exam-neet-practice')).toMatchObject({ playable: true, resultMode: 'question_level' })
    expect(rows.find((row) => row.id === 'exam-mock-08')).toMatchObject({ playable: false, resultMode: 'score_summary' })
    expect(rows.find((row) => row.id === 'exam-mock-09')).toMatchObject({ playable: false, resultMode: 'unpublished' })
    expect(rows.every((row) => typeof row.unavailableReason === 'string' || row.unavailableReason === null)).toBe(true)
  })
})
