/**
 * VYUH LIVE STUDIO — pure reducer. No storage, no timers, no identity, no React.
 * `reduce(state, event)` is deterministic, so it can be exercised directly.
 * Every classroom change is an event; the state engine appends the event and
 * bumps the revision. Seeded values are never rewritten into "measured" values.
 */
import {
  STUDIO_SCENES, STUDIO_TOOLS, SEEDED_PARTICIPANTS, SEEDED_CHAT, SEEDED_QUESTIONS,
  SEEDED_SLIDES, SEEDED_RESOURCES, PROTOTYPE_NOTICE, canonicalSessionMetadata,
} from '../../mock-data/index.js'

const MAX_ITEMS = 120
const VALID_SCENES = new Set(STUDIO_SCENES.map((scene) => scene.id))
const VALID_TOOLS = new Set(STUDIO_TOOLS.map((tool) => tool.id))
const WHITEBOARD_TOOLS = new Set(['pen', 'eraser', 'rect', 'ellipse', 'line', 'text'])

/** @param {unknown} value @param {number} max */
function text(value, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}
/** @param {unknown} value @param {number} min @param {number} max */
function number(value, min, max) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : min
}

/** @param {{ sessionId: string, at: string }} input */
export function createInitialState({ sessionId, at }) {
  const meta = canonicalSessionMetadata()
  return {
    version: 1,
    sessionId,
    revision: 0,
    /* `epoch` is owned by liveSessionState.js: it increments on every reset so
       a reset outranks any in-flight pre-reset snapshot in another tab. */
    epoch: 0,
    updatedAt: at,
    setup: {
      title: meta?.title ?? 'Untitled studio session',
      subjectId: meta?.subjectId ?? '',
      subjectName: meta?.subjectName ?? '',
      batchId: meta?.batchId ?? '',
      batchName: meta?.batchName ?? '',
      description: '',
      catalogueStatus: meta?.catalogueStatus ?? 'scheduled',
      recordingPreference: false,
    },
    /* Recorded studio lifecycle starts at scheduled even when the seeded
       catalogue says live. Start class and End class are the only sources of the
       completion state; nothing is inferred from the fixture. */
    status: /** @type {const} */ ('scheduled'),
    activeScene: /** @type {const} */ ('camera'),
    media: { micOn: false, cameraOn: false, screenSharing: false, recording: false },
    toolbox: { activeTool: 'whiteboard', slideIndex: 0 },
    chat: SEEDED_CHAT.map((line) => ({ ...line })),
    questions: SEEDED_QUESTIONS.map((question) => ({ ...question, voterIds: [] })),
    polls: [],
    participants: SEEDED_PARTICIPANTS.map((person) => ({ ...person })),
    resources: SEEDED_RESOURCES.map((resource) => ({ ...resource })),
    whiteboard: { shapes: [], redo: [], tool: 'pen' },
    slides: SEEDED_SLIDES.map((slide) => ({ ...slide, bullets: [...slide.bullets] })),
    events: [],
    eventIds: [],
    startedAt: null,
    endedAt: null,
    prototypeNotice: PROTOTYPE_NOTICE,
  }
}

/** @param {import('../../contracts/liveStudio.js').StudioSnapshot} state @param {Record<string, unknown>} patch */
function next(state, patch) { return { ...state, ...patch } }
/** @param {string} id */
function byId(id) { return (item) => item.id === id }

/**
 * A hand/mute simulation can target a seeded row that has not been mock-joined
 * yet. Create the row with the correct provenance instead of silently dropping
 * the event, so every visible control produces a visible state change.
 * @param {import('../../contracts/liveStudio.js').StudioSnapshot} state
 * @param {string} id
 * @param {import('../../contracts/liveStudio.js').StudioEvent} event
 */
