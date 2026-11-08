import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { liveStudioService } from '../../src/services/mock/liveStudio.js'
import { storageKeyFor, readState } from '../../src/services/mock/liveSessionState.js'
import { SESSION_STORAGE_KEY, sessionStateStorage } from '../../src/shared/lib/sessionPersistence.js'
import {
  signInDemoStudent, signInDemoFaculty, signInIssuedStudent, signInIssuedFaculty,
  expirePersistedSession, signOut,
} from '../helpers/workspaceIdentity.js'
import { PROTOTYPE_NOTICE, PROVENANCE_LABELS } from '../../src/mock-data/index.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

const ROOT = process.cwd()
const CANONICAL = 'ses-rot-b'

/**
 * Strip comments before scanning source. Prose in a header comment legitimately
 * mentions forbidden APIs while explaining that they are NOT used.
 * @param {string} source
 */
function codeOnly(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n')
}

/** Fully clear the persisted identity, including the in-memory fallback. */
function clearIdentityCompletely() {
  signOut()
  sessionStateStorage.removeItem(SESSION_STORAGE_KEY)
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

/** @param {string[]} paths */
function sources(paths) {
  return codeOnly(paths.map((path) => readFileSync(resolve(ROOT, path), 'utf8')).join('\n'))
}

describe('VYUH LIVE STUDIO — fail-closed identity boundary', () => {
  beforeEach(() => {
    clearIdentityCompletely()
    localStorage.removeItem(storageKeyFor(CANONICAL))
  })

  it('getSnapshot resolves only with a valid matching Student session', async () => {
    await signInDemoStudent()
    const result = await liveStudioService.getSnapshot(CANONICAL, 'student')
    expect(result.compatible).toBe(true)
    expect(result.snapshot.sessionId).toBe(CANONICAL)
  })

  it('getSnapshot resolves only with a valid matching Faculty session', async () => {
    await signInDemoFaculty()
    const result = await liveStudioService.getSnapshot(CANONICAL, 'faculty')
    expect(result.compatible).toBe(true)
  })

  it('a missing persisted session fails closed for reads and mutations', async () => {
    await expect(liveStudioService.getSnapshot(CANONICAL, 'student')).rejects.toBeTruthy()
    await expect(liveStudioService.dispatch(CANONICAL, 'student', { type: 'chat_sent', payload: { body: 'blocked' } })).rejects.toBeTruthy()
    expect(readState(CANONICAL)?.events ?? []).toHaveLength(0)
  })

  it('a wrong-role call fails closed even with a valid Student session', async () => {
    await signInDemoStudent()
    await expect(liveStudioService.getSnapshot(CANONICAL, 'faculty')).rejects.toBeTruthy()
    await expect(liveStudioService.getSummary(CANONICAL, 'faculty')).rejects.toBeTruthy()
    await expect(liveStudioService.reset(CANONICAL, 'faculty')).rejects.toBeTruthy()
  })

  it('a sessionId is never identity proof and never authorizes a non-canonical id', async () => {
    await signInDemoFaculty()
    await expect(liveStudioService.dispatch('ses-chem-b', 'faculty', { type: 'session_started' })).rejects.toMatchObject({ code: 'studio_session_unavailable' })
    const result = await liveStudioService.getSnapshot('ses-chem-b', 'faculty')
    expect(result.compatible).toBe(false)
    expect(result.snapshot).toBeNull()
    expect(result.reason).toContain('existing class and live-room tools')
  })

  it('subscription is a no-op for an incompatible session', async () => {
    await signInDemoFaculty()
    const off = liveStudioService.subscribe('ses-chem-b', 'faculty', () => {})
    expect(typeof off).toBe('function')
    expect(off()).toBeUndefined()
  })

  /* ── Acceptance remediation R16: identity failures are surfaced ─────────── */

  it('R16 subscription throws for a missing session instead of silently no-op-ing', () => {
    expect(() => liveStudioService.subscribe(CANONICAL, 'student', () => {})).toThrow(
      expect.objectContaining({ name: 'ServiceError' }),
    )
  })

  it('R16 subscription throws for a valid session of the wrong role', async () => {
    await signInDemoStudent()
    expect(() => liveStudioService.subscribe(CANONICAL, 'faculty', () => {})).toThrow(
      expect.objectContaining({ name: 'ServiceError' }),
    )
  })

  it('recorded classroom state holds no auth token, password or session envelope', async () => {
    await signInDemoStudent()
    await liveStudioService.dispatch(CANONICAL, 'student', { type: 'chat_sent', payload: { body: 'No secrets' } })
    const raw = JSON.stringify(readState(CANONICAL))
    for (const forbidden of ['token', 'password', 'credential', 'mustChangePassword', 'expiresAt', 'vyuh.session']) {
      expect(raw.includes(forbidden)).toBe(false)
    }
  })

  it('every service operation routes through the existing ownWorkspace gate', () => {
    const code = sources([
      'src/services/mock/liveStudio.js',
      'src/services/mock/liveSessionState.js',
      'src/services/mock/liveStudioCompatibility.js',
      'src/services/mock/liveStudioMetrics.js',
    ])
    expect(code.includes("from './ownWorkspace.js'")).toBe(true)
    expect(code.includes('requireSessionWorkspace(role)')).toBe(true)
    // Count the four gated public operations plus the guarded subscription.
    expect((code.match(/requireSessionWorkspace\(role\)/g) ?? []).length).toBeGreaterThanOrEqual(5)
  })

  it('introduces no second identity system, preview token or auth workaround', () => {
    const code = sources([
      'src/services/mock/liveStudio.js',
      'src/services/mock/liveSessionState.js',
      'src/mock-data/liveStudio.js',
      'src/contracts/liveStudio.js',
      'src/features/live/hooks/useSharedSession.js',
      'src/features/live/components/StudioShell.jsx',
      'src/features/live/components/ClassroomMirror.jsx',
      'src/features/live/components/StudentClassroom.jsx',
    ])
    for (const forbidden of ['previewToken', 'preview_token', 'demoBypass', 'specialAuth', 'localStorage.clear', 'getUserMedia', 'getDisplayMedia', 'new WebSocket', 'EventSource', 'readPersistedSession']) {
      expect(code.includes(forbidden)).toBe(false)
    }
    expect(code.includes('vyuh.session')).toBe(false)
  })

  it('never edits the protected identity gate', () => {
    const code = readFileSync(resolve(ROOT, 'src/services/mock/ownWorkspace.js'), 'utf8')
    expect(code.includes('export function requireSessionWorkspace')).toBe(true)
    expect(code.includes('DEMO_IDENTITIES')).toBe(true)
    expect(code.includes('readPersistedSession()')).toBe(true)
  })

  /* ── R22 CONFIRMED PRODUCT DECISION ────────────────────────────────────────
     The product owner confirmed that seeded demo participants, chat and
     questions are intentionally shared with ALL authenticated, correctly-roled
     users of ses-rot-b — demo AND institute-issued. This is NOT a demo-data
     leak. The existing fail-closed role/session gate remains mandatory, and the
     service deliberately never branches on `demo` vs `issued` workspace kind.
     No production change was needed; these tests lock the decision in. */

  /** @param {any} snapshot */
  function expectSeededClassroom(snapshot) {
    expect(snapshot.sessionId).toBe(CANONICAL)
    expect(snapshot.participants.filter((person) => person.source === 'seeded').length).toBeGreaterThan(0)
    expect(snapshot.chat.filter((line) => line.source === 'seeded').length).toBeGreaterThan(0)
    expect(snapshot.questions.filter((question) => question.source === 'seeded').length).toBeGreaterThan(0)
    expect(snapshot.prototypeNotice).toBe(PROTOTYPE_NOTICE)
  }

  it('R22 demo and institute-issued Student both see the seeded canonical classroom', async () => {
    await signInDemoStudent()
    const demo = await liveStudioService.getSnapshot(CANONICAL, 'student')
    expect(demo.compatible).toBe(true)
    expectSeededClassroom(demo.snapshot)

    clearIdentityCompletely()
    await signInIssuedStudent()
    const issued = await liveStudioService.getSnapshot(CANONICAL, 'student')
    expect(issued.compatible).toBe(true)
    expectSeededClassroom(issued.snapshot)
    expect(issued.snapshot.participants.filter((person) => person.source === 'seeded').length)
      .toBe(demo.snapshot.participants.filter((person) => person.source === 'seeded').length)
  })

  it('R22 demo and institute-issued Faculty both see the seeded canonical classroom', async () => {
    await signInDemoFaculty()
    const demo = await liveStudioService.getSnapshot(CANONICAL, 'faculty')
    expect(demo.compatible).toBe(true)
    expectSeededClassroom(demo.snapshot)

    clearIdentityCompletely()
    await signInIssuedFaculty()
    const issued = await liveStudioService.getSnapshot(CANONICAL, 'faculty')
    expect(issued.compatible).toBe(true)
    expectSeededClassroom(issued.snapshot)
  })

  it('R22 an issued account can read and record events in the shared classroom', async () => {
    await signInIssuedStudent()
    const before = await liveStudioService.getSnapshot(CANONICAL, 'student')
    const after = await liveStudioService.dispatch(CANONICAL, 'student', {
      type: 'chat_sent', payload: { body: 'Issued student mock line' },
    })
    expect(after.revision).toBe(before.snapshot.revision + 1)
    expect(after.chat.some((line) => line.body === 'Issued student mock line' && line.source === 'recorded')).toBe(true)
    expect(after.participants.some((person) => person.source === 'seeded')).toBe(true)
  })

  it('R22 seeded data keeps seeded_demo provenance and never claims verified results', async () => {
    await signInIssuedStudent()
    const result = await liveStudioService.getSnapshot(CANONICAL, 'student')
    const summary = await liveStudioService.getSummary(CANONICAL, 'student')
    expect(summary.notice).toBe(PROTOTYPE_NOTICE)
    expect(result.metadata.provenanceLabels).toEqual({ ...PROVENANCE_LABELS })
    const byKey = (key) => summary.metrics.find((item) => item.key === key)
    expect(byKey('seeded_roster').provenance).toBe('seeded_demo')
    expect(byKey('chat_seeded').provenance).toBe('seeded_demo')
    expect(byKey('questions_seeded').provenance).toBe('seeded_demo')
    expect(byKey('attendance_view').display).toBe('Unavailable')
    expect(JSON.stringify(summary)).not.toContain('Verified attendance results')
  })

  it('R22 unauthenticated and expired sessions still fail closed', async () => {
    await expect(liveStudioService.getSnapshot(CANONICAL, 'student')).rejects.toBeTruthy()
    const session = await signInDemoStudent()
    expirePersistedSession(session)
    await expect(liveStudioService.getSnapshot(CANONICAL, 'student')).rejects.toBeTruthy()
    await expect(liveStudioService.dispatch(CANONICAL, 'student', { type: 'chat_sent', payload: { body: 'blocked' } })).rejects.toBeTruthy()
  })

  it('R22 wrong-role sessions remain rejected for demo and issued identities', async () => {
    await signInDemoStudent()
    await expect(liveStudioService.getSnapshot(CANONICAL, 'faculty')).rejects.toBeTruthy()
    clearIdentityCompletely()
    await signInIssuedStudent()
    await expect(liveStudioService.getSnapshot(CANONICAL, 'faculty')).rejects.toBeTruthy()
    await expect(liveStudioService.getSummary(CANONICAL, 'faculty')).rejects.toBeTruthy()
  })

  it('R22 non-canonical session ids stay incompatible for issued accounts too', async () => {
    await signInIssuedFaculty()
    for (const id of ['ses-chem-b', 'cls-optics-2', 'ses-rot-rec']) {
      const result = await liveStudioService.getSnapshot(id, 'faculty')
      expect(result.compatible).toBe(false)
      expect(result.snapshot).toBeNull()
      expect(result.sessionId).toBe(id)
    }
    await expect(liveStudioService.dispatch('ses-chem-b', 'faculty', { type: 'session_started' }))
      .rejects.toMatchObject({ code: 'studio_session_unavailable' })
  })

  it('R22 the service never branches on demo vs issued workspace kind', () => {
    const code = codeOnly(readFileSync(resolve(ROOT, 'src/services/mock/liveStudio.js'), 'utf8'))
    /* Any one of these would silently special-case issued or demo identities. */
    for (const discriminator of [
      'demoSessionWorkspace', 'demoStudentWorkspace', 'demoFacultyWorkspace',
      'isIssuedStudent', 'denyDemoRecord', 'isMockMode', 'previewToken',
      "kind === 'demo'", "kind === 'issued'",
    ]) {
      expect(code.includes(discriminator)).toBe(false)
    }
    /* All five public operations use the SAME existing fail-closed gate. */
    expect((code.match(/requireSessionWorkspace\(role\)/g) ?? []).length).toBe(5)
  })
})
