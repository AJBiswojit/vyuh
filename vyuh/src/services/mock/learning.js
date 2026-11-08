/**
 * Phase 6 mock service. Media is local and silent; presence, attention responses,
 * playback, notes, bookmarks, doubts and room membership are persisted writes.
 * Realtime events flow through mock-data/realtime.js, never through components.
 * @typedef {import('../../contracts/learning.js').LiveAttendanceState} LiveAttendanceState
 * @typedef {import('../../contracts/learning.js').PlaybackState} PlaybackState
 * @typedef {import('../../contracts/learning.js').RecordingDetail} RecordingDetail
 * @typedef {import('../../contracts/learning.js').DoubtThreadDetail} DoubtThreadDetail
 * @typedef {import('../../contracts/learning.js').StudyRoomDetail} StudyRoomDetail
 * @typedef {import('../../contracts/learning.js').LearningEvent} LearningEvent
 * @typedef {import('../../contracts/learning.js').QueueQuestion} QueueQuestion
 */
import {
  liveSessions, chatScripts, seedChat, seedQuestions, attendancePolicy, attendanceHistory,
  attendancePeriodLabel, activeAttendanceSeeds, recordings, recordingPlaybackSeeds,
  doubts as doubtFixtures, studyRooms, roomVisitors, simulate, clone,
  createEventEmitter, createMockClassChannel, createMockRoomChannel,
} from '../../mock-data/index.js'
import { applyAttention, buildAttendanceReport, completedChapterIds, createAttendanceState, gradeQuiz, settleAttendance, clamp } from '../../shared/lib/learningMath.js'
import { notFound, serviceError } from './errors.js'
import { demoStudentWorkspace } from './ownWorkspace.js'

const VERSION = 1
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const emptyStudent = 'stu-ananya'

/** @param {string} studentId */
function storageKey(studentId) { return `vyuh.mock.learning.${studentId || emptyStudent}.v${VERSION}` }

/**
 * @typedef {Object} StudentLearningStore
 * @property {Record<string,LiveAttendanceState>} attendance
 * @property {Record<string,PlaybackState>} playback
 * @property {Record<string,import('../../contracts/learning.js').QuizResult>} quizzes
 * @property {DoubtThreadDetail[]} doubts
 * @property {Record<string,boolean>} rooms
 * @property {Record<string,import('../../contracts/learning.js').ChatMessage[]>} chat
 * @property {Record<string,(Omit<QueueQuestion,'votedByMe'> & {voterIds:string[]})[]>} queue
 */

/** @param {string} studentId @returns {StudentLearningStore} */
function readStore(studentId) {
  const fallback = { attendance: {}, playback: {}, quizzes: {}, doubts: [], rooms: {}, chat: {}, queue: {} }
  try {
    const raw = localStorage.getItem(storageKey(studentId))
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (parsed?.version !== VERSION) return fallback
    return { ...fallback, ...parsed.data }
  } catch { return fallback }
}
/** @param {string} studentId @param {StudentLearningStore} store */
function writeStore(studentId, store) {
  try { localStorage.setItem(storageKey(studentId), JSON.stringify({ version: VERSION, data: store })) } catch { /* In-memory session continues. */ }
}
/** @param {string} key */
function numericFlag(key) {
  try { const value = Number(localStorage.getItem(key)); return Number.isFinite(value) && value > 0 ? value : undefined } catch { return undefined }
}
/**
 * Resolve the real recording fixture an ended class produced. Prefer the
 * session's `recordingId`; fall back to its seeded `joinUrl` only when that
 * URL already points at a recording. Never guess a default recording id.
 * @param {import('../../contracts/live.js').LiveSession} session
 */
