import { beforeEach, describe, expect, it, vi } from 'vitest'
import { liveStudioService } from '../../src/services/mock/liveStudio.js'
import { resetSession, readState } from '../../src/services/mock/liveSessionState.js'
import { createInitialState, reduce } from '../../src/services/mock/liveStudioReducer.js'
import { selectClassroomView } from '../../src/features/learning/hooks/useLiveClassroom.js'
import { CANONICAL_STUDIO_SESSION_ID } from '../../src/mock-data/index.js'
import { signInDemoStudent, signInDemoFaculty, signOut } from '../helpers/workspaceIdentity.js'
import { SESSION_STORAGE_KEY, sessionStateStorage } from '../../src/shared/lib/sessionPersistence.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

const SESSION = CANONICAL_STUDIO_SESSION_ID
/** @param {string} role @param {string} type @param {Object} [payload] @param {Object} [options] */
function send(role, type, payload = {}, options = {}) {
  return liveStudioService.dispatch(SESSION, role, { type, payload, ...options })
}

async function use(role) {
  signOut()
  sessionStateStorage.removeItem(SESSION_STORAGE_KEY)
  localStorage.removeItem(SESSION_STORAGE_KEY)
  if (role === 'faculty') await signInDemoFaculty()
  else await signInDemoStudent()
}

