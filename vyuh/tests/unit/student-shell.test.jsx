import { beforeEach, describe, expect, it, vi } from 'vitest'
import { within } from '@testing-library/react'
import { renderRoute, screen, waitFor } from './helpers.jsx'
import { authService } from '@/services/mock/auth.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'

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

const heading = (name) => screen.findByRole('heading', { name, level: 1 })

describe('student app shell acceptance', () => {
  it('routes every sidebar item to a rendered page', async () => {
    const { user } = await renderRoute('/student', { session })
    await heading(/Good (morning|afternoon|evening), Ananya/)
    const nav = screen.getByRole('navigation', { name: 'Student workspace' })
    const pages = [
      ['Exams', '/student/exams', 'Exams'],
      ['Live classes', '/student/live', 'Live classes'],
      ['Recordings', '/student/recordings', 'Recordings'],
      ['Performance', '/student/performance', 'Performance'],
      ['Doubts', '/student/doubts', 'Doubts'],
      ['Attendance', '/student/attendance', 'Attendance'],
      ['Study rooms', '/student/study-rooms', 'Study rooms'],
      ['Profile', '/student/profile', 'Profile'],
      ['Dashboard', '/student', /Good (morning|afternoon|evening), Ananya/],
    ]
    for (const [label, path, title] of pages) {
      await user.click(within(nav).getByRole('link', { name: label }))
      await waitFor(() => expect(screen.getByTestId('route').textContent).toBe(path))
      await heading(title)
    }
  })

  it('command palette finds pages and exams by name and works by keyboard', async () => {
    const { user } = await renderRoute('/student', { session })
    await heading(/Good (morning|afternoon|evening), Ananya/)
    await user.keyboard('{Control>}k{/Control}')
    const input = await screen.findByRole('combobox', { name: 'Search pages and exams' })
    await user.type(input, 'Mock 09')
    const option = await screen.findByRole('option', { name: /Full Syllabus Mock 09/ })
    expect(option.getAttribute('aria-selected')).toBe('true')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByTestId('route').textContent).toContain('/student/exams?exam=exam-mock-09'))
    await heading('Exams')

    await user.keyboard('{Control>}k{/Control}')
    await user.type(await screen.findByRole('combobox', { name: 'Search pages and exams' }), 'Doubts')
    await screen.findByRole('option', { name: /Doubts/ })
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/student/doubts'))
    await heading('Doubts')
  })

  it('shows an empty state when the student has no past attempts', async () => {
    localStorage.setItem('vyuh.mock.studentScenario', 'empty-attempts')
    await renderRoute('/student', { session })
    await heading(/Good (morning|afternoon|evening), Ananya/)
    expect(await screen.findByText('No past attempts yet')).toBeTruthy()
    expect(screen.getByText('No subject strength yet')).toBeTruthy()
  })
})
