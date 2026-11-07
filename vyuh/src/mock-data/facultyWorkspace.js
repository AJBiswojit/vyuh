/**
 * Phase 7 faculty workspace fixtures: today's teaching, the class register, the
 * live host console, recording masters, the attendance register and the doubt
 * inbox.
 *
 * Everything here is scoped to Dr. Snehasish Mohapatra, whose seat the demo
 * signs in with. Two student-side fixtures are reused deliberately — the live
 * room `ses-rot-b` and the doubt threads — so a doubt a student writes and a
 * class a faculty member hosts are the same objects on both screens.
 *
 * @typedef {import('../contracts/faculty.js').FacultyClass} FacultyClass
 * @typedef {import('../contracts/faculty.js').FacultyRecording} FacultyRecording
 * @typedef {import('../contracts/faculty.js').FacultyDoubt} FacultyDoubt
 * @typedef {import('../contracts/faculty.js').ReplyTemplate} ReplyTemplate
 * @typedef {import('../contracts/faculty.js').HostParticipant} HostParticipant
 * @typedef {import('../contracts/faculty.js').AttendanceRow} AttendanceRow
 * @typedef {import('../contracts/faculty.js').FacultyDashboard} FacultyDashboard
 */
import { doubts as studentDoubts } from './doubts.js'
import { FACULTY_ID, FACULTY_NAME, facultyExams } from './facultyExams.js'
import { monitorRoster } from './monitorEvents.js'
import { questionBank } from './questionBank.js'