describe('VYUH LIVE STUDIO — shared engagement domains', () => {
  beforeEach(() => { resetSession(SESSION) })

  it('sends, pins and hides Faculty chat messages', async () => {
    await use('faculty')
    let snapshot = await send('faculty', 'chat_sent', { body: 'Welcome to the studio' })
    const line = snapshot.chat[snapshot.chat.length - 1]
    expect(line.source).toBe('recorded')
    expect(line.author).toBe('Faculty')
    snapshot = await send('faculty', 'chat_pinned', { id: line.id })
    expect(snapshot.chat.find((item) => item.id === line.id).pinned).toBe(true)
    snapshot = await send('faculty', 'chat_hidden', { id: line.id })
    expect(snapshot.chat.find((item) => item.id === line.id).hidden).toBe(true)
  })

  it('submits questions, approves them and keeps seeded upvotes separate', async () => {
    await use('student')
    let snapshot = await send('student', 'question_added', { body: 'Why this pivot?' })
    const question = snapshot.questions[snapshot.questions.length - 1]
    expect(question.upvotes).toBe(0)
    snapshot = await send('student', 'question_upvoted', { id: question.id })
    expect(snapshot.questions.find((item) => item.id === question.id).upvotes).toBe(1)
    await use('faculty')
    snapshot = await send('faculty', 'question_approved', { id: question.id })
    expect(snapshot.questions.find((item) => item.id === question.id).status).toBe('approved')
    expect(snapshot.questions.find((item) => item.source === 'seeded').seedUpvotes).toBeGreaterThan(0)
  })

  it('creates a poll with zero votes, records a Student vote and closes it', async () => {
    await use('faculty')
    let snapshot = await send('faculty', 'poll_created', { question: 'Ready?', options: ['Yes', 'No'] })
    const poll = snapshot.polls[0]
    expect(poll.options.every((option) => option.votes === 0)).toBe(true)
    await use('student')
    snapshot = await send('student', 'poll_voted', { pollId: poll.id, optionId: poll.options[0].id })
    expect(snapshot.polls[0].options[0].votes).toBe(1)
    expect(snapshot.polls[0].voterIds).toContain('You')
    await use('faculty')
    snapshot = await send('faculty', 'poll_closed', { pollId: poll.id })
    expect(snapshot.polls[0].status).toBe('closed')
  })

  it('records Student join, hand raise, hand lower and leave', async () => {
    await use('student')
    let snapshot = await send('student', 'participant_joined', { participantId: 'current-student', name: 'You' })
    expect(snapshot.participants.find((person) => person.id === 'current-student').source).toBe('mock_joined')
    snapshot = await send('student', 'hand_raised', { participantId: 'current-student' })
    expect(snapshot.participants.find((person) => person.id === 'current-student').handRaised).toBe(true)
    snapshot = await send('student', 'hand_lowered', { participantId: 'current-student' })
    expect(snapshot.participants.find((person) => person.id === 'current-student').handRaised).toBe(false)
    snapshot = await send('student', 'participant_left', { participantId: 'current-student' })
    expect(snapshot.participants.find((person) => person.id === 'current-student').state).toBe('left')
  })

  it('labels Faculty Mirror participant simulation as simulated, never as a real Student', async () => {
    await use('faculty')
    const options = { simulateAs: 'Aditi Rath (simulated participant)', detail: 'Labelled seeded-participant simulation.' }
    let snapshot = await send('faculty', 'chat_sent', { body: 'Could you repeat that?' }, options)
    const line = snapshot.chat[snapshot.chat.length - 1]
    expect(line.author).toContain('simulated participant')
    expect(snapshot.events[snapshot.events.length - 1].actor.kind).toBe('simulated')
    snapshot = await send('faculty', 'participant_joined', { participantId: 'sim-1', name: 'Aditi Rath' }, options)
    expect(snapshot.participants.find((person) => person.id === 'sim-1').source).toBe('simulated')
  })

  it('Faculty can mute a simulated participant', async () => {
    await use('faculty')
    const snapshot = await send('faculty', 'participant_muted', { participantId: 'sim-1', muted: true }, { simulateAs: 'Aditi Rath (simulated participant)' })
    expect(snapshot.participants.find((person) => person.id === 'sim-1').muted).toBe(true)
  })

  it('adds and opens resources without fabricating seeded opens', async () => {
    await use('faculty')
    let snapshot = await send('faculty', 'resource_added', { title: 'Extra notes', kind: 'Link', detail: 'Prototype' })
    const added = snapshot.resources[snapshot.resources.length - 1]
    expect(added.opens).toBe(0)
    expect(snapshot.resources.find((item) => item.source === 'seeded').opens).toBe(0)
    snapshot = await send('faculty', 'resource_opened', { id: added.id })
    expect(snapshot.resources.find((item) => item.id === added.id).opens).toBe(1)
  })

  it('keeps the same revision in the persisted state and the returned snapshot', async () => {
    await use('faculty')
    const snapshot = await send('faculty', 'tool_selected', { tool: 'polls' })
    expect(snapshot.revision).toBe(readState(SESSION).revision)
    expect(snapshot.toolbox.activeTool).toBe('polls')
    expect(snapshot.activeScene).toBe('split')
  })

  it('reset removes every recorded event while preserving the shared key', async () => {
    await use('faculty')
    await send('faculty', 'chat_sent', { body: 'One' })
    const fresh = await liveStudioService.reset(SESSION, 'faculty')
    expect(fresh.events).toEqual([])
    expect(fresh.chat.every((line) => line.source === 'seeded')).toBe(true)
  })

  /* ── Acceptance remediation R12: Student moderation visibility ──────────── */

  it('R12 approving a question makes it visible in the Student Classroom', () => {
    const at = new Date().toISOString()
    const actor = (kind) => ({ kind, id: kind, label: kind === 'faculty' ? 'Faculty' : 'You' })
    let state = createInitialState({ sessionId: SESSION, at })
    state = reduce(state, {
      id: 'q-pending-1', type: 'question_added', at,
      actor: actor('student'), detail: 'question_added', payload: { body: 'Hidden until approved' },
    })

    /* Faculty keeps the pending queue and its moderation action. */
    expect(state.questions.some((question) => question.id === 'q-pending-1' && question.status === 'pending')).toBe(true)
    /* Students do not see it yet. */
    expect(selectClassroomView(state, null).visibleQuestions.some((question) => question.id === 'q-pending-1')).toBe(false)

    state = reduce(state, {
      id: 'approve-1', type: 'question_approved', at,
      actor: actor('faculty'), detail: 'question_approved', payload: { id: 'q-pending-1' },
    })
    /* After Faculty approval the same question is visible in the Student view. */
    expect(selectClassroomView(state, null).visibleQuestions.some((question) => question.id === 'q-pending-1')).toBe(true)
    expect(selectClassroomView(state, null).visibleQuestions.every((question) => question.status === 'approved')).toBe(true)
  })

  /* ── R22 confirmed decision: seeded / mock-joined / simulated stay distinct ─ */

  it('R22 seeded, mock-joined and simulated participants remain distinct', async () => {
    await use('student')
    await send('student', 'participant_joined', { participantId: 'r22-real', name: 'You' })
    await use('faculty')
    const snapshot = await send('faculty', 'participant_joined', { participantId: 'r22-sim', name: 'Demo Seat' }, { simulateAs: 'Ishita P. (simulated participant)' })

    const sources = new Set(snapshot.participants.map((person) => person.source))
    expect(sources.has('seeded')).toBe(true)
    expect(sources.has('mock_joined')).toBe(true)
    expect(sources.has('simulated')).toBe(true)
    expect(snapshot.participants.find((person) => person.id === 'r22-real').source).toBe('mock_joined')
    expect(snapshot.participants.find((person) => person.id === 'r22-sim').source).toBe('simulated')

    const summary = await liveStudioService.getSummary(SESSION, 'faculty')
    expect(summary.metrics.find((item) => item.key === 'seeded_roster').provenance).toBe('seeded_demo')
    expect(summary.metrics.find((item) => item.key === 'mock_joins').display).toBe('1')
    expect(summary.metrics.find((item) => item.key === 'simulated_joins').display).toBe('1')
  })
})
