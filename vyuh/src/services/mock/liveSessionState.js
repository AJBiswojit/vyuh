/**
 * VYUH LIVE STUDIO — single shared mock classroom engine (Option B).
 *
 * ONE browser context holds ONE authenticated identity. This module owns a
 * separate, versioned classroom key per sessionId:
 *     vyuh.mock.liveStudio.<sessionId>.v1
 * It is NOT the auth key (`vyuh.session`), contains no tokens/passwords/credentials/
 * session envelopes, and never calls localStorage.clear(). Session ids are never
 * used as identity proof: every service call goes through ownWorkspace.js first.
 *
 * Synchronization:
 *   - createEventEmitter() fans out to every subscriber in the SAME tab (a
 *     BroadcastChannel does not deliver to the object that posted).
 *   - a guarded BroadcastChannel, with a `storage` fallback, carries the same
 *     snapshot to OTHER tabs of the SAME origin and SAME signed-in identity.
 *     No backend, WebSocket, EventSource or real media transport is involved.
 *
 * Deterministic conflict resolution (acceptance R7 / R8):
 *   Every snapshot carries an `epoch` (incremented on each reset) and a
 *   `revision` (incremented on each recorded event). Incoming snapshots are
 *   totally ordered by (epoch, revision):
 *     epoch <  current epoch   -> reject (pre-reset state is never resurrected)
 *     epoch >  current epoch   -> accept (a reset, even at revision 0)
 *     same epoch, lower rev    -> reject (stale)
 *     same epoch, higher rev   -> accept (newer)
 *     same epoch, equal rev    -> identical eventIds: duplicate, ignore;
 *                                different eventIds: MERGE by replaying the
 *                                union of recorded events in a deterministic
 *                                (at, id) order over a fresh initial state.
 *   A merged snapshot is published at max(revision) + 1, so both tabs converge
 *   on one canonical log instead of silently losing each other's events.
 *
 * localStorage failure handling (acceptance R9):
 *   The in-memory copy is written first. A failing setItem leaves an older copy
 *   on disk, so reads compare (epoch, revision) and always return the NEWEST of
 *   memory and disk. The browser storage path is unchanged when it works.
 */
import { createEventEmitter } from '../../mock-data/index.js'
import { createInitialState, reduce, sweepPresence } from './liveStudioReducer.js'

export const STORAGE_PREFIX = 'vyuh.mock.liveStudio.'
const SUFFIX = '.v1'
const VERSION = 1
const MAX_EVENTS = 400
const PRESENCE_TTL_MS = 90_000

/** In-process fallback for private mode, SSR and blocked storage. */
const memory = new Map()
const emitters = new Map()
const channels = new Map()
let storageBound = false

/** @param {string} sessionId */
export function storageKeyFor(sessionId) {
  return `${STORAGE_PREFIX}${encodeURIComponent(sessionId)}${SUFFIX}`
}

function browserLike() {
  return typeof window !== 'undefined' && typeof window.addEventListener === 'function'
}

/** Parse only the ordering fields, without trusting the rest of the payload. */
function rank(raw) {
  try {
    const value = JSON.parse(raw)
    return {
      epoch: Number.isInteger(value?.epoch) && value.epoch >= 0 ? value.epoch : 0,
      revision: Number.isFinite(value?.revision) ? value.revision : -1,
    }
  } catch { return { epoch: -1, revision: -1 } }
}

/** @param {{epoch:number,revision:number}} a @param {{epoch:number,revision:number}} b */
function newerOrEqual(a, b) {
  return a.epoch > b.epoch || (a.epoch === b.epoch && a.revision >= b.revision)
}

