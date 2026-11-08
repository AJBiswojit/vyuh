import { describe, expect, it } from 'vitest'
import { createInitialState, reduce, sweepPresence, eventLog } from '../../src/services/mock/liveStudioReducer.js'
import { STUDIO_SCENES, CANONICAL_STUDIO_SESSION_ID, PROTOTYPE_NOTICE } from '../../src/mock-data/index.js'

const AT = '2026-11-07T10:00:00.000Z'
let counter = 0
/** @param {import('../../src/contracts/liveStudio.js').StudioSnapshot} state @param {string} type @param {Object} [payload] @param {Object} [actorOverride] */
function apply(state, type, payload = {}, actorOverride = {}) {
  counter += 1
  const event = {
    id: `reduce-${counter}`, type, at: AT,
    actor: { kind: 'faculty', id: 'faculty', label: 'Faculty', ...actorOverride },
    detail: type, payload,
  }
  return reduce(state, event)
}

function fresh() { return createInitialState({ sessionId: CANONICAL_STUDIO_SESSION_ID, at: AT }) }

describe('VYUH LIVE STUDIO — pure reducer', () => {
  it('creates an honest initial snapshot', () => {
    const state = fresh()
    expect(state.status).toBe('scheduled')
    expect(state.activeScene).toBe('camera')
    expect(state.polls).toEqual([])
    expect(state.whiteboard.shapes).toEqual([])
    expect(state.chat.every((line) => line.source === 'seeded')).toBe(true)
    expect(state.questions.every((question) => question.source === 'seeded')).toBe(true)
    expect(state.participants.every((person) => person.source === 'seeded')).toBe(true)
    expect(state.prototypeNotice).toBe(PROTOTYPE_NOTICE)
    expect(state.startedAt).toBeNull()
  })

  it('accepts all five scenes and ignores an unknown scene', () => {
    let state = fresh()
    for (const scene of STUDIO_SCENES) {
      state = apply(state, 'scene_changed', { scene: scene.id })
      expect(state.activeScene).toBe(scene.id)
    }
    expect(apply(state, 'scene_changed', { scene: 'not-a-scene' }).activeScene).toBe(state.activeScene)
  })

  it('toggles each simulated media control without touching others', () => {
    let state = fresh()
    for (const key of ['micOn', 'cameraOn', 'screenSharing', 'recording']) {
      state = apply(state, 'media_toggled', { key, value: true })
      expect(state.media[key]).toBe(true)
    }
    expect(Object.values(state.media).every(Boolean)).toBe(true)
    expect(apply(state, 'media_toggled', { key: 'unknown', value: true }).media).toEqual(state.media)
  })

  it('records Go Live and End Session and clears recording on end', () => {
    let state = apply(fresh(), 'media_toggled', { key: 'recording', value: true })
    state = apply(state, 'session_started')
    expect(state.status).toBe('live')
    expect(state.startedAt).toBe(AT)
    state = apply(state, 'session_ended')
    expect(state.status).toBe('ended')
    expect(state.endedAt).toBe(AT)
    expect(state.media.recording).toBe(false)
  })

  it('saves setup fields but keeps the seeded catalogue state', () => {
    const state = apply(fresh(), 'setup_saved', { title: 'New title', description: 'A description', recordingPreference: true })
    expect(state.setup.title).toBe('New title')
    expect(state.setup.description).toBe('A description')
    expect(state.setup.recordingPreference).toBe(true)
    expect(state.setup.catalogueStatus).toBe('live')
  })

  it('selects a tool, maps it to a scene and changes slides safely', () => {
    let state = apply(fresh(), 'tool_selected', { tool: 'resources' })
    expect(state.toolbox.activeTool).toBe('resources')
    expect(state.activeScene).toBe('content')
    state = apply(state, 'slide_changed', { index: 99 })
    expect(state.toolbox.slideIndex).toBe(3)
    expect(apply(state, 'tool_selected', { tool: 'unknown' }).toolbox.activeTool).toBe('resources')
  })

  it('adds, undoes, erases and clears whiteboard shapes', () => {
    let state = fresh()
    state = apply(state, 'whiteboard_shape', { type: 'rect', x: 10, y: 10, x2: 40, y2: 40, text: '' })
    state = apply(state, 'whiteboard_shape', { type: 'pen', x: 400, y: 400, x2: 500, y2: 500, text: '' })
    expect(state.whiteboard.shapes).toHaveLength(2)
    state = apply(state, 'whiteboard_undo')
    expect(state.whiteboard.shapes).toHaveLength(1)
    expect(state.whiteboard.redo).toHaveLength(1)
    state = apply(state, 'whiteboard_erase', { x: 0, y: 0, x2: 60, y2: 60 })
    expect(state.whiteboard.shapes).toHaveLength(0)
    state = apply(state, 'whiteboard_shape', { type: 'text', x: 5, y: 5, x2: 6, y2: 6, text: 'Note' })
    state = apply(state, 'whiteboard_clear')
    expect(state.whiteboard.shapes).toHaveLength(0)
    expect(state.whiteboard.redo.length).toBeGreaterThan(1)
    expect(apply(state, 'whiteboard_tool', { tool: 'eraser' }).whiteboard.tool).toBe('eraser')
    expect(apply(state, 'whiteboard_tool', { tool: 'unknown' }).whiteboard.tool).toBe(state.whiteboard.tool)
  })

  it('records chat separately from seeded lines and supports pin and hide', () => {
    const before = fresh().chat.length
    let state = apply(fresh(), 'chat_sent', { body: 'A recorded line' }, { kind: 'student', label: 'You' })
    const line = state.chat[state.chat.length - 1]
    expect(state.chat).toHaveLength(before + 1)
    expect(line.source).toBe('recorded')
    expect(line.author).toBe('You')
    state = apply(state, 'chat_pinned', { id: line.id })
    expect(state.chat.find((item) => item.id === line.id).pinned).toBe(true)
    state = apply(state, 'chat_hidden', { id: line.id })
    expect(state.chat.find((item) => item.id === line.id).hidden).toBe(true)
    expect(apply(state, 'chat_sent', { body: '   ' }).chat).toHaveLength(before + 1)
  })

  it('keeps seeded upvotes separate from live votes and supports approval', () => {
    let state = fresh()
    const seeded = state.questions[0]
    expect(seeded.seedUpvotes).toBeGreaterThan(0)
    state = apply(state, 'question_added', { body: 'A new question' }, { kind: 'student', label: 'You' })
    const question = state.questions[state.questions.length - 1]
    expect(question.upvotes).toBe(0)
    state = apply(state, 'question_upvoted', { id: question.id }, { kind: 'student', label: 'You' })
    expect(state.questions.find((item) => item.id === question.id).upvotes).toBe(1)
    state = apply(state, 'question_upvoted', { id: question.id }, { kind: 'student', label: 'You' })
    expect(state.questions.find((item) => item.id === question.id).upvotes).toBe(0)
    state = apply(state, 'question_approved', { id: question.id })
    expect(state.questions.find((item) => item.id === question.id).status).toBe('approved')
    expect(state.questions.find((item) => item.id === seeded.id).upvotes).toBe(seeded.seedUpvotes)
  })

  it('creates polls with zero votes, records one vote per actor and closes them', () => {
    let state = apply(fresh(), 'poll_created', { question: 'Ready?', options: ['Yes', 'No'] })
    const poll = state.polls[0]
    expect(poll.options.every((option) => option.votes === 0)).toBe(true)
    expect(apply(state, 'poll_created', { question: 'Too few', options: ['Only one'] }).polls).toHaveLength(1)
    state = apply(state, 'poll_voted', { pollId: poll.id, optionId: poll.options[0].id }, { kind: 'student', label: 'You' })
    expect(state.polls[0].options[0].votes).toBe(1)
    state = apply(state, 'poll_voted', { pollId: poll.id, optionId: poll.options[0].id }, { kind: 'student', label: 'You' })
    expect(state.polls[0].options[0].votes).toBe(1)
    state = apply(state, 'poll_closed', { pollId: poll.id })
    expect(state.polls[0].status).toBe('closed')
    expect(apply(state, 'poll_voted', { pollId: poll.id, optionId: poll.options[0].id }).polls[0].options[0].votes).toBe(1)
  })

  it('labels participant provenance and never relabels a seeded row', () => {
    let state = fresh()
    const seededId = state.participants[0].id
    state = apply(state, 'participant_joined', { participantId: seededId, name: 'Changed' }, { kind: 'simulated', label: 'Sim' })
    expect(state.participants.find((person) => person.id === seededId).source).toBe('seeded')
    state = apply(state, 'participant_joined', { participantId: 'real-1', name: 'You' }, { kind: 'student', label: 'You' })
    expect(state.participants.find((person) => person.id === 'real-1').source).toBe('mock_joined')
    state = apply(state, 'participant_joined', { participantId: 'sim-1', name: 'Demo Seat' }, { kind: 'simulated', label: 'Demo Seat' })
    expect(state.participants.find((person) => person.id === 'sim-1').source).toBe('simulated')
    state = apply(state, 'hand_raised', { participantId: 'real-1' })
    expect(state.participants.find((person) => person.id === 'real-1').handRaised).toBe(true)
    state = apply(state, 'hand_lowered', { participantId: 'real-1' })
    expect(state.participants.find((person) => person.id === 'real-1').handRaised).toBe(false)
    state = apply(state, 'participant_muted', { participantId: 'sim-1', muted: true }, { kind: 'simulated', label: 'Demo Seat' })
    expect(state.participants.find((person) => person.id === 'sim-1').muted).toBe(true)
    state = apply(state, 'participant_left', { participantId: 'real-1' })
    expect(state.participants.find((person) => person.id === 'real-1').state).toBe('left')
  })

  it('upserts a labelled simulated row for a hand raised before a join', () => {
    const state = apply(fresh(), 'hand_raised', { participantId: 'sim-new' }, { kind: 'simulated', label: 'Aditi Rath (simulated participant)' })
    const row = state.participants.find((person) => person.id === 'sim-new')
    expect(row.source).toBe('simulated')
    expect(row.handRaised).toBe(true)
  })

  it('records resource additions and opens without inventing seeded opens', () => {
    let state = fresh()
    const seeded = state.resources[0]
    expect(seeded.opens).toBe(0)
    state = apply(state, 'resource_opened', { id: seeded.id })
    expect(state.resources.find((item) => item.id === seeded.id).opens).toBe(1)
    state = apply(state, 'resource_added', { title: 'New link', kind: 'Link', detail: 'Prototype' })
    const added = state.resources[state.resources.length - 1]
    expect(added.source).toBe('recorded')
    expect(added.opens).toBe(0)
  })

  it('ignores unknown event types', () => {
    const state = fresh()
    expect(apply(state, 'not_a_real_event')).toEqual(state)
  })

  it('expires mock rows by TTL but never seeded demo rows', () => {
    let state = apply(fresh(), 'participant_joined', { participantId: 'real-1', name: 'You' }, { kind: 'student', label: 'You' })
    const seededBefore = state.participants.filter((person) => person.source === 'seeded')
    const swept = sweepPresence(state, Date.parse(AT) + 200_000, 90_000)
    expect(swept.participants.find((person) => person.id === 'real-1').state).toBe('left')
    expect(swept.participants.filter((person) => person.source === 'seeded')).toEqual(seededBefore)
  })

  it('builds the room log only from recorded events', () => {
    const state = fresh()
    expect(eventLog(state)).toEqual([])
  })
})
