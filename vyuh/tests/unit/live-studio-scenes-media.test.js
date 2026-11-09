import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SceneManager } from '../../src/features/live/components/SceneManager.jsx'
import { liveStudioService } from '../../src/services/mock/liveStudio.js'
import { resetSession, readState } from '../../src/services/mock/liveSessionState.js'
import { STUDIO_SCENES, CANONICAL_STUDIO_SESSION_ID } from '../../src/mock-data/index.js'
import { signInDemoFaculty, signOut } from '../helpers/workspaceIdentity.js'
import { SESSION_STORAGE_KEY, sessionStateStorage } from '../../src/shared/lib/sessionPersistence.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

const SESSION = CANONICAL_STUDIO_SESSION_ID

describe('VYUH LIVE STUDIO — five scenes and simulated media controls', () => {
  beforeEach(async () => {
    signOut()
    sessionStateStorage.removeItem(SESSION_STORAGE_KEY)
    localStorage.removeItem(SESSION_STORAGE_KEY)
    resetSession(SESSION)
    await signInDemoFaculty()
  })
  afterEach(cleanup)

  it('exposes exactly five labelled scenes', () => {
    expect(STUDIO_SCENES).toHaveLength(5)
    expect(STUDIO_SCENES.map((scene) => scene.id)).toEqual(['camera', 'presentation', 'whiteboard', 'content', 'split'])
  })

  it('renders five scene buttons and dispatches a scene change on click', () => {
    const send = vi.fn()
    render(createElement(SceneManager, { scenes: STUDIO_SCENES.map((scene) => ({ ...scene })), activeScene: 'camera', send }))
    const group = screen.getByRole('group', { name: 'Choose what students see' })
    expect(group.querySelectorAll('button')).toHaveLength(5)
    fireEvent.click(screen.getByRole('button', { name: /Split Classroom/ }))
    expect(send).toHaveBeenCalledWith('scene_changed', { scene: 'split' })
    expect(screen.getByRole('button', { name: /Camera Focus/ }).getAttribute('aria-pressed')).toBe('true')
  })

  it('synchronizes scene changes through the shared service', async () => {
    for (const scene of STUDIO_SCENES) {
      const snapshot = await liveStudioService.dispatch(SESSION, 'faculty', { type: 'scene_changed', payload: { scene: scene.id } })
      expect(snapshot.activeScene).toBe(scene.id)
      expect(readState(SESSION).activeScene).toBe(scene.id)
    }
  })

  it('toggles microphone, camera, screen sharing and simulated recording', async () => {
    let snapshot = await liveStudioService.getSnapshot(SESSION, 'faculty')
    expect(snapshot.snapshot.media).toEqual({ micOn: false, cameraOn: false, screenSharing: false, recording: false })
    for (const key of ['micOn', 'cameraOn', 'screenSharing', 'recording']) {
      const updated = await liveStudioService.dispatch(SESSION, 'faculty', { type: 'media_toggled', payload: { key, value: true } })
      expect(updated.media[key]).toBe(true)
    }
  })

  it('records Go Live and End Session as lifecycle events', async () => {
    let snapshot = await liveStudioService.dispatch(SESSION, 'faculty', { type: 'session_started' })
    expect(snapshot.status).toBe('live')
    expect(snapshot.startedAt).toBeTruthy()
    snapshot = await liveStudioService.dispatch(SESSION, 'faculty', { type: 'session_ended' })
    expect(snapshot.status).toBe('ended')
    expect(snapshot.endedAt).toBeTruthy()
    expect(snapshot.events.map((event) => event.type)).toEqual(['session_started', 'session_ended'])
  })

  it('never uses a real media API', () => {
    const source = [
      'src/features/live/components/DeviceBar.jsx',
      'src/features/live/components/BroadcastPreview.jsx',
      'src/features/live/components/Whiteboard.jsx',
    ].map((path) => readFileSync(path, 'utf8')).join('\n')
    for (const forbidden of ['getUserMedia', 'getDisplayMedia', 'new WebSocket', 'EventSource', 'RTCPeerConnection']) {
      expect(source.includes(forbidden)).toBe(false)
    }
    expect(source.includes('Simulated controls only')).toBe(true)
  })
})
