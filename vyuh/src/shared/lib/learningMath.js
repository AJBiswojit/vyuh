/**
 * Pure Phase 6 arithmetic. No storage, no timers, no React — every presence
 * verdict, transcript highlight and quiz score is reproducible from inputs.
 * @typedef {import('../../contracts/learning.js').AttendancePolicy} AttendancePolicy
 * @typedef {import('../../contracts/learning.js').LiveAttendanceState} LiveAttendanceState
 * @typedef {import('../../contracts/learning.js').AttendanceRecord} AttendanceRecord
 * @typedef {import('../../contracts/learning.js').AttendanceReport} AttendanceReport
 * @typedef {import('../../contracts/live.js').LiveSession} LiveSession
 */

/** @param {number} value @param {number} min @param {number} max */
export function clamp(value, min, max) { return Math.min(max, Math.max(min, value)) }
/** @param {number} value */
export function round1(value) { return Math.round(value * 10) / 10 }

/** Presence is time coverage weighted by the attention score. @param {number} eligible @param {number} attended @param {number} attention */
export function presencePercent(eligible, attended, attention) {
  if (eligible <= 0) return clamp(Math.round(attention), 0, 100)
  return clamp(Math.round(clamp(attended / eligible, 0, 1) * clamp(attention, 0, 100)), 0, 100)
}

/** Shape+label verdicts are derived here, never chosen by colour in a component. @param {number} percent @param {number} threshold */
export function attendanceVerdict(percent, threshold) {
  if (percent >= threshold) return /** @type {const} */ ('Present')
  if (percent > 0) return /** @type {const} */ ('Partial')
  return /** @type {const} */ ('Absent')
}

/** @param {LiveSession} session @param {number} nowMs @param {AttendancePolicy} policy */
export function eligibleSeconds(session, nowMs, policy) {
  const elapsed = (nowMs - new Date(session.startsAt).getTime()) / 1000
  return clamp(elapsed - policy.graceMinutes * 60, 0, session.durationMinutes * 60)
}

/**
 * Credit visible wall-clock time since the previous tick. Hidden tabs and time
 * after the scheduled end earn nothing; the denominator keeps moving.
 * @param {LiveAttendanceState} state @param {LiveSession} session @param {number} nowMs @param {AttendancePolicy} policy
 * @returns {LiveAttendanceState}
 */
export function settleAttendance(state, session, nowMs, policy) {
  const eligible = eligibleSeconds(session, nowMs, policy)
  const previousEligible = state.eligibleSeconds
  const delta = Math.max(0, (nowMs - new Date(state.lastTickAt).getTime()) / 1000)
  const credited = state.connected && state.visible ? Math.min(delta, Math.max(0, eligible - previousEligible)) : 0
  const attended = clamp(state.attendedSeconds + credited, 0, eligible)
  const percent = presencePercent(eligible, attended, state.attentionScore)
  return { ...state, eligibleSeconds: eligible, attendedSeconds: attended, presencePercent: percent, verdict: attendanceVerdict(percent, policy.thresholdPercent), lastTickAt: new Date(nowMs).toISOString(), updatedAt: new Date(nowMs).toISOString() }
}

/** @param {LiveSession} session @param {string} studentId @param {{attentionScore:number,coveragePercent:number,joinedAfterMinutes:number}} seed @param {number} nowMs @param {AttendancePolicy} policy @returns {LiveAttendanceState} */
export function createAttendanceState(session, studentId, seed, nowMs, policy) {
  const joinedMs = Math.min(nowMs, new Date(session.startsAt).getTime() + seed.joinedAfterMinutes * 60_000)
  const eligible = eligibleSeconds(session, nowMs, policy)
  const attended = eligible * clamp(seed.coveragePercent, 0, 100) / 100
  const attention = clamp(seed.attentionScore, 0, 100)
  const percent = presencePercent(eligible, attended, attention)
  const iso = new Date(nowMs).toISOString()
  return { sessionId: session.id, studentId, joinedAt: new Date(joinedMs).toISOString(), leftAt: null, connected: true, visible: true, lastTickAt: iso, eligibleSeconds: eligible, attendedSeconds: attended, attentionScore: attention, presencePercent: percent, verdict: attendanceVerdict(percent, policy.thresholdPercent), lastDelta: 0, responses: [], activeCheckId: null, updatedAt: iso }
}