function readRaw(key) {
  const inMemory = memory.get(key) ?? null
  try {
    if (typeof localStorage !== 'undefined' && localStorage) {
      const persisted = localStorage.getItem(key)
      if (persisted) {
        /* A failed setItem leaves a stale copy on disk. Never let it win over
           the newer in-memory fallback; a genuinely newer cross-tab write on
           disk still wins. */
        if (!inMemory || newerOrEqual(rank(inMemory), rank(persisted))) return inMemory
        return persisted
      }
    }
  } catch { /* private mode / SSR -> memory only */ }
  return inMemory
}

function writeRaw(key, value) {
  memory.set(key, value)
  try {
    if (typeof localStorage !== 'undefined' && localStorage) localStorage.setItem(key, value)
  } catch { /* keep the in-memory copy; readRaw compares ordering fields */ }
}

function removeRaw(key) {
  memory.delete(key)
  try {
    if (typeof localStorage !== 'undefined' && localStorage) localStorage.removeItem(key)
  } catch { /* readRaw compares epoch, so a stale disk copy cannot win */ }
}

/** @param {unknown} value @param {string} sessionId */
function isSnapshot(value, sessionId) {
  if (!value || typeof value !== 'object') return false
  const candidate = /** @type {any} */ (value)
  return candidate.version === VERSION
    && candidate.sessionId === sessionId
    && Array.isArray(candidate.events) && candidate.events.length <= MAX_EVENTS
    && Array.isArray(candidate.eventIds) && candidate.eventIds.length <= MAX_EVENTS
    && Array.isArray(candidate.chat)
    && Array.isArray(candidate.questions)
    && Array.isArray(candidate.polls)
    && Array.isArray(candidate.participants)
    && Array.isArray(candidate.resources)
    && Array.isArray(candidate.whiteboard?.shapes)
    && Number.isFinite(candidate.revision) && candidate.revision >= 0
    /* Pre-remediation snapshots had no epoch; treat them as epoch 0. */
    && (candidate.epoch === undefined || (Number.isInteger(candidate.epoch) && candidate.epoch >= 0))
    && typeof candidate.setup === 'object'
    && typeof candidate.media === 'object'
}

/** @param {any} value @param {string} sessionId */
function normalizeSnapshot(value, sessionId) {
  return {
    ...value,
    version: VERSION,
    sessionId,
    epoch: Number.isInteger(value.epoch) && value.epoch >= 0 ? value.epoch : 0,
    revision: Number.isFinite(value.revision) ? value.revision : 0,
    events: Array.isArray(value.events) ? value.events : [],
    eventIds: Array.isArray(value.eventIds) ? value.eventIds : [],
  }
}

/** @param {string} sessionId */
export function readState(sessionId) {
  const raw = readRaw(storageKeyFor(sessionId))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!isSnapshot(parsed, sessionId)) return null
    return sweepPresence(normalizeSnapshot(parsed, sessionId), Date.now(), PRESENCE_TTL_MS)
  } catch { return null }
}

/** @param {string} sessionId */
export function ensureState(sessionId) {
  const existing = readState(sessionId)
  if (existing) return existing
  const created = createInitialState({ sessionId, at: new Date().toISOString() })
  return writeState(sessionId, created)
}

/** @param {string} sessionId @param {any} state */
export function writeState(sessionId, state) {
  const normalized = normalizeSnapshot({ ...state, version: VERSION, sessionId }, sessionId)
  writeRaw(storageKeyFor(sessionId), JSON.stringify(normalized))
  return normalized
}

/** @param {string} sessionId @param {any} listener */
function emitterFor(sessionId) {
  let emitter = emitters.get(sessionId)
  if (!emitter) {
    emitter = createEventEmitter()
    emitters.set(sessionId, emitter)
  }
  return emitter
}

/** @param {string} sessionId @param {any} snapshot */
function postChannel(sessionId, snapshot) {
  const entry = channels.get(sessionId)
  if (entry?.channel) {
    try { entry.channel.postMessage({ sessionId, key: storageKeyFor(sessionId), snapshot }) } catch { /* closed channel */ }
  }
}