function recordingIdFor(session) {
  if (session.status !== 'ended') return null
  if (typeof session.recordingId === 'string' && session.recordingId.length > 0) return session.recordingId
  const match = /^\/student\/recordings\/([^/?#]+)/.exec(session.joinUrl ?? '')
  return match ? match[1] : null
}

/** @param {string} sessionId */
function findSession(sessionId) {
  const session = liveSessions.find((item) => item.id === sessionId)
  if (!session) throw notFound('live session')
  return session
}
/** @param {string} recordingId */
function findRecording(recordingId) {
  const recording = recordings.find((item) => item.id === recordingId)
  if (!recording) throw notFound('recording')
  return recording
}

/** @type {Map<string,{emitter:ReturnType<typeof createEventEmitter>,channel:ReturnType<typeof createMockClassChannel>}>} */
const classChannels = new Map()
/** @type {Map<string,{emitter:ReturnType<typeof createEventEmitter>,channel:ReturnType<typeof createMockRoomChannel>,visitors:Set<string>}>} */
const roomChannels = new Map()

/** @param {string} sessionId @param {string} studentId */
function classKey(sessionId, studentId) { return `${sessionId}:${studentId}` }

/** @param {string} sessionId @param {string} studentId */
function ensureClassChannel(sessionId, studentId) {
  const key = classKey(sessionId, studentId)
  const existing = classChannels.get(key)
  if (existing) return existing
  const emitter = createEventEmitter()
  const channel = createMockClassChannel({
    sessionId,
    policy: attendancePolicy,
    chatScript: chatScripts,
    overrides: {
      attentionMinSeconds: numericFlag('vyuh.mock.attentionMinSeconds'),
      attentionMaxSeconds: numericFlag('vyuh.mock.attentionMaxSeconds'),
      presenceTickSeconds: numericFlag('vyuh.mock.presenceTickSeconds'),
      chatIntervalSeconds: numericFlag('vyuh.mock.chatIntervalSeconds'),
    },
    onPresenceTick: () => {
      const state = advancePresence(sessionId, studentId)
      if (state) emitter.emit({ type: 'presence', attendance: state })
    },
    onChat: (message) => {
      const store = readStore(studentId)
      store.chat[sessionId] = [...(store.chat[sessionId] ?? []), message].slice(-80)
      writeStore(studentId, store)
      emitter.emit({ type: 'chat', message })
    },
    onAttentionChallenge: (challenge) => {
      const store = readStore(studentId)
      const state = store.attendance[sessionId]
      if (!state) return
      store.attendance[sessionId] = { ...state, activeCheckId: challenge.id }
      writeStore(studentId, store)
      emitter.emit({ type: 'attention-challenge', challenge })
    },
    onAttentionExpired: (checkId) => {
      const state = resolveCheck(sessionId, studentId, checkId, 'missed')
      if (state) {
        emitter.emit({ type: 'attention-resolved', checkId })
        emitter.emit({ type: 'presence', attendance: state })
      }
    },
  })
  const entry = { emitter, channel }
  classChannels.set(key, entry)
  return entry
}

/** Settle visible time and persist. Internal realtime path: no simulated latency. @param {string} sessionId @param {string} studentId */
function advancePresence(sessionId, studentId) {
  const store = readStore(studentId)
  const state = store.attendance[sessionId]
  if (!state || !state.connected) return null
  const next = settleAttendance(state, findSession(sessionId), Date.now(), attendancePolicy)
  store.attendance[sessionId] = next
  writeStore(studentId, store)
  return clone(next)
}

/** @param {string} sessionId @param {string} studentId @param {string} checkId @param {'answered'|'missed'} outcome */
function resolveCheck(sessionId, studentId, checkId, outcome) {
  const store = readStore(studentId)
  const state = store.attendance[sessionId]
  if (!state || state.activeCheckId !== checkId) return null
  const settled = settleAttendance(state, findSession(sessionId), Date.now(), attendancePolicy)
  const next = applyAttention(settled, outcome, checkId, attendancePolicy, Date.now())
  store.attendance[sessionId] = next
  writeStore(studentId, store)
  return clone(next)
}

/** @param {string} sessionId @param {string} studentId */
function disconnectPresence(sessionId, studentId) {
  const entry = classChannels.get(classKey(sessionId, studentId))
  entry?.channel.stop()
  const store = readStore(studentId)
  const state = store.attendance[sessionId]
  if (!state) return
  let next = settleAttendance(state, findSession(sessionId), Date.now(), attendancePolicy)
  if (next.activeCheckId) next = applyAttention(next, 'missed', next.activeCheckId, attendancePolicy, Date.now())
  next = { ...next, connected: false, visible: false, leftAt: next.leftAt ?? new Date().toISOString() }
  store.attendance[sessionId] = next
  writeStore(studentId, store)
  entry?.emitter.emit({ type: 'presence', attendance: next })
}

/** @param {string} sessionId @param {string} studentId @returns {QueueQuestion[]} */
function readQueue(sessionId, studentId) {
  const store = readStore(studentId)
  const overrides = store.queue[sessionId] ?? []
  const seeds = seedQuestions.filter((question) => question.sessionId === sessionId).map((question) => ({ ...question, voterIds: [...question.voterIds] }))
  const merged = /** @type {(Omit<QueueQuestion,'votedByMe'> & {voterIds:string[]})[]} */ ([...seeds])
  for (const question of overrides) {
    const index = merged.findIndex((item) => item.id === question.id)
    if (index >= 0) merged[index] = question
    else merged.push(question)
  }
  return merged.map(({ voterIds, ...question }) => ({ ...question, upvotes: question.upvotes + voterIds.filter((id) => id !== question.studentId).length, votedByMe: voterIds.includes(studentId) }))
}
/** @param {string} sessionId @param {string} studentId @param {QueueQuestion & {voterIds?:string[]}} question */
function writeQuestion(sessionId, studentId, question) {
  const store = readStore(studentId)
  const { votedByMe: _votedByMe, ...rest } = question
  const existingSeed = seedQuestions.find((item) => item.id === question.id)
  const list = store.queue[sessionId] ?? []
  const index = list.findIndex((item) => item.id === question.id)
  const voterIds = question.voterIds ?? (existingSeed ? [...existingSeed.voterIds] : index >= 0 ? [...list[index].voterIds] : [])
  // `upvotes` in the read model already includes voters; persist the base count
  // so toggling a vote never double-counts it on the next read.
  const baseUpvotes = existingSeed?.upvotes ?? (index >= 0 ? list[index].upvotes : rest.upvotes)
  const stored = { ...rest, upvotes: baseUpvotes, voterIds }
  if (index >= 0) list[index] = stored
  else list.push(stored)
  store.queue[sessionId] = list
  writeStore(studentId, store)
}

/** @param {typeof recordings[number]} fixture @param {string} studentId @returns {RecordingDetail} */
function composeRecording(fixture, studentId) {
  const store = readStore(studentId)
  const seed = recordingPlaybackSeeds[fixture.id] ?? { positionSeconds: 0, watchedThroughSeconds: 0, speed: 1, ended: false, bookmarks: [], notes: [] }
  const saved = store.playback[fixture.id]
  const playback = saved ?? {
    recordingId: fixture.id, positionSeconds: seed.positionSeconds, watchedThroughSeconds: seed.watchedThroughSeconds,
    durationSeconds: fixture.durationSeconds, progressPercent: Math.round(seed.watchedThroughSeconds / fixture.durationSeconds * 100),
    speed: seed.speed, ended: seed.ended, completedChapterIds: completedChapterIds(fixture.chapters, seed.watchedThroughSeconds),
    bookmarks: seed.bookmarks, notes: seed.notes, lastWatchedAt: fixture.lastWatchedAt,
  }
  return { ...clone(fixture), progressPercent: playback.progressPercent, lastWatchedAt: playback.lastWatchedAt, playback: clone(playback), quizResult: store.quizzes[fixture.id] ? clone(store.quizzes[fixture.id]) : null }
}

/** @param {string} roomId @param {string} studentId @returns {StudyRoomDetail} */
function composeRoom(roomId, studentId) {
  const room = studyRooms.find((item) => item.id === roomId)
  if (!room) throw notFound('study room')
  const store = readStore(studentId)
  const joined = Boolean(store.rooms[roomId])
  const entry = roomChannels.get(classKey(roomId, studentId))
  const visitors = roomVisitors.filter((visitor) => entry?.visitors.has(visitor.id)).map((visitor) => ({ ...visitor, presence: /** @type {const} */ ('studying'), isSelf: false }))
  const participants = [...clone(room.participants), ...visitors]
  if (joined) participants.push({ id: studentId, name: 'You', initials: 'AS', presence: 'studying', isSelf: true })
  return { ...clone(room), joined, participants, peerCount: participants.length }
}

/* BATCH 3.2 (F-01 / F-02): every method below resolves the SAME fail-closed
 * identity scope. `demoStudentWorkspace()` throws `not_found` for unknown,
 * forged, mismatched and sessionless identities, so no caller can reach the
 * seeded fixtures without a valid matching demo session. */
/** @param {string} studentId @returns {boolean} true when this is an own (issued) workspace */
function ownStudent(studentId) {
  return !demoStudentWorkspace(studentId)
}
/** @param {string} studentId @param {string} resource */
function denyDemoRecord(studentId, resource) {
  if (!demoStudentWorkspace(studentId)) throw notFound(resource)
}

/** @type {import('../types.js').LearningService} */
export const learningService = {
  listLiveSessions(studentId) {
    return simulate(() => {
      if (ownStudent(studentId)) return []
      return liveSessions.map((session) => ({ ...clone(session), attendingCount: session.attendingCount + (readStore(studentId).attendance[session.id]?.connected ? 1 : 0) }))
    })
  },
  getLiveRoom(sessionId, studentId) {
    return simulate(() => {
      denyDemoRecord(studentId, 'live session')
      const session = findSession(sessionId)
      const store = readStore(studentId)
      const saved = store.attendance[sessionId]
      const attendance = saved ? settleAttendance(saved, session, Date.now(), attendancePolicy) : null
      const chat = [...seedChat.filter((message) => message.sessionId === sessionId), ...(store.chat[sessionId] ?? [])]
      return { session: clone(session), policy: clone(attendancePolicy), chat, queue: readQueue(sessionId, studentId), attendance, recordingId: recordingIdFor(session) }
    })
  },
  joinLive(sessionId, studentId) {
    return simulate(() => {
      denyDemoRecord(studentId, 'live session')
      const session = findSession(sessionId)
      if (session.status !== 'live') throw serviceError('session_not_live', 'This room is not live right now. Check the schedule or open its recording.', 409)
      const store = readStore(studentId)
      const seed = activeAttendanceSeeds[/** @type {'ses-rot-b'|'ses-chem-b'} */ (sessionId)] ?? { attentionScore: 84, coveragePercent: 100, joinedAfterMinutes: 0 }
      const existing = store.attendance[sessionId]
      let base = existing ?? createAttendanceState(session, studentId, seed, Date.now(), attendancePolicy)
      // A refresh loses the sliding toast; settle that abandoned check once so
      // the register never keeps a dangling activeCheckId.
      if (base.activeCheckId) base = applyAttention(base, 'missed', base.activeCheckId, attendancePolicy, Date.now())
      const next = { ...settleAttendance(base, session, Date.now(), attendancePolicy), connected: true, visible: true, leftAt: null }
      store.attendance[sessionId] = next
      writeStore(studentId, store)
      return next
    }, { faulty: false })
  },
  leaveLive(sessionId, studentId) {
    return simulate(() => {
      denyDemoRecord(studentId, 'live session')
      disconnectPresence(sessionId, studentId)
      const state = readStore(studentId).attendance[sessionId]
      if (!state) throw notFound('attendance record')
      return state
    }, { faulty: false })
  },
  setPresenceVisibility(sessionId, studentId, visible) {
    return simulate(() => {
      denyDemoRecord(studentId, 'live session')
      const store = readStore(studentId)
      const state = store.attendance[sessionId]
      if (!state) throw notFound('attendance record')
      const settled = settleAttendance(state, findSession(sessionId), Date.now(), attendancePolicy)
      const next = { ...settled, visible }
      store.attendance[sessionId] = next
      writeStore(studentId, store)
      classChannels.get(classKey(sessionId, studentId))?.emitter.emit({ type: 'presence', attendance: next })
      return next
    }, { min: 0, max: 0, faulty: false })
  },
  respondAttention(sessionId, studentId, checkId) {
    return simulate(() => {
      denyDemoRecord(studentId, 'live session')
      const state = resolveCheck(sessionId, studentId, checkId, 'answered')
      if (!state) throw serviceError('check_expired', 'That attention check already closed. Your next check will arrive soon.', 409)
      const entry = classChannels.get(classKey(sessionId, studentId))
      entry?.channel.attentionResolved(checkId)
      entry?.emitter.emit({ type: 'attention-resolved', checkId })
      entry?.emitter.emit({ type: 'presence', attendance: state })
      return state
    }, { faulty: false })
  },
  sendChat(sessionId, studentId, body) {
    return simulate(() => {
      denyDemoRecord(studentId, 'live session')
      const text = body.trim()
      if (!text) throw serviceError('empty_message', 'Write a message before sending.', 400)
      const message = { id: `chat-self-${Date.now()}`, author: 'You', role: /** @type {const} */ ('student'), body: text.slice(0, 500), sentAt: new Date().toISOString() }
      const store = readStore(studentId)
      store.chat[sessionId] = [...(store.chat[sessionId] ?? []), message].slice(-80)
      writeStore(studentId, store)
      classChannels.get(classKey(sessionId, studentId))?.emitter.emit({ type: 'chat', message })
      return message
    }, { min: 80, max: 220 })
  },
  submitQuestion(sessionId, studentId, body) {
    return simulate(() => {
      denyDemoRecord(studentId, 'live session')
      const text = body.trim()
      if (!text) throw serviceError('empty_question', 'Write your question before adding it to the queue.', 400)
      /** @type {QueueQuestion} */
      const question = { id: `q-self-${Date.now()}`, sessionId, author: 'You', studentId, body: text.slice(0, 500), status: 'pending', upvotes: 0, votedByMe: false, createdAt: new Date().toISOString(), approvedAt: null }
      writeQuestion(sessionId, studentId, question)
      const entry = classChannels.get(classKey(sessionId, studentId)) ?? ensureClassChannel(sessionId, studentId)
      entry.emitter.emit({ type: 'question', question })
      // Simulated faculty moderation: approval is a real queued event on the
      // realtime channel clock, not a component timeout.
      const delay = numericFlag('vyuh.mock.approvalDelaySeconds') ?? 8
      entry.channel.later(() => {
        const store = readStore(studentId)
        const list = store.queue[sessionId] ?? []
        const index = list.findIndex((item) => item.id === question.id)
        if (index < 0) return
        const approved = { ...list[index], status: /** @type {const} */ ('approved'), approvedAt: new Date().toISOString() }
        list[index] = approved
        store.queue[sessionId] = list
        writeStore(studentId, store)
        const { voterIds, ...rest } = approved
        entry.emitter.emit({ type: 'question', question: { ...rest, upvotes: rest.upvotes + voterIds.length, votedByMe: voterIds.includes(studentId) } })
      }, delay)
      return question
    }, { faulty: false })
  },
  upvoteQuestion(sessionId, questionId, studentId) {
    return simulate(() => {
      denyDemoRecord(studentId, 'live session')
      const question = readQueue(sessionId, studentId).find((item) => item.id === questionId)
      if (!question) throw notFound('question')
      const seed = seedQuestions.find((item) => item.id === questionId)
      const store = readStore(studentId)
      const stored = (store.queue[sessionId] ?? []).find((item) => item.id === questionId)
      const voterIds = new Set(stored?.voterIds ?? seed?.voterIds ?? [])
      if (voterIds.has(studentId)) voterIds.delete(studentId)
      else voterIds.add(studentId)
      writeQuestion(sessionId, studentId, { ...question, voterIds: [...voterIds] })
      const next = readQueue(sessionId, studentId).find((item) => item.id === questionId)
      if (!next) throw notFound('question')
      classChannels.get(classKey(sessionId, studentId))?.emitter.emit({ type: 'question', question: next })
      return next
    }, { faulty: false })
  },
  subscribe(sessionId, studentId, listener) {
    /* Issued accounts have no demo room channel; return a harmless no-op. */
    if (!demoStudentWorkspace(studentId)) return () => {}
    const entry = ensureClassChannel(sessionId, studentId)
    entry.channel.start()
    const off = entry.emitter.subscribe(listener)
    return () => {
      off()
      if (entry.emitter.size === 0) {
        disconnectPresence(sessionId, studentId)
        entry.channel.stop()
        classChannels.delete(classKey(sessionId, studentId))
      }
    }
  },
  getAttendance(studentId) {
    return simulate(() => {
      /* WS1: an issued account has NO seeded attendance history and no invented
         percentage. Only records genuinely created for THAT id may appear. */
      if (ownStudent(studentId)) {
        return buildAttendanceReport([], attendancePolicy, studentId, attendancePeriodLabel)
      }
      const store = readStore(studentId)
      /** @type {import('../../contracts/learning.js').AttendanceRecord[]} */
      const liveRecords = []
      for (const state of Object.values(store.attendance)) {
        const session = liveSessions.find((item) => item.id === state.sessionId)
        if (!session) continue
        const settled = settleAttendance(state, session, Date.now(), attendancePolicy)
        liveRecords.push({ sessionId: session.id, title: session.title, subjectName: session.subjectName, batchName: session.batchName, date: session.startsAt, presencePercent: settled.presencePercent, verdict: settled.verdict, attendedMinutes: Math.round(settled.attendedSeconds / 60), eligibleMinutes: Math.round(settled.eligibleSeconds / 60), live: true })
      }
      return buildAttendanceReport([...clone(attendanceHistory), ...liveRecords], attendancePolicy, studentId, attendancePeriodLabel)
    })
  },
  listRecordings(studentId) {
    return simulate(() => ownStudent(studentId) ? [] : recordings.map((fixture) => composeRecording(fixture, studentId)))
  },
  getRecording(recordingId, studentId) {
    return simulate(() => {
      denyDemoRecord(studentId, 'recording')
      return composeRecording(findRecording(recordingId), studentId)
    })
  },
  savePlayback(recordingId, studentId, input) {
    return simulate(() => {
      denyDemoRecord(studentId, 'recording')
      const fixture = findRecording(recordingId)
      const store = readStore(studentId)
      const previous = store.playback[recordingId] ?? composeRecording(fixture, studentId).playback
      const positionSeconds = clamp(input.positionSeconds, 0, fixture.durationSeconds)
      const watchedThroughSeconds = clamp(Math.max(previous.watchedThroughSeconds, input.watchedThroughSeconds), 0, fixture.durationSeconds)
      const ended = previous.ended || input.ended
      const speed = SPEEDS.includes(input.speed) ? input.speed : 1
      /** @type {PlaybackState} */
      const next = { ...previous, recordingId, positionSeconds, watchedThroughSeconds, durationSeconds: fixture.durationSeconds, progressPercent: Math.round(watchedThroughSeconds / fixture.durationSeconds * 100), speed, ended, completedChapterIds: [...new Set([...previous.completedChapterIds, ...(input.completedChapterIds ?? completedChapterIds(fixture.chapters, watchedThroughSeconds))])], lastWatchedAt: new Date().toISOString() }
      store.playback[recordingId] = next
      writeStore(studentId, store)
      return next
    }, { min: 0, max: 0, faulty: false })
  },
  addBookmark(recordingId, studentId, timeSeconds, label) {
    return simulate(() => {
      denyDemoRecord(studentId, 'recording')
      const fixture = findRecording(recordingId)
      const store = readStore(studentId)
      const playback = store.playback[recordingId] ?? composeRecording(fixture, studentId).playback
      const bookmark = { id: `bm-${Date.now()}`, timeSeconds: clamp(timeSeconds, 0, fixture.durationSeconds), label: label.trim() || `Bookmark at ${Math.round(timeSeconds)}s`, createdAt: new Date().toISOString() }
      const next = { ...playback, bookmarks: [...playback.bookmarks, bookmark].sort((a, b) => a.timeSeconds - b.timeSeconds) }
      store.playback[recordingId] = next
      writeStore(studentId, store)
      return next
    }, { faulty: false })
  },
  addNote(recordingId, studentId, timeSeconds, text) {
    return simulate(() => {
      denyDemoRecord(studentId, 'recording')
      const fixture = findRecording(recordingId)
      const body = text.trim()
      if (!body) throw serviceError('empty_note', 'Write a note before saving it.', 400)
      const store = readStore(studentId)
      const playback = store.playback[recordingId] ?? composeRecording(fixture, studentId).playback
      const note = { id: `note-${Date.now()}`, timeSeconds: clamp(timeSeconds, 0, fixture.durationSeconds), text: body.slice(0, 1000), createdAt: new Date().toISOString() }
      const next = { ...playback, notes: [...playback.notes, note].sort((a, b) => a.timeSeconds - b.timeSeconds) }
      store.playback[recordingId] = next
      writeStore(studentId, store)
      return next
    }, { faulty: false })
  },
  submitQuiz(recordingId, studentId, answers) {
    return simulate(() => {
      denyDemoRecord(studentId, 'recording')
      const fixture = findRecording(recordingId)
      const store = readStore(studentId)
      const playback = store.playback[recordingId] ?? composeRecording(fixture, studentId).playback
      if (!playback.ended) throw serviceError('practice_locked', 'Finish the video before taking Lecture to Practice.', 409)
      for (const question of fixture.quiz.questions) {
        if (!question.options.some((option) => option.key === answers[question.id])) throw serviceError('incomplete_quiz', 'Answer all three questions before submitting.', 400)
      }
      const result = gradeQuiz(fixture.quiz, answers)
      store.quizzes[recordingId] = result
      writeStore(studentId, store)
      return result
    }, { faulty: false })
  },
  listDoubts(studentId) {
    return simulate(() => {
      const own = ownStudent(studentId)
      const items = own ? readStore(studentId).doubts : [...clone(doubtFixtures), ...readStore(studentId).doubts]
      return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    })
  },
  getDoubt(doubtId, studentId) {
    return simulate(() => {
      const own = ownStudent(studentId)
      const doubt = (own ? readStore(studentId).doubts : [...doubtFixtures, ...readStore(studentId).doubts]).find((item) => item.id === doubtId)
      if (!doubt) throw notFound('doubt')
      return doubt
    })
  },
  createDoubt(input) {
    return simulate(() => {
      /* Own doubts are allowed; a demo recording may never be attached to an
         institute-issued account's new record. */
      const own = ownStudent(input.studentId)
      const title = input.title.trim()
      const body = input.body.trim()
      if (!title || !body) throw serviceError('empty_doubt', 'Add a title and describe the doubt before posting.', 400)
      const recording = own || !input.recordingId ? null : recordings.find((item) => item.id === input.recordingId)
      const now = new Date().toISOString()
      /** @type {DoubtThreadDetail} */
      const doubt = { id: `doubt-${Date.now()}`, title: title.slice(0, 140), status: 'open', subjectName: recording?.subjectName ?? 'General', recordingId: recording?.id ?? null, recordingTitle: recording?.title ?? null, timeSeconds: input.timeSeconds, createdAt: now, updatedAt: now, messages: [{ id: `dm-${Date.now()}`, author: 'You', role: 'student', body: body.slice(0, 2000), createdAt: now }] }
      const store = readStore(input.studentId)
      store.doubts.push(doubt)
      writeStore(input.studentId, store)
      return doubt
    }, { faulty: false })
  },
  replyDoubt(doubtId, studentId, body) {
    return simulate(() => {
      const text = body.trim()
      if (!text) throw serviceError('empty_reply', 'Write a reply before sending.', 400)
      const own = ownStudent(studentId)
      const store = readStore(studentId)
      const all = own ? [...store.doubts] : [...clone(doubtFixtures), ...store.doubts]
      const index = all.findIndex((item) => item.id === doubtId)
      if (index < 0) throw notFound('doubt')
      const now = new Date().toISOString()
      const next = { ...all[index], updatedAt: now, messages: [...all[index].messages, { id: `dm-${Date.now()}`, author: 'You', role: /** @type {const} */ ('student'), body: text.slice(0, 2000), createdAt: now }] }
      const storedIndex = store.doubts.findIndex((item) => item.id === doubtId)
      if (storedIndex >= 0) store.doubts[storedIndex] = next
      else if (!own) store.doubts.push(next)
      else throw notFound('doubt')
      writeStore(studentId, store)
      return next
    }, { faulty: false })
  },
  listStudyRooms(studentId) { return simulate(() => ownStudent(studentId) ? [] : studyRooms.map((room) => composeRoom(room.id, studentId))) },
  getStudyRoom(roomId, studentId) {
    return simulate(() => {
      denyDemoRecord(studentId, 'study room')
      return composeRoom(roomId, studentId)
    })
  },
  joinStudyRoom(roomId, studentId) {
    return simulate(() => {
      denyDemoRecord(studentId, 'study room')
      const room = studyRooms.find((item) => item.id === roomId)
      if (!room) throw notFound('study room')
      if (room.mode !== 'interactive') throw serviceError('room_not_interactive', 'Only interactive rooms can be joined.', 409)
      if (room.peerCount >= room.capacity) throw serviceError('room_full', 'This room is full. Try another room from the list.', 409)
      const store = readStore(studentId)
      store.rooms[roomId] = true
      writeStore(studentId, store)
      return composeRoom(roomId, studentId)
    }, { faulty: false })
  },
  leaveStudyRoom(roomId, studentId) {
    return simulate(() => {
      denyDemoRecord(studentId, 'study room')
      const store = readStore(studentId)
      store.rooms[roomId] = false
      writeStore(studentId, store)
      return composeRoom(roomId, studentId)
    }, { faulty: false })
  },
  subscribeRoom(roomId, studentId, listener) {
    if (!demoStudentWorkspace(studentId)) return () => {}
    const key = classKey(roomId, studentId)
    let entry = roomChannels.get(key)
    if (!entry) {
      const emitter = createEventEmitter()
      /** @type {Set<string>} */
      const visitors = new Set()
      const channel = createMockRoomChannel({
        visitors: roomVisitors,
        intervalSeconds: numericFlag('vyuh.mock.roomIntervalSeconds'),
        onPresence: (visitor, joined) => {
          if (joined) visitors.add(visitor.id)
          else visitors.delete(visitor.id)
          emitter.emit({ type: 'room-presence', room: composeRoom(roomId, studentId) })
        },
      })
      entry = { emitter, channel, visitors }
      roomChannels.set(key, entry)
    }
    entry.channel.start()
    const off = entry.emitter.subscribe(listener)
    return () => {
      off()
      if (entry && entry.emitter.size === 0) {
        entry.channel.stop()
        roomChannels.delete(key)
      }
    }
  },
}
