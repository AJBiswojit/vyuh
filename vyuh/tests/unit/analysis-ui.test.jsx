import { beforeEach, describe, expect, it, vi } from 'vitest'
import { within } from '@testing-library/react'
import { renderRoute, screen, waitFor } from './helpers.jsx'
import { authService } from '@/services/mock/auth.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { perQuestionAnalysis } from '@/mock-data/analysis.js'
import { countFilters } from '@/shared/lib/analysisMath.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

let session
beforeEach(async () => {
  localStorage.clear()
  useSessionStore.getState().clear()
  session = await authService.login({ email: 'ananya.sahoo@vidyutacademy.in', password: 'vyuh2026' })
})

const RESULT = '/student/exams/exam-neet-practice/result'

describe('result sheet acceptance', () => {
  it('renders data-owned summary, matching filters, drawer focus return and what-if', async () => {
    const { user } = await renderRoute(RESULT, { session })
    const hero = await screen.findByTestId('score-hero')
    await waitFor(() => expect(hero.getAttribute('aria-label')).toContain('156'))
    const counts = countFilters(perQuestionAnalysis)
    expect(screen.getByTestId('filter-wrong').querySelector('[data-count]')?.textContent).toBe(String(counts.wrong))
    await user.click(screen.getByTestId('filter-wrong'))
    const ledger = screen.getByTestId('question-ledger')
    await waitFor(() => expect(within(ledger).getAllByRole('button')).toHaveLength(counts.wrong))

    const row = screen.getByTestId('question-row-3')
    await user.click(row)
    expect(await screen.findByRole('dialog', { name: 'Question 3 analysis' })).toBeTruthy()
    expect(screen.getByText('Official explanation')).toBeTruthy()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(row)

    const before = screen.getByTestId('what-if-score').textContent
    expect(before).toContain('156')
    await user.click(screen.getByLabelText('Remove negative marking'))
    await waitFor(() => expect(screen.getByTestId('what-if-score').textContent).toContain('168'))
  })
  it('offers a table alternative fed by the pacing chart data', async () => {
    const { user } = await renderRoute(RESULT, { session })
    await screen.findByTestId('result-summary')
    const toggles = screen.getAllByRole('button', { name: 'View as table' })
    await user.click(toggles[0])
    expect(await screen.findByText('Pacing data: student seconds, cohort average, median band and flags')).toBeTruthy()
    const table = screen.getByText('Pacing data: student seconds, cohort average, median band and flags').closest('table')
    expect(table?.querySelectorAll('tbody tr')).toHaveLength(perQuestionAnalysis.length)
  })
  it('shows the locked state with countdown and release rule', async () => {
    localStorage.setItem('vyuh.mock.analysisLocked', 'true')
    localStorage.setItem('vyuh.mock.analysisReleaseInSeconds', '120')
    await renderRoute(RESULT, { session })
    expect(await screen.findByTestId('release-lock')).toBeTruthy()
    expect(screen.getByTestId('release-countdown').textContent).toMatch(/\d{2}:\d{2}/)
    expect(screen.getByText(/Results unlock after the paper window closes/)).toBeTruthy()
    expect(screen.queryByTestId('question-ledger')).toBeNull()
  })
})