/** @param {string} sessionId @param {any} snapshot */
function publish(sessionId, snapshot) {
  emitterFor(sessionId).emit(snapshot)
  postChannel(sessionId, snapshot)
}

/**
 * Union two recorded event logs by id and sort by (at, id) so every tab
 * replays exactly the same sequence regardless of message arrival order.
 * @param {any[]} a @param {any[]} b
 */
function mergeEvents(a, b) {
  const byId = new Map()
  for (const event of [...a, ...b]) {
    if (event && typeof event.id === 'string' && !byId.has(event.id)) byId.set(event.id, event)
  }
  return [...byId.values()]
    .sort((left, right) => {
      const byTime = String(left.at ?? '').localeCompare(String(right.at ?? ''))
      return byTime !== 0 ? byTime : String(left.id).localeCompare(String(right.id))
    })
    .slice(-MAX_EVENTS)
}

/**
 * Rebuild the canonical classroom state from a merged event log. The reducer
 * is pure, so identical logs always produce identical state in every tab.
 * @param {string} sessionId @param {any[]} events @param {number} epoch
 * @param {number} revision @param {string} updatedAt
 */
function replay(sessionId, events, epoch, revision, updatedAt) {
  let state = createInitialState({ sessionId, at: updatedAt })
  for (const event of events) state = reduce(state, event)
  return {
    ...state,
    version: VERSION,
    sessionId,
    epoch,
    revision,
    updatedAt,
    events,
    eventIds: events.map((event) => event.id),
  }
}

/**
 * Decide what to do with a snapshot arriving from another tab. Never mutates
 * the incoming object. @returns {{ action: 'reject'|'accept'|'merge', snapshot?: any }}
 * @param {string} sessionId @param {any|null} current @param {any} incoming
 */
function resolveConflict(sessionId, current, incoming) {
  if (!current) return { action: 'accept', snapshot: incoming }

  const currentEpoch = current.epoch ?? 0
  const incomingEpoch = incoming.epoch ?? 0
  /* A pre-reset snapshot can never resurrect discarded events, whatever its
     revision. A newer epoch is a reset and wins even at revision 0. */
  if (incomingEpoch < currentEpoch) return { action: 'reject' }
  if (incomingEpoch > currentEpoch) return { action: 'accept', snapshot: incoming }

  if (incoming.revision < current.revision) return { action: 'reject' }
  if (incoming.revision > current.revision) return { action: 'accept', snapshot: incoming }

  const currentIds = new Set(current.eventIds ?? [])
  const incomingIds = new Set(incoming.eventIds ?? [])
  const sameLog = currentIds.size === incomingIds.size
    && [...incomingIds].every((id) => currentIds.has(id))
  /* Equal (epoch, revision) with the same event log is an exact duplicate:
     ignore it so echoes cannot double-apply or loop. */
  if (sameLog) return { action: 'reject' }

  /* Concurrent equal-revision edits: keep BOTH tabs' recorded events. */
  const events = mergeEvents(current.events ?? [], incoming.events ?? [])
  const updatedAt = [current.updatedAt, incoming.updatedAt]
    .filter((value) => typeof value === 'string')
    .sort()
    .at(-1) ?? new Date().toISOString()
  const merged = sweepPresence(
    replay(sessionId, events, currentEpoch, Math.max(current.revision, incoming.revision) + 1, updatedAt),
    Date.now(),
    PRESENCE_TTL_MS,
  )
  return { action: 'merge', snapshot: merged }
}

/** @param {string} sessionId @param {any} rawIncoming */
function receiveExternal(sessionId, rawIncoming) {
  if (!isSnapshot(rawIncoming, sessionId)) return
  const incoming = normalizeSnapshot(rawIncoming, sessionId)
  const current = readState(sessionId)
  const decision = resolveConflict(sessionId, current, incoming)
  if (decision.action === 'reject') return
  const next = decision.snapshot
  writeState(sessionId, next)
  emitterFor(sessionId).emit(next)
  /* Only a merge needs an extra cross-tab announcement: its higher revision
     makes the other tab accept it, and accept/reject paths never re-broadcast. */
  if (decision.action === 'merge') postChannel(sessionId, next)
}

