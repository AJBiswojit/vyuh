import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute, screen, waitFor } from './helpers.jsx'
import { signInDemoFaculty, signOut } from '../helpers/workspaceIdentity.js'
import { resetSession } from '../../src/services/mock/liveSessionState.js'
import { SESSION_STORAGE_KEY, sessionStateStorage } from '../../src/shared/lib/sessionPersistence.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

/**
 * The "technology without complexity" acceptance checklist, run as a first-time
 * teacher with no technical knowledge:
 *   open the class → see whether it is ready → start it with one obvious
 *   action → share the presentation / whiteboard → find a question → end the
 *   class → understand what happened. Advanced tools must stay one clearly
 *   labelled click away, never in the way of those steps.
 */
describe('Faculty live class — first-time teacher acceptance', () => {
  beforeEach(() => {
    signOut()
    sessionStateStorage.removeItem(SESSION_STORAGE_KEY)
    localStorage.removeItem(SESSION_STORAGE_KEY)
    resetSession('ses-rot-b')
  })

  it('offers exactly one obvious action to begin, and explains readiness', async () => {
    const session = await signInDemoFaculty()
    await renderRoute('/faculty/classes/ses-rot-b/host', { session })
    await waitFor(() => expect(screen.getByTestId('faculty-live-studio')).toBeTruthy())

    // One obvious starting action — never two competing ones.
    expect(screen.getAllByRole('button', { name: 'Start class' })).toHaveLength(1)
    // The page says, in plain words, whether the classroom is ready.
    expect(screen.getByText(/Everything is loaded — press Start class/)).toBeTruthy()
    expect(screen.getByText('Not started')).toBeTruthy()
    // Nothing advanced shouts for attention before the teacher starts.
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('puts the presentation and the whiteboard one tap away', async () => {
    const session = await signInDemoFaculty()
    const { user } = await renderRoute('/faculty/classes/ses-rot-b/host', { session })
    await waitFor(() => expect(screen.getByTestId('faculty-live-studio')).toBeTruthy())

    await user.click(screen.getByRole('button', { name: /Share presentation/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Share presentation/ }).getAttribute('aria-pressed')).toBe('true'))

    await user.click(screen.getByRole('button', { name: /Open whiteboard/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Open whiteboard/ }).getAttribute('aria-pressed')).toBe('true'))
  })

  it('finds a student question and jumps to it', async () => {
    const session = await signInDemoFaculty()
    const { user } = await renderRoute('/faculty/classes/ses-rot-b/host', { session })
    await waitFor(() => expect(screen.getByTestId('faculty-live-studio')).toBeTruthy())

    await user.click(screen.getByRole('button', { name: /^Questions\./ }))
    // The Q&A tab is now selected — questions are one place, not scattered.
    await waitFor(() => expect(screen.getByRole('tab', { name: /Q&A/ }).getAttribute('aria-selected')).toBe('true'))

    await user.click(screen.getByRole('button', { name: /View students/ }))
    await waitFor(() => expect(screen.getByRole('tab', { name: /Students/ }).getAttribute('aria-selected')).toBe('true'))
  })

  it('keeps advanced records behind a clearly labelled More options area', async () => {
    const session = await signInDemoFaculty()
    const { user } = await renderRoute('/faculty/classes/ses-rot-b/host', { session })
    await waitFor(() => expect(screen.getByTestId('faculty-live-studio')).toBeTruthy())

    const more = screen.getByRole('button', { name: /More options — attendance, attention checks, moderation and records/ })
    await user.click(more)
    const dialog = await screen.findByRole('dialog', { name: 'More options' })
    expect(dialog.textContent).toContain('Attendance')
    expect(dialog.textContent).toContain('attention check')
    expect(dialog.textContent).toContain('Moderation')
    expect(dialog.textContent).toContain('Class setup')
    // Escape closes the dialog, not the page.
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'More options' })).toBeNull())
  })

  it('never leaks engineering jargon into the teaching surface', async () => {
    const session = await signInDemoFaculty()
    await renderRoute('/faculty/classes/ses-rot-b/host', { session })
    await waitFor(() => expect(screen.getByTestId('faculty-live-studio')).toBeTruthy())

    const pageText = document.body.textContent ?? ''
    for (const forbidden of [/revision\s*\d/i, /Broadcast orchestration/i, /Stream configuration/i, /Presence telemetry/i, /Event dispatch/i, /Session synchronization/i]) {
      expect(pageText).not.toMatch(forbidden)
    }
  })

  it('starts, shows Live now, ends, and explains what happened', async () => {
    const session = await signInDemoFaculty()
    const { user } = await renderRoute('/faculty/classes/ses-rot-b/host', { session })
    await waitFor(() => expect(screen.getByTestId('faculty-live-studio')).toBeTruthy())

    await user.click(screen.getByRole('button', { name: 'Start class' }))
    await waitFor(() => expect(screen.getAllByText('Live now').length).toBeGreaterThan(0))

    await user.click(screen.getByRole('button', { name: 'End class' }))
    const endDialog = await screen.findByRole('dialog', { name: 'End this class?' })
    await user.click(withinDialog(endDialog, 'End class'))
    await waitFor(() => expect(screen.getAllByText('Class ended').length).toBeGreaterThan(0))
    // The end of the class is explained in plain words, not codes.
    expect(screen.getAllByText(/attendance is final/i).length).toBeGreaterThan(0)
  }, 15000)
})

/** @param {HTMLElement} dialog @param {string} name */
function withinDialog(dialog, name) {
  const button = Array.from(dialog.querySelectorAll('button')).find((node) => (node.textContent ?? '').trim() === name)
  if (!button) throw new Error(`No button named ${name} in dialog`)
  return /** @type {HTMLElement} */ (button)
}
