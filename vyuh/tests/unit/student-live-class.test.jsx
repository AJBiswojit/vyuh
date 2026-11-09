import { beforeEach, describe, expect, it, vi } from 'vitest'
import { within } from '@testing-library/react'
import { renderRoute, screen, waitFor } from './helpers.jsx'
import { resetSession } from '../../src/services/mock/liveSessionState.js'
import { signInDemoStudent, signOut } from '../helpers/workspaceIdentity.js'
import { SESSION_STORAGE_KEY, sessionStateStorage } from '../../src/shared/lib/sessionPersistence.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

const SESSION = 'ses-rot-b'

function clearIdentity() {
  signOut()
  sessionStateStorage.removeItem(SESSION_STORAGE_KEY)
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

describe('Student live class — first-time student acceptance', () => {
  beforeEach(() => {
    clearIdentity()
    resetSession(SESSION)
  })

  it('enters the class, sees the stage first and finds the controls', async () => {
    const session = await signInDemoStudent()
    await renderRoute(`/student/live/${SESSION}`, { session })
    await waitFor(() => expect(screen.getByTestId('student-classroom')).toBeTruthy())

    // Header: title, status, leave — nothing else shouting.
    expect(screen.getByRole('heading', { level: 1, name: /Rotational Dynamics/ })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Leave class' }).length).toBeGreaterThan(0)
    // Teaching stage is present and dominant.
    expect(screen.getByTestId('teaching-stage')).toBeTruthy()
    expect(screen.getByTestId('broadcast-preview')).toBeTruthy()
    // Compact attendance, not a register.
    expect(screen.getByTestId('live-presence')).toBeTruthy()
    // The control bar with all five familiar controls.
    const toolbar = screen.getByRole('toolbar', { name: 'Your classroom controls' })
    expect(toolbar).toBeTruthy()
    for (const name of ['Mic off', 'Camera off', 'Raise hand', 'Fullscreen', 'Leave class']) {
      expect(within(toolbar).getByRole('button', { name })).toBeTruthy()
    }
    // Simulated honesty is printed on the stage.
    expect(screen.getByText(/nothing is captured or transmitted/i)).toBeTruthy()
  })

  it('has one conversation surface — no duplicated chat or join buttons', async () => {
    const session = await signInDemoStudent()
    await renderRoute(`/student/live/${SESSION}`, { session })
    await waitFor(() => expect(screen.getByTestId('student-classroom')).toBeTruthy())

    expect(screen.getAllByPlaceholderText(/Message the class/)).toHaveLength(1)
    expect(screen.getAllByRole('log', { name: 'Class chat' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Join shared classroom' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Leave shared classroom' })).toBeNull()
  })

  it('microphone and camera toggles are simulated but visibly work', async () => {
    const session = await signInDemoStudent()
    const { user } = await renderRoute(`/student/live/${SESSION}`, { session })
    await waitFor(() => expect(screen.getByTestId('student-classroom')).toBeTruthy())

    const mic = screen.getByRole('button', { name: 'Mic off' })
    expect(mic.getAttribute('aria-pressed')).toBe('false')
    await user.click(mic)
    expect(screen.getByRole('button', { name: 'Mic on' }).getAttribute('aria-pressed')).toBe('true')

    const camera = screen.getByRole('button', { name: 'Camera off' })
    expect(camera.getAttribute('aria-pressed')).toBe('false')
    await user.click(camera)
    expect(screen.getByRole('button', { name: 'Camera on' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('fullscreen uses the focused overlay when the Fullscreen API is unavailable, and Escape exits', async () => {
    const session = await signInDemoStudent()
    const { user } = await renderRoute(`/student/live/${SESSION}`, { session })
    await waitFor(() => expect(screen.getByTestId('student-classroom')).toBeTruthy())

    await user.click(screen.getByRole('button', { name: 'Fullscreen' }))
    await waitFor(() => expect(screen.getByTestId('teaching-stage').getAttribute('data-fullscreen')).toBe('true'))
    // Title and live status stay discreetly visible; exit control is offered.
    expect(screen.getByRole('button', { name: 'Exit fullscreen' })).toBeTruthy()
    expect(screen.getAllByText(/Rotational Dynamics/).length).toBeGreaterThan(0)

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.getByTestId('teaching-stage').getAttribute('data-fullscreen')).toBe('false'))
  })

  it('Escape also exits the browser-fullscreen path when the API exists', async () => {
    const session = await signInDemoStudent()
    const { user } = await renderRoute(`/student/live/${SESSION}`, { session })
    await waitFor(() => expect(screen.getByTestId('student-classroom')).toBeTruthy())

    const stage = screen.getByTestId('teaching-stage')
    const requestFullscreen = vi.fn().mockResolvedValue(undefined)
    const exitFullscreen = vi.fn().mockImplementation(async () => {
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => null })
      document.dispatchEvent(new Event('fullscreenchange'))
    })
    Object.defineProperty(stage, 'requestFullscreen', { configurable: true, value: requestFullscreen })
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, get: () => true })
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exitFullscreen })
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => stage })

    await user.click(screen.getByRole('button', { name: 'Fullscreen' }))
    await waitFor(() => expect(requestFullscreen).toHaveBeenCalled())
    document.dispatchEvent(new Event('fullscreenchange'))
    await waitFor(() => expect(screen.getByTestId('teaching-stage').getAttribute('data-fullscreen')).toBe('true'))
    // Scene/state preserved: the control bar is still there, lecture still visible.
    expect(screen.getByRole('toolbar', { name: 'Your classroom controls' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Exit fullscreen' }))
    await waitFor(() => expect(exitFullscreen).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByTestId('teaching-stage').getAttribute('data-fullscreen')).toBe('false'))
  })

  it('sends a chat message through the shared classroom', async () => {
    const session = await signInDemoStudent()
    const { user } = await renderRoute(`/student/live/${SESSION}`, { session })
    await waitFor(() => expect(screen.getByTestId('student-classroom')).toBeTruthy())

    await user.type(screen.getByPlaceholderText(/Message the class/), 'Hello from the demo')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(screen.getByText('Hello from the demo')).toBeTruthy())
  })

  it('asks a question and sees it waiting for faculty', async () => {
    const session = await signInDemoStudent()
    const { user } = await renderRoute(`/student/live/${SESSION}`, { session })
    await waitFor(() => expect(screen.getByTestId('student-classroom')).toBeTruthy())

    await user.click(screen.getByRole('tab', { name: /Questions/ }))
    await user.type(screen.getByPlaceholderText(/Ask a question/), 'Why does torque depend on the pivot?')
    await user.click(screen.getByRole('button', { name: /^Ask$/ }))
    await waitFor(() => expect(screen.getByText('Why does torque depend on the pivot?')).toBeTruthy())
    expect(screen.getByText('Waiting for faculty')).toBeTruthy()
  })

  it('raises a hand without any join setup', async () => {
    const session = await signInDemoStudent()
    const { user } = await renderRoute(`/student/live/${SESSION}`, { session })
    await waitFor(() => expect(screen.getByTestId('student-classroom')).toBeTruthy())

    await user.click(screen.getByRole('button', { name: 'Raise hand' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Hand raised' })).toBeTruthy())
  })

  it('leave class asks for confirmation first', async () => {
    const session = await signInDemoStudent()
    const { user } = await renderRoute(`/student/live/${SESSION}`, { session })
    await waitFor(() => expect(screen.getByTestId('student-classroom')).toBeTruthy())

    await user.click(screen.getAllByRole('button', { name: 'Leave class' })[0])
    const dialog = await screen.findByRole('dialog', { name: 'Leave this class?' })
    expect(dialog).toBeTruthy()
    await user.click(within(dialog).getByRole('button', { name: 'Keep watching' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Leave this class?' })).toBeNull())

    await user.click(screen.getAllByRole('button', { name: 'Leave class' })[0])
    const confirm = await screen.findByRole('dialog', { name: 'Leave this class?' })
    await user.click(within(confirm).getByRole('button', { name: 'Leave class' }))
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/student/live'))
  })
})
