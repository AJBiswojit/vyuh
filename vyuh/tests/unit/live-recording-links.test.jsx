import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute, screen, waitFor } from './helpers.jsx'
import { learningService } from '../../src/services/mock/learning.js'
import { liveSessions } from '../../src/mock-data/liveSessions.js'
import { recordings } from '../../src/mock-data/recordings.js'
import { liveRoomSchema } from '../../src/services/api/schemas.js'
import { signInDemoStudent } from '../helpers/workspaceIdentity.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

/** @type {any} */
let session
/* BATCH 3.2: re-establish the matching demo session after localStorage.clear()
 * so direct service calls and rendered routes both have a valid identity. */
beforeEach(async () => { localStorage.clear(); session = await signInDemoStudent() })

const ended = liveSessions.find((session) => session.status === 'ended')

describe('ended-class recording ids come from the session fixture (D-19)', () => {
  it('the seeded ended session names a real recording fixture', () => {
    expect(ended).toBeTruthy()
    expect(ended.recordingId).toBe('rec-rot-b')
    expect(ended.joinUrl).toBe(`/student/recordings/${ended.recordingId}`)
    expect(recordings.some((recording) => recording.id === ended.recordingId)).toBe(true)
  })

  it('getLiveRoom returns the session recording id, not a hard-coded default', async () => {
    const room = await learningService.getLiveRoom(ended.id, 'stu-ananya')
    expect(room.recordingId).toBe(ended.recordingId)
    expect(liveRoomSchema.safeParse(room).success).toBe(true)
  })

  it('a live or scheduled session has no replay id', async () => {
    for (const candidate of liveSessions.filter((session) => session.status !== 'ended')) {
      const room = await learningService.getLiveRoom(candidate.id, 'stu-ananya')
      expect(room.recordingId).toBeNull()
    }
  })

  it('listLiveSessions carries the recording id to the schedule page', async () => {
    const sessions = await learningService.listLiveSessions('stu-ananya')
    expect(sessions.find((session) => session.id === ended.id).recordingId).toBe(ended.recordingId)
  })

  it('the schedule page links the ended row to its own recording', async () => {
    await renderRoute('/student/live', { session })
    const link = await screen.findByRole('link', { name: 'Watch recording' })
    expect(link.getAttribute('href')).toBe(`/student/recordings/${ended.recordingId}`)
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Live classes' })).toBeTruthy())
  })

  it('the live room ended state links to its own recording', async () => {
    await renderRoute(`/student/live/${ended.id}`, { session })
    const link = await screen.findByRole('link', { name: 'Watch recording' })
    expect(link.getAttribute('href')).toBe(`/student/recordings/${ended.recordingId}`)
    expect(screen.getByText('This class has ended')).toBeTruthy()
  })

  it('no presentation or service file embeds the hard-coded replay link', () => {
    const files = [
      'src/features/learning/pages/LiveSchedulePage.jsx',
      'src/features/learning/pages/LiveRoomPage.jsx',
      'src/services/mock/learning.js',
    ]
    for (const file of files) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8')
      expect(source.includes('/student/recordings/rec-rot-b')).toBe(false)
    }
  })
})
