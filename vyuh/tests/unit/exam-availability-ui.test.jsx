import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute, screen } from './helpers.jsx'
import { authService } from '@/services/mock/auth.js'
import { canEnterExamHall, canShowResultSheet, examHallNotice } from '../../src/shared/lib/examAvailability.js'
import { exams } from '../../src/mock-data/exams.js'
import { examDefinitionById } from '../../src/mock-data/examDefinitions.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

/** @type {any} */
let session
beforeAll(async () => {
  session = await authService.login({ email: 'ananya.sahoo@vidyutacademy.in', password: 'vyuh2026' })
})
beforeEach(() => localStorage.clear())

const registered = (id) => ({ ...exams.find((exam) => exam.id === id), ...examDefinitionById(id) })

describe('examAvailability predicates', () => {
  it('allows the hall only for a playable, open paper', () => {
    expect(canEnterExamHall(registered('exam-neet-practice'))).toBe(true)
    expect(canEnterExamHall(registered('exam-mock-09'))).toBe(false)
    expect(canEnterExamHall({ ...registered('exam-neet-practice'), status: 'closed' })).toBe(false)
    expect(canEnterExamHall(null)).toBe(false)
  })

  it('offers a result sheet for playable or real score-summary papers only', () => {
    expect(canShowResultSheet(registered('exam-neet-practice'))).toBe(true)
    expect(canShowResultSheet(registered('exam-mock-08'))).toBe(true)
    expect(canShowResultSheet(registered('exam-mock-09'))).toBe(false)
    expect(canShowResultSheet(undefined)).toBe(false)
  })

  it('explains unplayable papers without mentioning the NEET paper', () => {
    expect(examHallNotice(registered('exam-mock-09'))).toContain('no authored question set')
    expect(examHallNotice(registered('exam-neet-practice'))).toBeNull()
    expect(examHallNotice(null)).toBeNull()
    expect(examHallNotice({ ...registered('exam-mock-09'), unavailableReason: undefined })).toContain('not published')
  })
})

describe('student exam pages use the registry, not track === NEET', () => {
  it('/student/exams?exam=exam-mock-09 explains the missing hall and hides the result link', async () => {
    await renderRoute('/student/exams?exam=exam-mock-09', { session })
    expect(await screen.findByText(/no authored question set/i)).toBeTruthy()
    expect(screen.getAllByText('Exam hall not published in this prototype').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Result sheet' })).toBeNull()
  })

  it('/student/exams?exam=exam-neet-practice still offers the result sheet', async () => {
    await renderRoute('/student/exams?exam=exam-neet-practice', { session })
    expect((await screen.findAllByRole('button', { name: 'Result sheet' })).length).toBeGreaterThan(0)
    expect(screen.queryByText(/no authored question set/i)).toBeNull()
  })

  it('exam detail disables the hall for a ledger-only paper', async () => {
    await renderRoute('/student/exams/exam-mock-09', { session })
    const enter = await screen.findByRole('button', { name: 'Read instructions' })
    expect(enter).toHaveProperty('disabled', true)
    expect(screen.getByText(/no authored question set/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Result sheet' })).toBeNull()
  })

  it('exam detail offers the real score summary for a closed paper', async () => {
    await renderRoute('/student/exams/exam-mock-08', { session })
    expect(await screen.findByRole('button', { name: 'Result sheet' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Read instructions' })).toHaveProperty('disabled', true)
  })

  it('the result sheet states the limitation and shows ONLY the real seeded score', async () => {
    await renderRoute('/student/exams/exam-mock-08/result', { session })
    expect(await screen.findByText('Question-level analysis is not published for this paper')).toBeTruthy()
    expect(screen.getByText('Question-level sheet unavailable')).toBeTruthy()
    expect(screen.getByText('Published score summary')).toBeTruthy()
    expect(document.body.textContent).toContain('512')
    expect(screen.queryByText('Result sheet could not load')).toBeNull()
    expect(screen.queryByText('Published example sheet. Submit this paper to replace it with your own stored attempt.')).toBeNull()
  })

  it('the result sheet for a paper with no attempt shows no fabricated score summary', async () => {
    await renderRoute('/student/exams/exam-mock-09/result', { session })
    expect(await screen.findByText('Question-level analysis is not published for this paper')).toBeTruthy()
    expect(screen.queryByText('Published score summary')).toBeNull()
    expect(screen.queryByText('Result sheet could not load')).toBeNull()
  })

  it('the published NEET example sheet still renders its question ledger', async () => {
    await renderRoute('/student/exams/exam-neet-practice/result', { session })
    expect(await screen.findByText('Published example sheet. Submit this paper to replace it with your own stored attempt.')).toBeTruthy()
    expect(screen.queryByText('Question-level analysis is not published for this paper')).toBeNull()
  })
})
