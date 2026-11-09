import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, within } from '@testing-library/react'
import { renderRoute, screen, waitFor } from './helpers.jsx'
import { liveStudioService } from '../../src/services/mock/liveStudio.js'
import { resetSession } from '../../src/services/mock/liveSessionState.js'
import { signInDemoFaculty, signInDemoStudent, signOut } from '../helpers/workspaceIdentity.js'
import { SESSION_STORAGE_KEY, sessionStateStorage } from '../../src/shared/lib/sessionPersistence.js'
import { PROTOTYPE_NOTICE, MIRROR_NOTICE } from '../../src/mock-data/index.js'

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

describe('VYUH LIVE STUDIO — end-to-end prototype journeys (same browser context)', () => {
  beforeEach(() => {
    clearIdentity()
    resetSession(SESSION)
  })

  it('Faculty Studio: Start class, switch the stage, toggle a simulated control, collapse Mirror', async () => {
    const session = await signInDemoFaculty()
    const { user } = await renderRoute('/faculty/classes/ses-rot-b/host', { session })
    await waitFor(() => expect(screen.getByTestId('faculty-live-studio')).toBeTruthy())
    expect(screen.getByTestId('broadcast-preview')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Start class' }))
    await waitFor(() => expect(screen.getAllByText(/Live now/).length).toBeGreaterThan(0))

    await user.click(screen.getByRole('tab', { name: 'Stage view' }))
    await user.click(screen.getByRole('button', { name: /Whiteboard Focus/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Whiteboard Focus/ }).getAttribute('aria-pressed')).toBe('true'))

    await user.click(screen.getByRole('button', { name: /Microphone Off/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Microphone On/ })).toBeTruthy())

    expect(screen.getByText(MIRROR_NOTICE)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Collapse mirror' }))
    expect(screen.getByText(MIRROR_NOTICE)).toBeTruthy()
    expect(screen.getByTestId('classroom-mirror')).toBeTruthy()
  })

  it('Faculty Studio: the persistent prototype notice is always visible', async () => {
    const session = await signInDemoFaculty()
    await renderRoute('/faculty/classes/ses-rot-b/host', { session })
    await waitFor(() => expect(screen.getByTestId('faculty-live-studio')).toBeTruthy())
    expect(screen.getAllByText(PROTOTYPE_NOTICE).length).toBeGreaterThan(0)
    expect(screen.getByText(/Simulated controls only/)).toBeTruthy()
  })

  it('Faculty Studio: a non-canonical id keeps the host console and says Studio is unavailable', async () => {
    const session = await signInDemoFaculty()
    await renderRoute('/faculty/classes/cls-optics-2/host', { session })
    await waitFor(() => expect(screen.getByText('Live Studio is not available for this session')).toBeTruthy())
    expect(screen.queryByTestId('faculty-live-studio')).toBeNull()
  })

  it('Student Classroom: receives the Faculty scene and shared state without the Mirror', async () => {
    /* Faculty prepares the shared state first: one browser context, one identity
       at a time, with the classroom key surviving the identity swap. */
    await signInDemoFaculty()
    await liveStudioService.dispatch(SESSION, 'faculty', { type: 'scene_changed', payload: { scene: 'presentation' } })
    await liveStudioService.dispatch(SESSION, 'faculty', { type: 'poll_created', payload: { question: 'Ready to move on?', options: ['Yes', 'One more example'] } })
    await liveStudioService.dispatch(SESSION, 'faculty', { type: 'chat_sent', payload: { body: 'Welcome from Faculty' } })
    clearIdentity()
    const student = await signInDemoStudent()

    const { user } = await renderRoute('/student/live/ses-rot-b', { session: student })
    await waitFor(() => expect(screen.getByTestId('student-classroom')).toBeTruthy())
    expect(screen.getByTestId('broadcast-preview')).toBeTruthy()
    await waitFor(() => expect(screen.getAllByText(/Presentation \+ Faculty/).length).toBeGreaterThan(0))
    expect(screen.queryByText(MIRROR_NOTICE)).toBeNull()
    expect(screen.getAllByText(PROTOTYPE_NOTICE).length).toBeGreaterThan(0)

    /* Participation is implicit — there is no join button in the way of the
       first action. The hand toggle records one join, then raises. */
    expect(screen.queryByRole('button', { name: 'Join shared classroom' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Raise hand' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Hand raised' })).toBeTruthy())

    /* Polls and resources live one tap away, out of the way of teaching. */
    await user.click(screen.getByRole('button', { name: /Polls/ }))
    const pollsSheet = await screen.findByRole('dialog', { name: 'Class polls' })
    expect(within(pollsSheet).getByText('Ready to move on?')).toBeTruthy()
    await user.click(within(pollsSheet).getByRole('button', { name: /^Yes/ }))
    await waitFor(() => expect(within(pollsSheet).getByText(/Your recorded response is saved/)).toBeTruthy())
  })

  /* ── Acceptance remediation R12: approval makes a question visible ─────── */

  it('Student Classroom: only Faculty-approved questions appear in Q&A', async () => {
    const body = 'Approval makes this question visible'
    await signInDemoFaculty()
    const prepared = await liveStudioService.dispatch(SESSION, 'faculty', { type: 'question_added', payload: { body } })
    const question = prepared.questions[prepared.questions.length - 1]
    expect(question.status).toBe('pending')

    clearIdentity()
    const student = await signInDemoStudent()
    const { user } = await renderRoute('/student/live/ses-rot-b', { session: student })
    await waitFor(() => expect(screen.getByTestId('student-classroom')).toBeTruthy())
    await user.click(screen.getByRole('tab', { name: /Questions/ }))
    expect(screen.queryByText(body)).toBeNull()
    cleanup()

    clearIdentity()
    await signInDemoFaculty()
    await liveStudioService.dispatch(SESSION, 'faculty', { type: 'question_approved', payload: { id: question.id } })

    clearIdentity()
    const studentAgain = await signInDemoStudent()
    const second = await renderRoute('/student/live/ses-rot-b', { session: studentAgain })
    await waitFor(() => expect(screen.getByTestId('student-classroom')).toBeTruthy())
    await second.user.click(screen.getByRole('tab', { name: /Questions/ }))
    expect(await screen.findByText(body)).toBeTruthy()
  })

  it('Student Classroom: attendance, chat and destinations remain reachable', async () => {
    const session = await signInDemoStudent()
    await renderRoute('/student/live/ses-rot-b', { session })
    await waitFor(() => expect(screen.getByTestId('student-classroom')).toBeTruthy())
    expect(screen.getByTestId('live-presence')).toBeTruthy()
    expect(screen.getByRole('log', { name: 'Class chat' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /Questions/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Attendance details' })).toBeTruthy()
    // One conversation — no duplicated chat surfaces.
    expect(screen.getAllByPlaceholderText(/Message the class/)).toHaveLength(1)
    // The recording library is not linked from the active class.
    expect(screen.queryByRole('link', { name: 'Open the recording library' })).toBeNull()
  })
})
