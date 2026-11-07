import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { learningService } from '../../src/services/mock/learning.js'
import { attendanceReportSchema, liveRoomSchema, recordingDetailSchema } from '../../src/services/api/schemas.js'

beforeEach(() => { localStorage.clear(); vi.useFakeTimers() })
afterEach(() => vi.useRealTimers())

/** Mock transport latency is timer-based; advance it without waiting in real time. */
async function settle(promise) {
  await vi.advanceTimersByTimeAsync(1000)
  return promise
}

describe('live attendance service', () => {
  it('seeds the demo at 84, rewards Still here, and penalises a missed check', async () => {
    localStorage.setItem('vyuh.mock.attentionMinSeconds', '1')
    localStorage.setItem('vyuh.mock.attentionMaxSeconds', '1')
    localStorage.setItem('vyuh.mock.presenceTickSeconds', '60')
    localStorage.setItem('vyuh.mock.chatIntervalSeconds', '60')
    const joined = await settle(learningService.joinLive('ses-rot-b', 'stu-test'))
    expect(joined.presencePercent).toBe(84)
    const events = []
    const off = learningService.subscribe('ses-rot-b', 'stu-test', (event) => events.push(event))
    await vi.advanceTimersByTimeAsync(1000)
    const challenge = events.find((event) => event.type === 'attention-challenge')
    expect(challenge).toBeTruthy()
    const answered = await settle(learningService.respondAttention('ses-rot-b', 'stu-test', challenge.challenge.id))
    expect(answered.presencePercent).toBe(86)
    expect(answered.responses.at(-1)).toMatchObject({ outcome: 'answered', delta: 2 })
    off()
  })
  it('lowers the score when the response window expires', async () => {
    localStorage.setItem('vyuh.mock.attentionMinSeconds', '1')
    localStorage.setItem('vyuh.mock.attentionMaxSeconds', '1')
    localStorage.setItem('vyuh.mock.presenceTickSeconds', '60')
    localStorage.setItem('vyuh.mock.chatIntervalSeconds', '60')
    await settle(learningService.joinLive('ses-rot-b', 'stu-miss'))
    const events = []
    const off = learningService.subscribe('ses-rot-b', 'stu-miss', (event) => events.push(event))
    await vi.advanceTimersByTimeAsync(1000)
    await vi.advanceTimersByTimeAsync(15000)
    const presence = events.filter((event) => event.type === 'presence').at(-1)
    expect(presence.attendance.attentionScore).toBe(80)
    expect(presence.attendance.lastDelta).toBe(-4)
    off()
  })
  it('resumes the same register after leaving and rejoining', async () => {
    await settle(learningService.joinLive('ses-rot-b', 'stu-rejoin'))
    const left = await settle(learningService.leaveLive('ses-rot-b', 'stu-rejoin'))
    expect(left.connected).toBe(false)
    const rejoined = await settle(learningService.joinLive('ses-rot-b', 'stu-rejoin'))
    expect(rejoined.connected).toBe(true)
    expect(rejoined.joinedAt).toBe(left.joinedAt)
  })
  it('toggles an upvote without double-counting the base total', async () => {
    const before = await settle(learningService.getLiveRoom('ses-rot-b', 'stu-voter'))
    const question = before.queue.find((item) => item.id === 'q-live-2')
    const up = await settle(learningService.upvoteQuestion('ses-rot-b', question.id, 'stu-voter'))
    expect(up.upvotes).toBe(question.upvotes + 1)
    expect(up.votedByMe).toBe(true)
    const down = await settle(learningService.upvoteQuestion('ses-rot-b', question.id, 'stu-voter'))
    expect(down.upvotes).toBe(question.upvotes)
    expect(down.votedByMe).toBe(false)
  })
  it('validates the room and attendance report at the API boundary', async () => {
    const room = await settle(learningService.getLiveRoom('ses-rot-b', 'stu-schema'))
    expect(liveRoomSchema.safeParse(room).success).toBe(true)
    const report = await settle(learningService.getAttendance('stu-schema'))
    expect(attendanceReportSchema.safeParse(report).success).toBe(true)
  })
})

describe('playback, doubts and rooms', () => {
  it('persists resume and speed across a fresh read, and locks the quiz until ended', async () => {
    await settle(learningService.savePlayback('rec-int-c', 'stu-play', { positionSeconds: 14.5, watchedThroughSeconds: 14.5, speed: 1.5, ended: false }))
    const refreshed = await settle(learningService.getRecording('rec-int-c', 'stu-play'))
    expect(refreshed.playback.positionSeconds).toBe(14.5)
    expect(refreshed.playback.speed).toBe(1.5)
    expect(refreshed.playback.completedChapterIds).toEqual(['int-ch-1'])
    const locked = learningService.submitQuiz('rec-int-c', 'stu-play', {})
    const assertion = expect(locked).rejects.toMatchObject({ code: 'practice_locked' })
    await vi.advanceTimersByTimeAsync(1000)
    await assertion
    await settle(learningService.savePlayback('rec-int-c', 'stu-play', { positionSeconds: 48, watchedThroughSeconds: 48, speed: 1.5, ended: true }))
    const quiz = await settle(learningService.submitQuiz('rec-int-c', 'stu-play', { 'int-q1': 'B', 'int-q2': 'B', 'int-q3': 'B' }))
    expect(quiz.score).toBe(3)
  })
  it('does not complete chapters when the student merely seeks to the end', async () => {
    await settle(learningService.savePlayback('rec-int-c', 'stu-seek', { positionSeconds: 48, watchedThroughSeconds: 0, speed: 1, ended: false }))
    const recording = await settle(learningService.getRecording('rec-int-c', 'stu-seek'))
    expect(recording.playback.completedChapterIds).toEqual([])
    expect(recording.playback.ended).toBe(false)
    expect(recordingDetailSchema.safeParse(recording).success).toBe(true)
  })
  it('attaches a doubt to a recording timestamp and keeps the thread reply', async () => {
    const doubt = await settle(learningService.createDoubt({ studentId: 'stu-doubt', title: 'Why swap limits?', body: 'I get a sign error.', recordingId: 'rec-int-c', timeSeconds: 16 }))
    expect(doubt.timeSeconds).toBe(16)
    expect(doubt.status).toBe('open')
    const replied = await settle(learningService.replyDoubt(doubt.id, 'stu-doubt', 'Adding the substitution I used.'))
    expect(replied.messages).toHaveLength(2)
    const inbox = await settle(learningService.listDoubts('stu-doubt'))
    expect(inbox.some((item) => item.id === doubt.id)).toBe(true)
  })
  it('joins and leaves an interactive room with a self participant', async () => {
    const joined = await settle(learningService.joinStudyRoom('room-torque', 'stu-room'))
    expect(joined.joined).toBe(true)
    expect(joined.participants.some((person) => person.isSelf)).toBe(true)
    expect(joined.peerCount).toBe(6)
    const left = await settle(learningService.leaveStudyRoom('room-torque', 'stu-room'))
    expect(left.joined).toBe(false)
    expect(left.peerCount).toBe(5)
  })
})