const now = Date.now()
/** @param {number} minutes */ function fromNow(minutes) { return new Date(now + minutes * 60_000).toISOString() }
/** @param {number} days @param {number} [hour] */ function daysAgo(days, hour = 10) {
  const date = new Date(now - days * 86_400_000)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

export const facultyProfile = {
  id: FACULTY_ID,
  name: FACULTY_NAME,
  initials: 'SM',
  subjectName: 'Physics',
  termLabel: 'Term 2026–27 · Session 2',
  weeklyLoadHours: 18,
}

/** @type {FacultyClass[]} */
export const facultyClasses = [
  {
    id: 'ses-rot-b', title: 'Rotational Dynamics · Torque & Equilibrium', mode: 'interactive',
    batchId: 'bat-prayas-m', batchName: 'Prayas JEE 2027 — Morning', subjectId: 'sub-phy', subjectName: 'Physics',
    facultyId: FACULTY_ID, facultyName: FACULTY_NAME,
    startsAt: fromNow(-25), durationMinutes: 75, attendanceThresholdPercent: 75,
    status: 'live', mediaUrl: '/media/rotational-dynamics-sample.mp4', recordingId: 'rec-rot-b', resourcesAttached: true,
  },
  {
    id: 'cls-optics-2', title: 'Ray Optics · Lens Combinations', mode: 'interactive',
    batchId: 'bat-prayas-m', batchName: 'Prayas JEE 2027 — Morning', subjectId: 'sub-phy', subjectName: 'Physics',
    facultyId: FACULTY_ID, facultyName: FACULTY_NAME,
    startsAt: fromNow(150), durationMinutes: 60, attendanceThresholdPercent: 80,
    status: 'scheduled', mediaUrl: '/media/integration-sample.mp4', recordingId: 'rec-rot-b', resourcesAttached: true,
  },
  {
    id: 'cls-current-3', title: 'Current Electricity · Kirchhoff Loops', mode: 'broadcast',
    batchId: 'bat-shikhar', batchName: 'Shikhar Droppers — Full day', subjectId: 'sub-phy', subjectName: 'Physics',
    facultyId: FACULTY_ID, facultyName: FACULTY_NAME,
    startsAt: fromNow(29 * 60), durationMinutes: 90, attendanceThresholdPercent: 75,
    status: 'scheduled', mediaUrl: '/media/rotational-dynamics-sample.mp4', recordingId: 'rec-rot-b', resourcesAttached: false,
  },
  {
    id: 'cls-elec-4', title: 'Electrostatics · Gauss Law Problems', mode: 'interactive',
    batchId: 'bat-prayas-m', batchName: 'Prayas JEE 2027 — Morning', subjectId: 'sub-phy', subjectName: 'Physics',
    facultyId: FACULTY_ID, facultyName: FACULTY_NAME,
    startsAt: fromNow(53 * 60), durationMinutes: 75, attendanceThresholdPercent: 75,
    status: 'scheduled', mediaUrl: '/media/organic-mechanisms-sample.mp4', recordingId: 'rec-org-m', resourcesAttached: true,
  },
  {
    id: 'cls-modern-5', title: 'Modern Physics · Photoelectric Effect', mode: 'broadcast',
    batchId: 'bat-aarambh-e', batchName: 'Aarambh JEE 2026 — Evening', subjectId: 'sub-phy', subjectName: 'Physics',
    facultyId: FACULTY_ID, facultyName: FACULTY_NAME,
    startsAt: fromNow(-2 * 24 * 60), durationMinutes: 60, attendanceThresholdPercent: 75,
    status: 'ended', mediaUrl: '/media/integration-sample.mp4', recordingId: 'rec-rot-b', resourcesAttached: true,
  },
]

/** Participants in the live room, seeded from the same cohort as the monitor. */
export const hostParticipants = /** @type {HostParticipant[]} */ (
  monitorRoster.slice(0, 20).map((student, index) => ({
    id: student.id,
    name: student.name,
    initials: student.initials,
    state: index === 3 ? 'hand_raised' : index === 7 ? 'idle' : index === 15 ? 'left' : 'present',
    attentionScore: 72 + ((index * 7) % 28),
    muted: false,
    lastSeenAt: new Date(now - (index % 4) * 30_000).toISOString(),
  }))
)

/** @param {string} id @param {string} title @param {number} seconds */ function chapter(id, title, seconds) {
  return { id, title, startSeconds: seconds }
}

/** @type {FacultyRecording[]} */
export const facultyRecordings = [
  {
    id: 'rec-rot-b', title: 'Rotational Dynamics · Torque & Equilibrium',
    subjectId: 'sub-phy', subjectName: 'Physics', topicName: 'Rotational Motion',
    batchName: 'Prayas JEE 2027 — Morning',
    fileName: 'rotational-dynamics-2026-11-07.mp4', sizeBytes: 214_748_364, durationSeconds: 48,
    uploadProgress: 100, uploadState: 'ready', trimStartSeconds: 0, trimEndSeconds: 48,
    chapters: [chapter('rc-1', 'Read the system', 0), chapter('rc-2', 'Build the equation', 12), chapter('rc-3', 'Check the limiting case', 24), chapter('rc-4', 'Practice prompt', 36)],
    transcript: [
      { at: 0, text: 'Start by choosing the axis. The hinge is convenient because the unknown hinge force passes through it.' },
      { at: 4, text: 'Torque equals force times the perpendicular distance from the axis to the line of action.' },
      { at: 12, text: 'Equilibrium asks for two conditions: net force is zero and net torque is zero.' },
      { at: 24, text: 'Now check a limiting case. If the ladder becomes vertical, the weight moment arm shrinks to zero.' },
      { at: 36, text: 'Practice prompt: a uniform beam is hinged at one end and held by a vertical string at the other.' },
    ],
    published: true, ownerName: FACULTY_NAME, updatedAt: daysAgo(1), mediaUrl: '/media/rotational-dynamics-sample.mp4',
  },
  {
    id: 'rec-gauss-new', title: 'Electrostatics · Gauss Law Problems',
    subjectId: 'sub-phy', subjectName: 'Physics', topicName: 'Electrostatics',
    batchName: 'Prayas JEE 2027 — Morning',
    fileName: 'gauss-law-2026-11-06.mp4', sizeBytes: 168_932_160, durationSeconds: 48,
    uploadProgress: 100, uploadState: 'ready', trimStartSeconds: 0, trimEndSeconds: 48,
    chapters: [chapter('rg-1', 'Flux and surfaces', 0), chapter('rg-2', 'Choosing a Gaussian surface', 16), chapter('rg-3', 'Worked problems', 32)],
    transcript: [
      { at: 0, text: 'Flux counts field lines crossing a surface; it does not care about the surface shape.' },
      { at: 16, text: 'Choose a surface that mirrors the symmetry: a sphere for a point charge, a cylinder for a line.' },
      { at: 32, text: 'Three problems, same order: draw the surface, write the flux, then substitute.' },
    ],
    published: false, ownerName: FACULTY_NAME, updatedAt: daysAgo(0), mediaUrl: '/media/rotational-dynamics-sample.mp4',
  },
  {
    id: 'rec-organic-new', title: 'Organic Mechanisms · Arrow Pushing (recording in progress)',
    subjectId: 'sub-che', subjectName: 'Chemistry', topicName: 'Organic Reaction Mechanisms',
    batchName: 'Aarambh JEE 2026 — Evening',
    fileName: 'organic-arrows-2026-11-05.mp4', sizeBytes: 402_653_184, durationSeconds: 48,
    uploadProgress: 62, uploadState: 'uploading', trimStartSeconds: 4, trimEndSeconds: 44,
    chapters: [chapter('ro-1', 'Find the electron source', 4), chapter('ro-2', 'Push the arrows', 12)],
    transcript: [
      { at: 4, text: 'Begin with the electron-rich site. A lone pair or a pi bond can act as the nucleophile.' },
      { at: 12, text: 'Curved arrows always start at electrons and point toward the atom or bond that receives them.' },
    ],
    published: false, ownerName: FACULTY_NAME, updatedAt: daysAgo(2), mediaUrl: '/media/organic-mechanisms-sample.mp4',
  },
]

/** @type {ReplyTemplate[]} */
export const replyTemplates = [
  {
    id: 'tpl-pivot', label: 'Pivot choice',
    body: 'Any fixed pivot is valid once the body is in equilibrium. Pick the point where the most unknown forces act — they then have zero moment arm and drop out of the torque equation. Try Q3 again with the hinge as pivot and reply here if the sign still fights you.',
  },
  {
    id: 'tpl-sign', label: 'Sign convention',
    body: 'Fix one sign convention at the top of your sheet (anticlockwise positive) and apply it to every torque before substituting numbers. Nine times out of ten the error is a mixed convention, not the algebra.',
  },
  {
    id: 'tpl-revisit', label: 'Watch this timestamp',
    body: 'Rewatch the timestamp linked above, then attempt the two practice prompts under it. If it still does not click, bring the page to the doubt slot on Saturday and we will work it line by line.',
  },
  {
    id: 'tpl-units', label: 'Units and decimals',
    body: 'Write the unit next to every quantity as you go. For numerical answers, check the required decimal places before you submit — the hall accepts a small tolerance but not a rounded unit.',
  },
  {
    id: 'tpl-slot', label: 'Book a doubt slot',
    body: 'I have added this to Saturday’s doubt slot at 10:00 in the Physics room. Bring your notebook; we will do the derivation and two variants together.',
  },
]

/** @param {number} hours */ function ago(hours) { return new Date(now - hours * 3_600_000).toISOString() }

/** @type {FacultyDoubt[]} */
export const facultyDoubts = [
  {
    id: 'doubt-torque-axis', studentId: 'stu-ananya', studentName: 'Ananya Sahoo', initials: 'AS',
    batchName: 'Prayas JEE 2027 — Morning', subjectName: 'Physics', topicName: 'Rotational Motion',
    title: 'Why can I choose any pivot for equilibrium?', body: studentDoubts[0].messages[0].body,
    status: 'answered', createdAt: studentDoubts[0].createdAt, updatedAt: studentDoubts[0].updatedAt,
    messages: studentDoubts[0].messages.map((message, index) => ({
      id: `fd-${index + 1}`, author: message.author, role: message.role, body: message.body, createdAt: message.createdAt,
    })),
    timestampLink: { recordingId: 'rec-rot-b', recordingTitle: 'Rotational Dynamics · Torque & Equilibrium', timeSeconds: 12 },
    waitingMinutes: 0,
  },
  {
    id: 'doubt-rate-order', studentId: 'stu-ananya', studentName: 'Ananya Sahoo', initials: 'AS',
    batchName: 'Prayas JEE 2027 — Morning', subjectName: 'Chemistry', topicName: 'Chemical Kinetics',
    title: 'Order vs molecularity in a slow step', body: studentDoubts[1].messages[0].body,
    status: 'open', createdAt: studentDoubts[1].createdAt, updatedAt: studentDoubts[1].updatedAt,
    messages: studentDoubts[1].messages.map((message, index) => ({
      id: `fd-${index + 10}`, author: message.author, role: message.role, body: message.body, createdAt: message.createdAt,
    })),
    timestampLink: { recordingId: 'rec-org-m', recordingTitle: 'Organic Reaction Mechanisms · Arrow Pushing', timeSeconds: 24 },
    waitingMinutes: 312,
  },
  {
    id: 'doubt-limits', studentId: 'stu-ananya', studentName: 'Ananya Sahoo', initials: 'AS',
    batchName: 'Prayas JEE 2027 — Morning', subjectName: 'Mathematics', topicName: 'Definite Integrals',
    title: 'Changing limits before substitution', body: studentDoubts[2].messages[0].body,
    status: 'open', createdAt: studentDoubts[2].createdAt, updatedAt: studentDoubts[2].updatedAt,
    messages: studentDoubts[2].messages.map((message, index) => ({
      id: `fd-${index + 20}`, author: message.author, role: message.role, body: message.body, createdAt: message.createdAt,
    })),
    timestampLink: null, waitingMinutes: 118,
  },
  {
    id: 'doubt-rolling-sign', studentId: 'mon-06', studentName: 'Sasmita Behera', initials: 'SB',
    batchName: 'Prayas JEE 2027 — Morning', subjectName: 'Physics', topicName: 'Rotational Motion',
    title: 'Friction direction in rolling without slipping',
    body: 'In the incline problem, why does static friction point up the plane? I keep drawing it down because the disc moves down.',
    status: 'open', createdAt: ago(6), updatedAt: ago(6),
    messages: [{ id: 'fd-31', author: 'Sasmita Behera', role: 'student', body: 'In the incline problem, why does static friction point up the plane? I keep drawing it down because the disc moves down.', createdAt: ago(6) }],
    timestampLink: { recordingId: 'rec-rot-b', recordingTitle: 'Rotational Dynamics · Torque & Equilibrium', timeSeconds: 18 },
    waitingMinutes: 360,
  },
  {
    id: 'doubt-gauss-surface', studentId: 'mon-11', studentName: 'Sourav Samal', initials: 'SS',
    batchName: 'Prayas JEE 2027 — Morning', subjectName: 'Physics', topicName: 'Electrostatics',
    title: 'Does the Gaussian surface have to be closed?',
    body: 'Gauss law uses a closed surface, but for the sheet problem the solution used a pillbox. How do I choose one quickly in the exam?',
    status: 'answered', createdAt: ago(20), updatedAt: ago(15),
    messages: [
      { id: 'fd-41', author: 'Sourav Samal', role: 'student', body: 'Gauss law uses a closed surface, but for the sheet problem the solution used a pillbox. How do I choose one quickly in the exam?', createdAt: ago(20) },
      { id: 'fd-42', author: FACULTY_NAME, role: 'faculty', body: 'Match the surface to the symmetry: sphere for a point charge, cylinder for a line, pillbox for a sheet. The flux only has to be easy on the faces you choose.', createdAt: ago(15) },
    ],
    timestampLink: null, waitingMinutes: 0,
  },
  {
    id: 'doubt-photoelectric', studentId: 'mon-14', studentName: 'Sneha Rout', initials: 'SR',
    batchName: 'Aarambh JEE 2026 — Evening', subjectName: 'Physics', topicName: 'Modern Physics',
    title: 'Intensity vs stopping potential',
    body: 'If I double the intensity, the current doubles but the stopping potential does not change. Is that always true, or only below saturation?',
    status: 'open', createdAt: ago(2), updatedAt: ago(2),
    messages: [{ id: 'fd-51', author: 'Sneha Rout', role: 'student', body: 'If I double the intensity, the current doubles but the stopping potential does not change. Is that always true, or only below saturation?', createdAt: ago(2) }],
    timestampLink: null, waitingMinutes: 96,
  },
]

/**
 * The attendance register. Forty-two sessions have been held this term; the
 * threshold is 75%, and eight students sit below it.
 * @type {AttendanceRow[]}
 */
export const attendanceRows = monitorRoster.slice(0, 24).map((student, index) => {
  const sessionsHeld = 42
  const present = [39, 41, 31, 37, 40, 26, 42, 38, 30, 35, 41, 24, 38, 40, 33, 36, 42, 29, 39, 37, 21, 40, 34, 38][index] ?? 36
  const percent = Math.round((present / sessionsHeld) * 1000) / 10
  return {
    studentId: student.id,
    name: student.name,
    rollNumber: student.rollNumber,
    batchId: 'bat-neet-12',
    batchName: 'Aarogyam NEET 2026 — Morning',
    sessionsHeld,
    present,
    percent,
    attentionAverage: 78 + ((index * 5) % 20),
    lastPresentAt: daysAgo(index % 5, 9),
    defaulter: percent < 75,
  }
})

/** Session dates behind the register, so the PDF-style summary has a period. */
export const attendancePeriod = {
  label: 'Term 2026–27 · Sessions 1–42',
  from: daysAgo(98),
  to: new Date(now).toISOString(),
}

/** Cohort snapshot used by the dashboard. Mastery and trend are computed once. */
export const cohortSnapshot = {
  batchId: 'bat-prayas-m',
  batchName: 'Prayas JEE 2027 — Morning',
  students: 148,
  activeToday: 131,
  attendancePercent: 87.4,
  masteryPercent: 61,
  atRisk: 9,
  trend: [
    { label: 'W1', value: 54 }, { label: 'W2', value: 57 }, { label: 'W3', value: 56 },
    { label: 'W4', value: 59 }, { label: 'W5', value: 60 }, { label: 'W6', value: 61 },
  ],
  topWeakTopic: 'Rotational Motion',
}

/** @type {FacultyDashboard} */
export const facultyDashboard = {
  facultyId: FACULTY_ID,
  facultyName: FACULTY_NAME,
  termLabel: facultyProfile.termLabel,
  todayClasses: facultyClasses
    .filter((session) => Date.parse(session.startsAt) >= now - 12 * 3_600_000 && Date.parse(session.startsAt) <= now + 24 * 3_600_000)
    .map((session) => ({
      id: session.id,
      title: session.title,
      subjectName: session.subjectName,
      batchName: session.batchName,
      mode: session.mode,
      startsAt: session.startsAt,
      durationMinutes: session.durationMinutes,
      status: /** @type {'live'|'scheduled'|'ended'} */ (session.status === 'live' ? 'live' : session.status === 'ended' ? 'ended' : 'scheduled'),
      roomPath: `/faculty/classes/${session.id}/host`,
      attendanceThresholdPercent: session.attendanceThresholdPercent,
    })),
  pendingDoubts: facultyDoubts
    .filter((doubt) => doubt.status === 'open')
    .slice(0, 4)
    .map((doubt) => ({
      id: doubt.id,
      studentName: doubt.studentName,
      title: doubt.title,
      subjectName: doubt.subjectName,
      waitingMinutes: doubt.waitingMinutes,
      threadPath: `/faculty/doubts/${doubt.id}`,
      status: /** @type {'open'|'answered'} */ (doubt.status === 'answered' ? 'answered' : 'open'),
    })),
  approvals: facultyExams
    .filter((exam) => exam.status === 'pending_approval')
    .map((exam) => ({
      id: exam.id,
      examId: exam.id,
      title: exam.title,
      batchName: exam.batchName,
      kind: /** @type {'approval'|'review'} */ ('approval'),
      submittedAt: exam.submittedAt ?? exam.updatedAt,
      questionCount: exam.totalQuestions,
      note: exam.reviewNote ?? 'Waiting on the academic office. Re-submit only if the blueprint changed.',
      builderPath: `/faculty/exams/${exam.id}`,
    }))
    .concat([
      {
        id: 'rev-neet-08',
        examId: 'exam-neet-mock-08',
        title: 'NEET Mock 08 — Full Syllabus',
        batchName: 'Aarogyam NEET 2026 — Morning',
        kind: 'review',
        submittedAt: new Date(now - 5 * 3_600_000).toISOString(),
        questionCount: 10,
        note: 'Biology section is empty. The blueprint needs 45 items before this can go to approval.',
        builderPath: '/faculty/exams/exam-neet-mock-08',
      },
    ]),
  cohort: cohortSnapshot,
  liveExam: {
    examId: 'exam-neet-mock-07',
    title: 'NEET Mock 07 — Full Syllabus',
    batchName: 'Aarogyam NEET 2026 — Morning',
    startedAt: fromNow(-45),
    endsAt: fromNow(155),
    submitted: 3,
    total: 32,
  },
  stats: {
    bankQuestions: questionBank.length,
    drafts: facultyExams.filter((exam) => exam.status === 'draft').length,
    scheduled: facultyExams.filter((exam) => exam.status === 'scheduled' || exam.status === 'live').length,
    awaitingApproval: facultyExams.filter((exam) => exam.status === 'pending_approval').length,
    recordingsUnpublished: facultyRecordings.filter((recording) => !recording.published).length,
    openDoubts: facultyDoubts.filter((doubt) => doubt.status === 'open').length,
  },
}