function bindStorage() {
  if (storageBound || !browserLike()) return
  storageBound = true
  window.addEventListener('storage', (event) => {
    if (!event.key || !event.key.startsWith(STORAGE_PREFIX) || !event.key.endsWith(SUFFIX) || !event.newValue) return
    try {
      const payload = JSON.parse(event.newValue)
      const sessionId = decodeURIComponent(event.key.slice(STORAGE_PREFIX.length, -SUFFIX.length))
      receiveExternal(sessionId, payload.snapshot ?? payload)
    } catch { /* ignore malformed cross-tab payloads */ }
  })
}

/** @param {string} sessionId */
function openChannel(sessionId) {
  let entry = channels.get(sessionId)
  if (!entry) {
    entry = { channel: null, refs: 0 }
    channels.set(sessionId, entry)
  }
  entry.refs += 1
  if (entry.channel || !browserLike() || typeof BroadcastChannel === 'undefined') return
  try {
    const channel = new BroadcastChannel(storageKeyFor(sessionId))
    channel.onmessage = (message) => {
      const data = message?.data
      if (data?.sessionId === sessionId) receiveExternal(sessionId, data.snapshot ?? data)
    }
    entry.channel = channel
  } catch { /* storage fallback remains active */ }
}

/** @param {string} sessionId */
function releaseChannel(sessionId) {
  const entry = channels.get(sessionId)
  if (!entry) return
  entry.refs -= 1
  if (entry.refs > 0) return
  if (entry.channel) {
    try { entry.channel.close() } catch { /* already closed */ }
    entry.channel = null
  }
  channels.delete(sessionId)
}

/**
 * Subscribe to the shared snapshot. Returns a synchronous unsubscribe function
 * so React effects can clean up deterministically.
 * @param {string} sessionId
 * @param {(snapshot: any) => void} listener
 * @returns {() => void}
 */
export function subscribe(sessionId, listener) {
  const unsubscribe = emitterFor(sessionId).subscribe(listener)
  bindStorage()
  openChannel(sessionId)
  return () => { unsubscribe(); releaseChannel(sessionId) }
}

/**
 * Append one recorded mock event and publish the resulting snapshot. Duplicate
 * ids are ignored so cross-tab echoes can never double-apply a change.
 * @param {string} sessionId
 * @param {import('../../contracts/liveStudio.js').StudioEvent} event
 */
export function applyEvent(sessionId, event) {
  const current = ensureState(sessionId)
  if (current.eventIds.includes(event.id)) return current
  const reduced = reduce(current, event)
  const updated = {
    ...reduced,
    epoch: current.epoch ?? 0,
    revision: current.revision + 1,
    updatedAt: event.at,
    events: [...current.events, event].slice(-MAX_EVENTS),
    eventIds: [...current.eventIds, event.id].slice(-MAX_EVENTS),
  }
  const written = writeState(sessionId, updated)
  publish(sessionId, written)
  return written
}

/**
 * Discard this session's classroom state only. The epoch is incremented BEFORE
 * the old state is removed, so the reset outranks any in-flight pre-reset
 * snapshot in every other tab. Never touches the auth key.
 * @param {string} sessionId
 */
export function resetSession(sessionId) {
  const current = readState(sessionId)
  const epoch = (current?.epoch ?? 0) + 1
  removeRaw(storageKeyFor(sessionId))
  const fresh = {
    ...createInitialState({ sessionId, at: new Date().toISOString() }),
    epoch,
  }
  const written = writeState(sessionId, fresh)
  publish(sessionId, written)
  return written
}

/** Test seam: inject a browser-native cross-tab message without a real browser. */
export function receiveCrossTab(sessionId, snapshot) {
  receiveExternal(sessionId, snapshot)
}
