import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ExamCountdown } from '@/features/student/components/ExamCountdown.jsx'
import { NextUpCard } from '@/features/student/components/NextUpCard.jsx'

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-07T09:00:00Z')) })
afterEach(() => { vi.useRealTimers() })

describe('dashboard countdown isolation', () => {
  it('ticks every second without re-rendering the parent page', () => {
    let parentRenders = 0
    function Parent() {
      parentRenders += 1
      return <ExamCountdown target="2026-11-07T09:00:05Z" />
    }
    render(<Parent />)
    expect(parentRenders).toBe(1)
    const initial = screen.getByRole('timer').textContent
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getByRole('timer').textContent).not.toBe(initial)
    expect(parentRenders).toBe(1)
  })

  it('reports readiness once the start time is reached', () => {
    const onReady = vi.fn()
    render(<ExamCountdown target="2026-11-07T09:00:02Z" onReady={onReady} />)
    expect(onReady).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(3000) })
    expect(onReady).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('timer').textContent).toContain('Start time reached')
  })
})

describe('exam hall readiness', () => {
  it('keeps Enter exam hall disabled until the scheduled start, regardless of checklist progress', () => {
    const exam = { id: 'exam-soon', title: 'Readiness mock', scheduledFor: '2026-11-07T09:00:03Z', durationMinutes: 180, questionCount: 180, sectionCount: 3, negativeMarks: 1 }
    render(<MemoryRouter><NextUpCard exam={exam} /></MemoryRouter>)
    const button = screen.getByRole('button', { name: 'Enter exam hall at start time' })
    expect(button.disabled).toBe(true)
    for (const label of ['Camera checked', 'Network stable', 'Instructions read']) fireEvent.click(screen.getByLabelText(label))
    expect(button.disabled).toBe(true)
    act(() => { vi.advanceTimersByTime(3000) })
    expect(screen.getByRole('button', { name: 'Enter exam hall', exact: true }).disabled).toBe(false)
  })
})
