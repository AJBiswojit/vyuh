import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, within } from '@testing-library/react'
import { renderRoute, screen, waitFor } from './helpers.jsx'
import { authService } from '@/services/mock/auth.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { attendanceRows, facultyClasses } from '@/mock-data/facultyWorkspace.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

let session
beforeEach(async () => {
  localStorage.clear()
  useSessionStore.getState().clear()
  session = await authService.login({ email: 'snehasish@vidyutacademy.in', password: 'vyuh2026' })
})

describe('faculty workspace', () => {
  it('opens on a dashboard with today, queues and cohort', async () => {
    await renderRoute('/faculty', { session })
    expect(await screen.findByRole('heading', { level: 1, name: /Good to see you/ })).toBeTruthy()
    expect(await screen.findByTestId('today-classes')).toBeTruthy()
    expect(screen.getByTestId('approval-list')).toBeTruthy()
    expect(screen.getByTestId('pending-doubts')).toBeTruthy()
    expect(screen.getByText(/Weakest topic:/)).toBeTruthy()
  })

  it('filters the bank in a top bar and reads the selected row in the split pane', async () => {
    const { user } = await renderRoute('/faculty/bank', { session })
    const rows = await screen.findAllByTestId(/bank-row-/)
    expect(rows.length).toBeGreaterThan(5)
    expect(screen.getByTestId('question-preview')).toBeTruthy()

    const second = rows[1]
    await user.click(second)
    await waitFor(() => expect(second.getAttribute('aria-current')).toBe('true'))

    await user.type(screen.getByLabelText('Search the bank'), 'zzz-no-such-item')
    await waitFor(() => expect(screen.getByText('0 questions match')).toBeTruthy())
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() => expect(screen.queryByText('0 questions match')).toBeNull())
  })

  it('carries a new question from the editor to the bank and into a paper palette', async () => {
    const { user } = await renderRoute('/faculty/bank/new', { session })
    await screen.findByRole('group', { name: 'Question type' })
    await waitFor(() => expect(screen.getByTestId('editor-readiness')).toBeTruthy())

    await user.type(screen.getByLabelText('Question'), 'A uniform disc of mass $M$ and radius $R$ spins about its centre. Its moment of inertia about that axis is')
    await user.type(screen.getByLabelText('Option A'), '$\\frac{1}{2}MR^2$')
    await user.type(screen.getByLabelText('Option B'), '$MR^2$')
    await user.type(screen.getByLabelText('Option C'), '$\\frac{2}{5}MR^2$')
    await user.type(screen.getByLabelText('Option D'), '$\\frac{3}{2}MR^2$')
    await user.click(screen.getByLabelText('A correct'))
    await user.type(screen.getByLabelText('Explanation'), 'A disc concentrates mass nearer the axis than a ring, so the factor is one half.')

    await waitFor(() => expect(screen.queryByTestId('editor-readiness')).toBeNull())
    await user.click(screen.getByRole('button', { name: 'Save to bank' }))

    await screen.findByText('Added to the bank')
    const newRow = await waitFor(
      () => {
        const match = screen.getAllByTestId(/bank-row-/).find((node) => node.textContent?.includes('uniform disc of mass'))
        expect(match).toBeTruthy()
        return match
      },
      { timeout: 4000 },
    )
    const questionId = newRow.getAttribute('data-testid')?.replace('bank-row-', '')
    expect(questionId).toBeTruthy()

    await user.click(newRow)
    await user.click(screen.getByRole('button', { name: 'Add to exam' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add this question to a paper' })
    await user.click(within(dialog).getByRole('button', { name: 'Add to paper' }))
    await waitFor(() => expect(screen.getByText('Added to the paper')).toBeTruthy())

    const examsLinks = screen.getAllByRole('link', { name: /Exams/ })
    await user.click(examsLinks[0])
    const ledger = await screen.findByTestId('exam-ledger')
    const paperLink = within(ledger).getByRole('link', { name: /NEET Mock 08/ })
    await user.click(paperLink)
    await screen.findByTestId('palette-preview')
    const palette = screen.getByTestId('palette-preview')
    await waitFor(() => expect(palette.querySelector(`[data-question-id="${questionId}"]`)).toBeTruthy())
  })

  it('marks an item faulty behind a confirmation and moves the scores students see', async () => {
    const { user } = await renderRoute('/faculty/analysis?exam=exam-neet-practice', { session })
    const ledger = await screen.findByTestId('item-ledger')
    expect(within(ledger).getAllByRole('button', { name: /Faulty/ }).length).toBeGreaterThan(0)

    await user.click(within(ledger).getAllByRole('button', { name: /Faulty/ })[0])
    const dialog = await screen.findByRole('dialog', { name: 'Mark this question faulty?' })
    await user.click(within(dialog).getByRole('button', { name: 'Mark as faulty' }))

    await waitFor(() => expect(screen.getByText('1 item voided')).toBeTruthy())
    expect(screen.getByTestId('score-policy').textContent).toMatch(/16 of 32 candidates move/)
    expect(screen.getByText('Question marked faulty')).toBeTruthy()

    // The same register is what a candidate's result sheet reads: the voided
    // item removes its penalty, so the published 156 becomes 157.
    cleanup()
    const studentSession = await authService.login({ email: 'ananya.sahoo@vidyutacademy.in', password: 'vyuh2026' })
    await renderRoute('/student/exams/exam-neet-practice/result', { session: studentSession })
    const hero = await screen.findByTestId('score-hero')
    await waitFor(() => expect(hero.getAttribute('aria-label')).toContain('157'))
  })

  it('feeds the monitor from mock events so the wall changes without a reload', async () => {
    localStorage.setItem('vyuh.mock.monitorIntervalSeconds', '1')
    await renderRoute('/faculty/exams/exam-neet-mock-07/monitor', { session })
    const counts = await screen.findByTestId('monitor-counts')
    expect(counts).toBeTruthy()
    const answersBefore = Number(screen.getByTestId('monitor-answers').textContent)
    await new Promise((resolve) => setTimeout(resolve, 1600))
    await waitFor(() => expect(Number(screen.getByTestId('monitor-answers').textContent)).toBeGreaterThan(answersBefore))
    expect(await screen.findByTestId('monitor-feed')).toBeTruthy()
  })

  it('starts a room, mutes a participant and puts a queued question on screen', async () => {
    const target = facultyClasses.find((item) => item.id === 'ses-rot-b') ?? facultyClasses[0]
    const { user } = await renderRoute(`/faculty/classes/${target.id}/host`, { session })
    await screen.findByTestId('host-participants')

    await user.click(screen.getByRole('button', { name: 'Start session' }))
    await waitFor(() => expect(screen.getByText('Session started')).toBeTruthy())

    const participants = screen.getByTestId('host-participants')
    await user.click(within(participants).getAllByRole('button', { name: 'Mute' })[0])
    const muteDialog = await screen.findByRole('dialog')
    await user.click(within(muteDialog).getByRole('button', { name: 'Mute participant' }))
    await waitFor(() => expect(within(participants).getAllByRole('button', { name: 'Unmute' }).length).toBeGreaterThan(0))

    const queue = screen.getByTestId('host-queue')
    await user.click(within(queue).getAllByRole('button', { name: 'Approve' })[0])
    await waitFor(() => expect(within(queue).getAllByText('On screen').length).toBeGreaterThan(0))

    await user.click(screen.getByRole('button', { name: 'End' }))
    const endDialog = await screen.findByRole('dialog', { name: 'End this session?' })
    await user.click(within(endDialog).getByRole('button', { name: 'Keep it' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'End this session?' })).toBeNull())
  })

  it('answers a doubt from a saved reply template', async () => {
    const { user } = await renderRoute('/faculty/doubts', { session })
    const inbox = await screen.findByTestId('doubt-inbox')
    await user.click(within(inbox).getAllByRole('link')[0])

    await screen.findByTestId('doubt-thread')
    await user.selectOptions(screen.getByLabelText('Saved replies'), screen.getAllByRole('option')[1])
    const composer = screen.getByLabelText('Your answer')
    await waitFor(() => expect(composer.value.length).toBeGreaterThan(10))

    await user.click(screen.getByRole('button', { name: 'Send answer' }))
    await waitFor(() => expect(screen.getByText('Answer sent')).toBeTruthy())
    expect(screen.getByText('Answered')).toBeTruthy()
  })

  it('filters the register to defaulters and keeps the export on the same rows', async () => {
    const { user } = await renderRoute('/faculty/attendance', { session })
    const table = await screen.findByTestId('attendance-table')
    const total = attendanceRows.length
    const defaulters = attendanceRows.filter((row) => row.defaulter).length
    expect(table.querySelectorAll('tbody tr')).toHaveLength(total)

    await user.click(screen.getByLabelText('Defaulters only'))
    await waitFor(() => expect(screen.getByTestId('attendance-table').querySelectorAll('tbody tr')).toHaveLength(defaulters))
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeTruthy()
  })
})