function withParticipantRow(state, id, event) {
  if (state.participants.some(byId(id))) return state.participants
  const label = event.actor.label || 'Simulated Seat'
  const source = event.actor.kind === 'simulated' ? 'simulated' : 'mock_joined'
  return [...state.participants, {
    id, name: label, initials: label.split(/\s+/).map((part) => part[0] ?? '').join('').slice(0, 2).toUpperCase() || 'ST',
    source: /** @type {any} */ (source), state: /** @type {const} */ ('present'), handRaised: false, muted: false,
    lastSeenAt: event.at, joinedAt: event.at,
  }].slice(-MAX_ITEMS)
}

/**
 * Apply one recorded event. Unknown types are ignored rather than guessed, so a
 * stale payload can never invent classroom data.
 * @param {import('../../contracts/liveStudio.js').StudioSnapshot} state
 * @param {import('../../contracts/liveStudio.js').StudioEvent} event
 * @returns {import('../../contracts/liveStudio.js').StudioSnapshot}
 */
export function reduce(state, event) {
  const p = event.payload ?? {}
  const author = event.actor.label || (event.actor.kind === 'faculty' ? 'Faculty' : 'You')
  const at = event.at

  switch (event.type) {
    case 'setup_saved': {
      const setup = { ...state.setup }
      if (typeof p.title === 'string') setup.title = text(p.title, 160) || setup.title
      if (typeof p.subjectName === 'string') setup.subjectName = text(p.subjectName, 80)
      if (typeof p.batchName === 'string') setup.batchName = text(p.batchName, 80)
      if (typeof p.description === 'string') setup.description = text(p.description, 500)
      if (typeof p.recordingPreference === 'boolean') setup.recordingPreference = p.recordingPreference
      return next(state, { setup })
    }
    case 'scene_changed': {
      if (!VALID_SCENES.has(String(p.scene))) return state
      return next(state, { activeScene: /** @type {any} */ (p.scene) })
    }
    case 'media_toggled': {
      const key = String(p.key)
      if (!(key in state.media)) return state
      return next(state, { media: { ...state.media, [key]: Boolean(p.value) } })
    }
    case 'tool_selected': {
      if (!VALID_TOOLS.has(String(p.tool))) return state
      const tool = STUDIO_TOOLS.find((item) => item.id === p.tool)
      return next(state, {
        toolbox: { ...state.toolbox, activeTool: String(p.tool) },
        activeScene: tool ? /** @type {any} */ (tool.scene) : state.activeScene,
      })
    }
    case 'slide_changed': {
      const index = number(p.index, 0, state.slides.length - 1)
      return next(state, { toolbox: { ...state.toolbox, slideIndex: Math.round(index) } })
    }
    case 'session_started':
      return next(state, { status: 'live', startedAt: state.startedAt ?? at, endedAt: null })
    case 'session_ended':
      return next(state, { status: 'ended', endedAt: at, media: { ...state.media, recording: false } })

    case 'whiteboard_shape': {
      if (!WHITEBOARD_TOOLS.has(String(p.type))) return state
      const shape = {
        id: event.id,
        type: String(p.type),
        x: number(p.x, 0, 1000), y: number(p.y, 0, 1000),
        x2: number(p.x2, 0, 1000), y2: number(p.y2, 0, 1000),
        text: text(p.text, 160), at,
      }
      return next(state, { whiteboard: { ...state.whiteboard, shapes: [...state.whiteboard.shapes, shape].slice(-MAX_ITEMS), redo: [] } })
    }
    case 'whiteboard_undo': {
      const shapes = [...state.whiteboard.shapes]
      if (shapes.length === 0) return state
      const removed = shapes.pop()
      return next(state, { whiteboard: { ...state.whiteboard, shapes, redo: [...state.whiteboard.redo, [removed]].slice(-MAX_ITEMS) } })
    }
    case 'whiteboard_erase': {
      const x1 = Math.min(number(p.x, 0, 1000), number(p.x2, 0, 1000))
      const x2 = Math.max(number(p.x, 0, 1000), number(p.x2, 0, 1000))
      const y1 = Math.min(number(p.y, 0, 1000), number(p.y2, 0, 1000))
      const y2 = Math.max(number(p.y, 0, 1000), number(p.y2, 0, 1000))
      const hit = (shape) => Math.min(shape.x, shape.x2) <= x2 && Math.max(shape.x, shape.x2) >= x1
        && Math.min(shape.y, shape.y2) <= y2 && Math.max(shape.y, shape.y2) >= y1
      const removed = state.whiteboard.shapes.filter(hit)
      if (removed.length === 0) return state
      return next(state, {
        whiteboard: {
          ...state.whiteboard,
          shapes: state.whiteboard.shapes.filter((shape) => !hit(shape)),
          redo: [...state.whiteboard.redo, removed].slice(-MAX_ITEMS),
        },
      })
    }
    case 'whiteboard_clear': {
      if (state.whiteboard.shapes.length === 0) return state
      return next(state, { whiteboard: { ...state.whiteboard, shapes: [], redo: [...state.whiteboard.redo, state.whiteboard.shapes].slice(-MAX_ITEMS) } })
    }
    case 'whiteboard_tool': {
      if (!WHITEBOARD_TOOLS.has(String(p.tool))) return state
      return next(state, { whiteboard: { ...state.whiteboard, tool: String(p.tool) } })
    }

    case 'chat_sent': {
      const body = text(p.body, 500)
      if (!body) return state
      const line = {
        id: event.id, author, role: event.actor.kind === 'faculty' ? 'faculty' : 'student',
        body, sentAt: at, source: /** @type {const} */ ('recorded'),
        pinned: false, hidden: false,
      }
      return next(state, { chat: [...state.chat, line].slice(-MAX_ITEMS) })
    }
    case 'chat_pinned':
      return next(state, { chat: state.chat.map((line) => line.id === p.id ? { ...line, pinned: !line.pinned } : line) })
    case 'chat_hidden':
      return next(state, { chat: state.chat.map((line) => line.id === p.id ? { ...line, hidden: !line.hidden } : line) })

    case 'question_added': {
      const body = text(p.body, 500)
      if (!body) return state
      const question = {
        id: event.id, author, body, status: /** @type {const} */ ('pending'),
        seedUpvotes: 0, voterIds: [], upvotes: 0, createdAt: at, approvedAt: null,
        source: /** @type {const} */ ('recorded'),
      }
      return next(state, { questions: [...state.questions, question].slice(-MAX_ITEMS) })
    }
    case 'question_approved':
      return next(state, { questions: state.questions.map((q) => q.id === p.id ? { ...q, status: 'approved', approvedAt: at } : q) })
    case 'question_upvoted': {
      let changed = false
      const questions = state.questions.map((q) => {
        if (q.id !== p.id) return q
        changed = true
        const voters = new Set(q.voterIds)
        if (voters.has(author)) voters.delete(author); else voters.add(author)
        const voterIds = [...voters]
        return { ...q, voterIds, upvotes: q.seedUpvotes + voterIds.length }
      })
      return changed ? next(state, { questions }) : state
    }

    case 'poll_created': {
      const question = text(p.question, 200)
      const labels = Array.isArray(p.options) ? p.options.map((value) => text(value, 120)).filter(Boolean).slice(0, 6) : []
      if (!question || labels.length < 2) return state
      const poll = {
        id: event.id, question, options: labels.map((label, index) => ({ id: `${event.id}-opt-${index}`, label, votes: 0 })),
        status: /** @type {const} */ ('open'), voterIds: [], createdAt: at, closedAt: null,
      }
      return next(state, { polls: [...state.polls, poll].slice(-MAX_ITEMS) })
    }
    case 'poll_voted': {
      let changed = false
      const polls = state.polls.map((poll) => {
        if (poll.id !== p.pollId || poll.status !== 'open' || poll.voterIds.includes(author)) return poll
        const option = poll.options.find((item) => item.id === p.optionId)
        if (!option) return poll
        changed = true
        return {
          ...poll,
          voterIds: [...poll.voterIds, author],
          options: poll.options.map((item) => item.id === option.id ? { ...item, votes: item.votes + 1 } : item),
        }
      })
      return changed ? next(state, { polls }) : state
    }
    case 'poll_closed':
      return next(state, { polls: state.polls.map((poll) => poll.id === p.pollId ? { ...poll, status: 'closed', closedAt: at } : poll) })

    case 'participant_joined': {
      const id = text(p.participantId, 80) || author
      const label = text(p.name, 80) || author
      const kind = event.actor.kind === 'simulated' ? 'simulated' : 'mock_joined'
      const existing = state.participants.find(byId(id))
      if (existing) {
        return next(state, { participants: state.participants.map((person) => person.id === id ? { ...person, state: 'present', lastSeenAt: at, joinedAt: person.joinedAt ?? at } : person) })
      }
      const person = {
        id, name: label, initials: label.split(/\s+/).map((part) => part[0] ?? '').join('').slice(0, 2).toUpperCase() || 'ST',
        source: /** @type {any} */ (kind), state: /** @type {const} */ ('present'), handRaised: false, muted: false,
        lastSeenAt: at, joinedAt: at,
      }
      return next(state, { participants: [...state.participants, person].slice(-MAX_ITEMS) })
    }
    case 'participant_left': {
      const rows = withParticipantRow(state, text(p.participantId, 80) || author, event)
      const id = text(p.participantId, 80) || author
      return next(state, { participants: rows.map((person) => person.id === id ? { ...person, state: 'left', handRaised: false, lastSeenAt: at } : person) })
    }
    case 'hand_raised': {
      const id = text(p.participantId, 80) || author
      const rows = withParticipantRow(state, id, event)
      return next(state, { participants: rows.map((person) => person.id === id ? { ...person, handRaised: true, state: 'hand_raised', lastSeenAt: at } : person) })
    }
    case 'hand_lowered': {
      const id = text(p.participantId, 80) || author
      const rows = withParticipantRow(state, id, event)
      return next(state, { participants: rows.map((person) => person.id === id ? { ...person, handRaised: false, state: 'present', lastSeenAt: at } : person) })
    }
    case 'participant_muted': {
      const id = text(p.participantId, 80) || author
      const rows = withParticipantRow(state, id, event)
      return next(state, { participants: rows.map((person) => person.id === id ? { ...person, muted: Boolean(p.muted), lastSeenAt: at } : person) })
    }

    case 'resource_added': {
      const title = text(p.title, 120)
      if (!title) return state
      const resource = { id: event.id, title, kind: text(p.kind, 60) || 'Link', detail: text(p.detail, 240), opens: 0, source: /** @type {const} */ ('recorded') }
      return next(state, { resources: [...state.resources, resource].slice(-MAX_ITEMS) })
    }
    case 'resource_opened':
      return next(state, { resources: state.resources.map((resource) => resource.id === p.id ? { ...resource, opens: resource.opens + 1 } : resource) })

    default:
      return state
  }
}

/**
 * Best-effort presence sweep. Seeded roster rows are never expired (they are
 * labelled demo data); only mock-joined/simulated rows have a TTL.
 * @param {import('../../contracts/liveStudio.js').StudioSnapshot} state
 * @param {number} now
 * @param {number} ttlMs
 */
export function sweepPresence(state, now, ttlMs = 90_000) {
  let changed = false
  const participants = state.participants.map((person) => {
    if (person.source === 'seeded' || person.state === 'left') return person
    if (now - Date.parse(person.lastSeenAt) <= ttlMs) return person
    changed = true
    return { ...person, state: /** @type {const} */ ('left'), handRaised: false }
  })
  return changed ? next(state, { participants }) : state
}

/** Human-readable room log lines, derived only from recorded events. */
export function eventLog(state) {
  return [...state.events].reverse().map((event) => ({
    id: event.id, at: event.at, label: event.detail,
    kind: event.actor.kind, type: event.type,
  }))
}
