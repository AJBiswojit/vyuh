/**
 * VYUH LIVE STUDIO — the dedicated mock service.
 *
 * Every read, mutation and subscription passes the existing fail-closed gate
 * `requireSessionWorkspace(role)` from ownWorkspace.js. No method accepts an
 * identity from a caller, no preview token exists, and `sessionId` is never
 * treated as identity proof. The service never touches the auth key and never
 * writes credentials into classroom state.
 */
import { simulate } from '../../mock-data/index.js'
import { requireSessionWorkspace } from './ownWorkspace.js'
import { resolveStudioSession, assertCompatible } from './liveStudioCompatibility.js'
import { ensureState, applyEvent, subscribe, resetSession } from './liveSessionState.js'
import { buildSessionSummary } from './liveStudioMetrics.js'

let sequence = 0

function makeId() {
  sequence += 1
  const random = globalThis.crypto?.randomUUID?.()
  if (random) return `studio-${random}`
  return `studio-${Date.now()}-${sequence}-${Math.random().toString(36).slice(2, 9)}`
}

const DETAILS = {
  setup_saved: 'Session setup saved.',
  scene_changed: 'Broadcast scene changed.',
  media_toggled: 'Simulated control toggled.',
  tool_selected: 'Teaching tool selected.',
  slide_changed: 'Presentation slide changed.',
  session_started: 'Class started (recorded in this demo).',
  session_ended: 'Class ended (recorded in this demo).',
  whiteboard_shape: 'Whiteboard action recorded.',
  whiteboard_erase: 'Whiteboard strokes erased.',
  whiteboard_undo: 'Whiteboard action undone.',
  whiteboard_clear: 'Whiteboard cleared.',
  whiteboard_tool: 'Whiteboard tool selected.',
  chat_sent: 'Message posted to the session chat.',
  chat_pinned: 'Chat message pin changed.',
  chat_hidden: 'Chat message visibility changed.',
  question_added: 'Question submitted to the queue.',
  question_approved: 'Question approved by Faculty.',
  question_upvoted: 'Question vote changed.',
  poll_created: 'Poll created.',
  poll_voted: 'Poll response recorded.',
  poll_closed: 'Poll closed.',
  participant_joined: 'Mock classroom join recorded.',
  participant_left: 'Mock classroom leave recorded.',
  hand_raised: 'Hand raised.',
  hand_lowered: 'Hand lowered.',
  participant_muted: 'Simulated participant mute changed.',
  resource_added: 'Resource added.',
  resource_opened: 'Resource opened (mock).',
}

/** @param {'faculty'|'student'} role @param {{ type: string, payload?: Object, simulateAs?: string, detail?: string }} command */
function buildEvent(role, command) {
  const simulated = Boolean(command.simulateAs)
  const actor = {
    kind: simulated ? 'simulated' : role,
    id: simulated ? 'simulated' : role === 'faculty' ? 'faculty' : 'student',
    label: simulated ? String(command.simulateAs).slice(0, 80) : role === 'faculty' ? 'Faculty' : 'You',
  }
  return {
    id: makeId(),
    type: command.type,
    at: new Date().toISOString(),
    actor,
    detail: command.detail?.slice(0, 240) ?? DETAILS[command.type] ?? command.type,
    payload: command.payload ?? {},
  }
}

/** @type {import('../../contracts/liveStudio.js').LiveStudioService} */
export const liveStudioService = {
  /**
   * Read the shared snapshot OR an explicit, honest unavailable resolution.
   * Incompatible session ids never silently map onto the canonical session.
   */
  getSnapshot(sessionId, role) {
    return simulate(() => {
      requireSessionWorkspace(role)
      const resolution = resolveStudioSession(sessionId)
      if (!resolution.compatible) {
        return { compatible: false, sessionId: resolution.sessionId, reason: resolution.reason, metadata: null, snapshot: null }
      }
      return {
        compatible: true,
        sessionId: resolution.sessionId,
        reason: resolution.reason,
        metadata: resolution.metadata,
        snapshot: ensureState(resolution.sessionId),
      }
    })
  },

  /**
   * Subscription is synchronous and returns a cleanup function.
   *
   * R16: identity failures are NEVER swallowed. `requireSessionWorkspace(role)`
   * sits outside the try so a missing, expired, malformed or wrong-role session
   * throws its ServiceError to `useStudioSnapshot`, which surfaces it through
   * the existing query error state (the Studio/Classroom ErrorState panel).
   * Only a genuinely unsupported browser transport is non-fatal: the same-tab
   * in-memory emitter still works when BroadcastChannel cannot be created.
   */
  subscribe(sessionId, role, listener) {
    requireSessionWorkspace(role)
    const resolution = resolveStudioSession(sessionId)
    if (!resolution.compatible) return () => {}
    try {
      return subscribe(resolution.sessionId, listener)
    } catch (error) {
      if (error?.name === 'ServiceError') throw error
      return () => {}
    }
  },

  /** One typed command, always gated, always recorded as a mock event. */
  dispatch(sessionId, role, command) {
    return simulate(() => {
      requireSessionWorkspace(role)
      assertCompatible(sessionId)
      if (!command || typeof command.type !== 'string') throw new TypeError('A studio command type is required.')
      return applyEvent(sessionId, buildEvent(role, command))
    }, { min: 60, max: 180, faulty: false })
  },

  /** Provenance-aware summary; `attendance` is an explicitly labelled view. */
  getSummary(sessionId, role, options = {}) {
    return simulate(() => {
      requireSessionWorkspace(role)
      assertCompatible(sessionId)
      return buildSessionSummary(ensureState(sessionId), options)
    }, { min: 80, max: 220, faulty: false })
  },

  /** Discard classroom state for this session only. */
  reset(sessionId, role) {
    return simulate(() => {
      requireSessionWorkspace(role)
      assertCompatible(sessionId)
      return resetSession(sessionId)
    }, { min: 60, max: 160, faulty: false })
  },
}
