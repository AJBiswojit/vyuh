import { describe, expect, it } from 'vitest'
import { activeTranscriptIndex, applyAttention, attendanceVerdict, buildAttendanceReport, completedChapterIds, createAttendanceState, gradeQuiz, groupSessionsByDay, presencePercent, settleAttendance } from '../../src/shared/lib/learningMath.js'
import { attendancePolicy } from '../../src/mock-data/attendance.js'
import { recordings } from '../../src/mock-data/recordings.js'
import { liveSessions } from '../../src/mock-data/liveSessions.js'

const session = liveSessions[0]
const now = new Date(session.startsAt).getTime() + 25 * 60_000

describe('attendance arithmetic', () => {
  it('weights time coverage by attention and derives shape+label verdicts', () => {
    expect(presencePercent(100, 100, 84)).toBe(84)
    expect(presencePercent(100, 50, 84)).toBe(42)
    expect(attendanceVerdict(75, 75)).toBe('Present')
    expect(attendanceVerdict(74.9, 75)).toBe('Partial')
    expect(attendanceVerdict(0, 75)).toBe('Absent')
  })
  it('credits only visible time after grace and caps at the scheduled duration', () => {
    const state = createAttendanceState(session, 'stu-test', { attentionScore: 84, coveragePercent: 100, joinedAfterMinutes: 4 }, now, attendancePolicy)
    expect(state.eligibleSeconds).toBe(15 * 60)
    expect(state.presencePercent).toBe(84)
    const hidden = settleAttendance({ ...state, visible: false }, session, now + 60_000, attendancePolicy)
    expect(hidden.attendedSeconds).toBe(state.attendedSeconds)
    expect(hidden.presencePercent).toBeLessThan(84)
    const visible = settleAttendance(state, session, now + 60_000, attendancePolicy)
    expect(visible.attendedSeconds).toBe(state.attendedSeconds + 60)
    const capped = settleAttendance(state, session, now + 200 * 60_000, attendancePolicy)
    expect(capped.eligibleSeconds).toBe(session.durationMinutes * 60)
  })
  it('logs Still here and missed checks with signed score ticks', () => {
    const state = createAttendanceState(session, 'stu-test', { attentionScore: 84, coveragePercent: 100, joinedAfterMinutes: 4 }, now, attendancePolicy)
    const answered = applyAttention(state, 'answered', 'check-1', attendancePolicy, now)
    expect(answered.attentionScore).toBe(86)
    expect(answered.lastDelta).toBe(2)
    expect(answered.responses[0]).toMatchObject({ checkId: 'check-1', outcome: 'answered', delta: 2 })
    const missed = applyAttention(answered, 'missed', 'check-2', attendancePolicy, now)
    expect(missed.attentionScore).toBe(82)
    expect(missed.lastDelta).toBe(-4)
    expect(missed.responses).toHaveLength(2)
  })
  it('builds a monthly summary and defaulter flag from verdict rows', () => {
    const rows = [92, 64, 0].map((percent, index) => ({ sessionId: `s${index}`, title: 'Class', subjectName: 'Physics', batchName: 'Batch', date: new Date(now - index * 86400000).toISOString(), presencePercent: percent, verdict: attendanceVerdict(percent, 75), attendedMinutes: percent, eligibleMinutes: 100, live: false }))
    const report = buildAttendanceReport(rows, attendancePolicy, 'stu-test', 'November 2026')
    expect(report.summary).toMatchObject({ present: 1, total: 3, percentage: 33.3 })
    expect(report.defaulter).toBe(true)
    expect(report.explanation).toContain('10 minutes')
  })
})

describe('recording arithmetic', () => {
  it('keeps the transcript highlight on the line containing the playhead', () => {
    const transcript = recordings[0].transcript
    expect(activeTranscriptIndex(transcript, 0)).toBe(0)
    expect(activeTranscriptIndex(transcript, 3.99)).toBe(0)
    expect(activeTranscriptIndex(transcript, 4)).toBe(1)
    expect(activeTranscriptIndex(transcript, 12)).toBe(3)
    expect(activeTranscriptIndex(transcript, 48)).toBe(transcript.length - 1)
  })
  it('completes chapters only when watched-through reaches their end', () => {
    const chapters = recordings[0].chapters
    expect(completedChapterIds(chapters, 11.9)).toEqual([])
    expect(completedChapterIds(chapters, 12)).toEqual(['rot-ch-1'])
    expect(completedChapterIds(chapters, 48)).toHaveLength(4)
  })
  it('grades the three-question end quiz from the authored key', () => {
    const quiz = recordings[0].quiz
    const answers = Object.fromEntries(quiz.questions.map((question) => [question.id, question.correctKey]))
    expect(gradeQuiz(quiz, answers)).toMatchObject({ score: 3, total: 3 })
    expect(gradeQuiz(quiz, { ...answers, [quiz.questions[0].id]: 'C' }).score).toBe(2)
  })
  it('groups the schedule by IST day with Today/Tomorrow labels', () => {
    const groups = groupSessionsByDay(liveSessions, now)
    expect(groups.some((group) => group.label === 'Today')).toBe(true)
    expect(groups.some((group) => group.label === 'Tomorrow')).toBe(true)
    expect(groups.flatMap((group) => group.sessions)).toHaveLength(liveSessions.length)
  })
})
