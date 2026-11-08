import { beforeEach, describe, expect, it } from 'vitest'
import {
  STORAGE_PREFIX, storageKeyFor, readState, ensureState, writeState, applyEvent,
  subscribe, resetSession, receiveCrossTab,
} from '../../src/services/mock/liveSessionState.js'
import { createInitialState } from '../../src/services/mock/liveStudioReducer.js'

const SESSION = 'ses-rot-b'
const AT = '2026-11-07T10:00:00.000Z'
let counter = 0
/** @param {string} type @param {Object} [payload] */
function event(type, payload = {}) {
  counter += 1
  return { id: `shared-${counter}`, type, at: AT, actor: { kind: 'faculty', id: 'faculty', label: 'Faculty' }, detail: type, payload }
}

/** Remove only the classroom key. Never clear the whole storage. */
function clearStudio() {
  localStorage.removeItem(storageKeyFor(SESSION))
  resetSession(SESSION)
}

/** Temporarily make persistence fail, then restore the real Storage method. */
function withBrokenSetItem(run) {
  const descriptor = Object.getOwnPropertyDescriptor(localStorage, 'setItem')
  const original = localStorage.setItem
  let overridden = false
  try {
    Object.defineProperty(localStorage, 'setItem', {
      configurable: true,
      writable: true,
      value: () => { throw new Error('QuotaExceededError') },
    })
    overridden = true
  } catch { /* host forbids overriding; the stale-disk assertions still apply */ }
  try { return run() } finally {
    if (overridden) {
      if (descriptor) Object.defineProperty(localStorage, 'setItem', descriptor)
      else Object.defineProperty(localStorage, 'setItem', { configurable: true, writable: true, value: original })
    }
  }
}