/** Apply one resolved attention check to an already-settled state. @param {LiveAttendanceState} state @param {'answered'|'missed'} outcome @param {string} checkId @param {AttendancePolicy} policy @param {number} nowMs */
export function applyAttention(state, outcome, checkId, policy, nowMs) {
  const delta = outcome === 'answered' ? policy.attentionReward : -policy.attentionPenalty
  const attentionScore = clamp(state.attentionScore + delta, 0, 100)
  const actualDelta = attentionScore - state.attentionScore
  const percent = presencePercent(state.eligibleSeconds, state.attendedSeconds, attentionScore)
  const iso = new Date(nowMs).toISOString()
  return { ...state, attentionScore, presencePercent: percent, verdict: attendanceVerdict(percent, policy.thresholdPercent), lastDelta: actualDelta, activeCheckId: null, responses: [...state.responses, { checkId, outcome, at: iso, delta: actualDelta }], updatedAt: iso }
}

/** @param {AttendanceRecord[]} sessions @param {AttendancePolicy} policy @param {string} studentId @param {string} periodLabel @returns {AttendanceReport} */
export function buildAttendanceReport(sessions, policy, studentId, periodLabel) {
  const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const present = sorted.filter((row) => row.verdict === 'Present').length
  const percentage = sorted.length === 0 ? 0 : round1(present / sorted.length * 100)
  let currentStreak = 0
  for (const row of sorted) { if (row.verdict !== 'Present') break; currentStreak += 1 }
  return {
    studentId, periodLabel, policy, sessions: sorted,
    summary: { present, total: sorted.length, percentage, periodLabel, currentStreak },
    defaulter: sorted.length > 0 && percentage < policy.thresholdPercent,
    explanation: `A session counts as Present at ${policy.thresholdPercent}% presence or above; any attended time below that is Partial, and no credit is Absent. The first ${policy.graceMinutes} minutes after the scheduled start are grace and do not count against you. Presence combines visible time after grace with attention checks: “Still here” restores ${policy.attentionReward} points, a missed check costs ${policy.attentionPenalty}. The monthly figure is the share of sessions marked Present.`,
  }
}

/** @param {import('../../contracts/learning.js').TranscriptSegment[]} transcript @param {number} timeSeconds */
export function activeTranscriptIndex(transcript, timeSeconds) {
  if (transcript.length === 0) return -1
  const time = Math.max(0, timeSeconds)
  const index = transcript.findIndex((segment) => time >= segment.startSeconds && time < segment.endSeconds)
  if (index >= 0) return index
  return time >= transcript[transcript.length - 1].endSeconds ? transcript.length - 1 : 0
}

/** @param {import('../../contracts/learning.js').RecordingChapter[]} chapters @param {number} watchedThroughSeconds */
export function completedChapterIds(chapters, watchedThroughSeconds) {
  return chapters.filter((chapter) => watchedThroughSeconds + 0.05 >= chapter.endSeconds).map((chapter) => chapter.id)
}

/** @param {import('../../contracts/learning.js').PracticeQuiz} quiz @param {Record<string,string>} answers */
export function gradeQuiz(quiz, answers) {
  const correctQuestionIds = quiz.questions.filter((question) => answers[question.id] === question.correctKey).map((question) => question.id)
  return { quizId: quiz.id, score: correctQuestionIds.length, total: quiz.questions.length, answers, correctQuestionIds, submittedAt: new Date().toISOString() }
}

/** @param {LiveSession[]} sessions @param {number} [nowMs] */
export function groupSessionsByDay(sessions, nowMs = Date.now()) {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })
  const key = (/** @type {number} */ ms) => formatter.format(new Date(ms))
  const today = key(nowMs)
  const tomorrow = key(nowMs + 86_400_000)
  const yesterday = key(nowMs - 86_400_000)
  /** @type {Map<string,{key:string,label:string,date:string,sessions:LiveSession[]}>} */
  const groups = new Map()
  for (const session of sessions) {
    const dayKey = key(new Date(session.startsAt).getTime())
    if (!groups.has(dayKey)) {
      const label = dayKey === today ? 'Today' : dayKey === tomorrow ? 'Tomorrow' : dayKey === yesterday ? 'Yesterday' : new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(session.startsAt))
      groups.set(dayKey, { key: dayKey, label, date: session.startsAt, sessions: [] })
    }
    groups.get(dayKey)?.sessions.push(session)
  }
  const list = [...groups.values()]
  for (const group of list) group.sessions.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  return list.sort((a, b) => {
    const aPast = a.sessions.every((session) => session.status === 'ended')
    const bPast = b.sessions.every((session) => session.status === 'ended')
    if (aPast !== bPast) return aPast ? 1 : -1
    return a.key.localeCompare(b.key)
  })
}