describe('VYUH LIVE STUDIO — single shared classroom state (Option B)', () => {
  beforeEach(clearStudio)

  it('uses a separate, versioned classroom key, never the auth key', () => {
    expect(storageKeyFor(SESSION)).toBe('vyuh.mock.liveStudio.ses-rot-b.v1')
    expect(storageKeyFor(SESSION)).not.toBe('vyuh.session')
    expect(STORAGE_PREFIX).toBe('vyuh.mock.liveStudio.')
  })

  it('starts from a fresh snapshot with zero recorded events', () => {
    const state = ensureState(SESSION)
    expect(state.version).toBe(1)
    expect(state.revision).toBe(0)
    expect(state.events).toEqual([])
    expect(state.polls).toEqual([])
    expect(state.whiteboard.shapes).toEqual([])
    expect(state.status).toBe('scheduled')
  })

  it('bumps the revision and appends the event exactly once', () => {
    const next = applyEvent(SESSION, event('scene_changed', { scene: 'whiteboard' }))
    expect(next.revision).toBe(1)
    expect(next.activeScene).toBe('whiteboard')
    expect(next.events).toHaveLength(1)
    expect(readState(SESSION).revision).toBe(1)
  })

  it('ignores a duplicate event id so cross-tab echoes cannot double-apply', () => {
    const first = event('chat_sent', { body: 'One' })
    applyEvent(SESSION, first)
    const replay = applyEvent(SESSION, first)
    expect(replay.revision).toBe(1)
    expect(replay.events).toHaveLength(1)
  })

  it('fans out to every same-tab subscriber and cleans up on unsubscribe', () => {
    const seenA = []
    const seenB = []
    const offA = subscribe(SESSION, (snapshot) => seenA.push(snapshot.revision))
    const offB = subscribe(SESSION, (snapshot) => seenB.push(snapshot.revision))
    applyEvent(SESSION, event('session_started'))
    offA()
    applyEvent(SESSION, event('media_toggled', { key: 'micOn', value: true }))
    offB()
    expect(seenA).toEqual([1])
    expect(seenB).toEqual([1, 2])
  })

  it('accepts a newer cross-tab revision and rejects a stale one', () => {
    const state = applyEvent(SESSION, event('session_started'))
    receiveCrossTab(SESSION, { ...state, revision: 42, activeScene: 'split' })
    expect(readState(SESSION).revision).toBe(42)
    expect(readState(SESSION).activeScene).toBe('split')
    receiveCrossTab(SESSION, { ...state, revision: 2 })
    expect(readState(SESSION).revision).toBe(42)
  })

  it('rejects malformed cross-tab payloads without corrupting state', () => {
    applyEvent(SESSION, event('session_started'))
    receiveCrossTab(SESSION, { nonsense: true })
    receiveCrossTab(SESSION, { ...createInitialState({ sessionId: 'other', at: AT }), revision: 999 })
    expect(readState(SESSION).revision).toBe(1)
  })

  it('reset clears recorded events and keeps the auth key untouched', () => {
    localStorage.setItem('vyuh.session', 'sentinel')
    applyEvent(SESSION, event('chat_sent', { body: 'Hello' }))
    resetSession(SESSION)
    expect(readState(SESSION).events).toEqual([])
    expect(readState(SESSION).revision).toBe(0)
    expect(localStorage.getItem('vyuh.session')).toBe('sentinel')
    localStorage.removeItem('vyuh.session')
  })

  it('persists no authentication secrets in the classroom envelope', () => {
    const state = applyEvent(SESSION, event('chat_sent', { body: 'No secrets here' }))
    const raw = JSON.stringify(readState(SESSION) ?? state)
    for (const forbidden of ['password', 'token', 'credential', 'mustChangePassword', 'expiresAt', 'vyuh.session', 'DEMO_PASSWORD']) {
      expect(raw).not.toContain(forbidden)
    }
  })

  it('writeState normalizes version and session id', () => {
    const state = ensureState(SESSION)
    const written = writeState(SESSION, { ...state, version: 99, sessionId: 'wrong' })
    expect(written.version).toBe(1)
    expect(written.sessionId).toBe(SESSION)
  })

  /* ── Acceptance remediation R7: deterministic conflict resolution ────────── */

  it('R7 merges two tabs that independently change state at the same revision', () => {
    const local = applyEvent(SESSION, event('chat_sent', { body: 'Tab A message' }))
    const remoteEvent = {
      id: 'remote-1', type: 'scene_changed', at: AT,
      actor: { kind: 'faculty', id: 'faculty', label: 'Faculty' },
      detail: 'scene_changed', payload: { scene: 'presentation' },
    }
    const remote = { ...local, events: [remoteEvent], eventIds: ['remote-1'], activeScene: 'presentation', updatedAt: AT }
    receiveCrossTab(SESSION, remote)

    const merged = readState(SESSION)
    expect(merged.eventIds).toContain(local.events[0].id)
    expect(merged.eventIds).toContain('remote-1')
    expect(merged.events).toHaveLength(2)
    expect(merged.revision).toBeGreaterThan(1)
    /* Both tabs' changes survive the deterministic event-log replay. */
    expect(merged.activeScene).toBe('presentation')
    expect(merged.chat.some((line) => line.body === 'Tab A message')).toBe(true)

    /* Re-delivering the same remote snapshot is now stale, not a second merge. */
    receiveCrossTab(SESSION, remote)
    expect(readState(SESSION).revision).toBe(merged.revision)
    expect(readState(SESSION).events).toHaveLength(2)
  })

  it('R7 ignores an identical duplicate cross-tab snapshot', () => {
    const state = applyEvent(SESSION, event('scene_changed', { scene: 'whiteboard' }))
    receiveCrossTab(SESSION, { ...state })
    expect(readState(SESSION).revision).toBe(1)
    expect(readState(SESSION).events).toHaveLength(1)
  })

  it('R7 rejects a stale same-epoch snapshot', () => {
    const state = applyEvent(SESSION, event('scene_changed', { scene: 'whiteboard' }))
    receiveCrossTab(SESSION, { ...state, revision: 0, activeScene: 'camera' })
    expect(readState(SESSION).revision).toBe(1)
    expect(readState(SESSION).activeScene).toBe('whiteboard')
  })

  /* ── Acceptance remediation R8: reset epoch ─────────────────────────────── */

  it('R8 applies a reset received after a higher revision', () => {
    applyEvent(SESSION, event('scene_changed', { scene: 'camera' }))
    applyEvent(SESSION, event('chat_sent', { body: 'one' }))
    const before = readState(SESSION)
    expect(before.revision).toBe(2)

    const resetMessage = { ...createInitialState({ sessionId: SESSION, at: AT }), epoch: before.epoch + 1, revision: 0 }
    receiveCrossTab(SESSION, resetMessage)
    expect(readState(SESSION).revision).toBe(0)
    expect(readState(SESSION).epoch).toBe(before.epoch + 1)
    expect(readState(SESSION).events).toEqual([])
  })

  it('R8 never resurrects a pre-reset snapshot, even with a huge revision', () => {
    const preReset = applyEvent(SESSION, event('chat_sent', { body: 'before reset' }))
    const epoch = preReset.epoch
    const fresh = resetSession(SESSION)
    expect(fresh.epoch).toBe(epoch + 1)

    receiveCrossTab(SESSION, { ...preReset, revision: 999 })
    const after = readState(SESSION)
    expect(after.epoch).toBe(epoch + 1)
    expect(after.revision).toBe(0)
    expect(after.events).toEqual([])
    expect(after.chat.some((line) => line.body === 'before reset')).toBe(false)
  })

  it('R8 increments the epoch on every reset', () => {
    const first = resetSession(SESSION)
    const second = resetSession(SESSION)
    expect(second.epoch).toBe(first.epoch + 1)
  })

  it('R8 treats a pre-remediation snapshot without an epoch as epoch 0', () => {
    const legacy = { ...ensureState(SESSION) }
    delete legacy.epoch
    expect(writeState(SESSION, legacy).epoch).toBe(0)
  })

  /* ── Acceptance remediation R9: localStorage failure ────────────────────── */

  it('R9 returns the newest in-memory state when setItem throws, then persists again', () => {
    withBrokenSetItem(() => {
      const first = applyEvent(SESSION, event('scene_changed', { scene: 'whiteboard' }))
      expect(first.revision).toBe(1)
      /* Read immediately after the failed write. */
      expect(readState(SESSION).revision).toBe(1)
      /* Another state update must build on the newest state, not the stale disk copy. */
      const second = applyEvent(SESSION, event('session_started'))
      expect(second.revision).toBe(2)
      expect(readState(SESSION).revision).toBe(2)
      expect(readState(SESSION).events).toHaveLength(2)
      expect(readState(SESSION).activeScene).toBe('whiteboard')
    })

    /* Normal browser persistence resumes once storage is healthy again. */
    const third = applyEvent(SESSION, event('chat_sent', { body: 'persisted again' }))
    expect(third.revision).toBe(3)
    expect(JSON.parse(localStorage.getItem(storageKeyFor(SESSION))).revision).toBe(3)
  })
})
