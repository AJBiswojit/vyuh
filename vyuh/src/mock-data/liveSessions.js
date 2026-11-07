/**
 * Phase 6 live schedule. Times are relative to the demo clock so the room is
 * always joinable; the service, not the fixture, decides attendance credit.
 * @typedef {import('../contracts/live.js').LiveSession} LiveSession
 */
const base = new Date()
/** @param {number} minutes */
function relative(minutes) { return new Date(base.getTime() + minutes * 60_000).toISOString() }
/** @param {number} dayOffset @param {number} hour @param {number} [minute] */
function dayAt(dayOffset, hour, minute = 0) {
  const d = new Date(base)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}
const batchId = 'bat-prayas-m'
const batchName = 'Prayas JEE 2027 — Morning'
const mediaUrl = '/media/rotational-dynamics-sample.mp4'

/** @type {LiveSession[]} */
export const liveSessions = [
  { id: 'ses-rot-b', title: 'Rotational Dynamics · Torque & Equilibrium', subjectId: 'sub-phy', subjectName: 'Physics', facultyName: 'Dr. Snehasish Mohapatra', status: 'live', startsAt: relative(-25), durationMinutes: 75, attendingCount: 124, capacity: 148, joinUrl: '/student/live/ses-rot-b', resourcesAttached: true, mode: 'interactive', batchId, batchName, mediaUrl },
  { id: 'ses-chem-b', title: 'Chemical Kinetics · Rate Laws, Live Examples', subjectId: 'sub-che', subjectName: 'Chemistry', facultyName: 'Rituparna Das', status: 'live', startsAt: relative(-12), durationMinutes: 60, attendingCount: 131, capacity: 148, joinUrl: '/student/live/ses-chem-b', resourcesAttached: false, mode: 'broadcast', batchId, batchName, mediaUrl: '/media/organic-mechanisms-sample.mp4' },
  { id: 'ses-org-m', title: 'Organic Reaction Mechanisms — Session 4', subjectId: 'sub-che', subjectName: 'Chemistry', facultyName: 'Rituparna Das', status: 'scheduled', startsAt: relative(95), durationMinutes: 75, attendingCount: 0, capacity: 148, joinUrl: '/student/live/ses-org-m', resourcesAttached: true, mode: 'interactive', batchId, batchName, mediaUrl: '/media/organic-mechanisms-sample.mp4' },
  { id: 'ses-int-c', title: 'Definite Integration · Properties Workshop', subjectId: 'sub-mat', subjectName: 'Mathematics', facultyName: 'Prof. Gayatri Nanda', status: 'scheduled', startsAt: dayAt(1, 9), durationMinutes: 90, attendingCount: 0, capacity: 148, joinUrl: '/student/live/ses-int-c', resourcesAttached: true, mode: 'interactive', batchId, batchName, mediaUrl: '/media/integration-sample.mp4' },
  { id: 'ses-elec-r', title: 'Electrochemistry · Nernst Equation Revision', subjectId: 'sub-che', subjectName: 'Chemistry', facultyName: 'Rituparna Das', status: 'scheduled', startsAt: dayAt(1, 16), durationMinutes: 60, attendingCount: 0, capacity: 148, joinUrl: '/student/live/ses-elec-r', resourcesAttached: false, mode: 'broadcast', batchId, batchName, mediaUrl: '/media/organic-mechanisms-sample.mp4' },
  { id: 'ses-rot-rec', title: 'Rotational Dynamics · Moment of Inertia', subjectId: 'sub-phy', subjectName: 'Physics', facultyName: 'Dr. Snehasish Mohapatra', status: 'ended', startsAt: dayAt(-1, 10), durationMinutes: 75, attendingCount: 132, capacity: 148, joinUrl: '/student/recordings/rec-rot-b', resourcesAttached: true, mode: 'interactive', batchId, batchName, mediaUrl },
]

/** Incoming chat lines used by the mock realtime channel, in order. */
export const chatScripts = [
  { author: 'Ishita P.', role: /** @type {const} */ ('student'), body: 'Sir, can we take the axis through the centre of mass?' },
  { author: 'Dr. Snehasish Mohapatra', role: /** @type {const} */ ('faculty'), body: 'Yes — and notice how the weight term disappears from the torque equation.' },
  { author: 'Rohan M.', role: /** @type {const} */ ('student'), body: 'The perpendicular distance is the part I keep missing.' },
  { author: 'Meera S.', role: /** @type {const} */ ('student'), body: 'So equilibrium needs both net force and net torque to be zero?' },
  { author: 'Dr. Snehasish Mohapatra', role: /** @type {const} */ ('faculty'), body: 'Exactly. Write both conditions before substituting numbers.' },
  { author: 'Aarav D.', role: /** @type {const} */ ('student'), body: 'Could you revisit the limiting case at the end?' },
]

/** Seed queue: faculty approval and upvotes are updated by the mock service. @type {(Omit<import('../contracts/learning.js').QueueQuestion,'votedByMe'> & {voterIds:string[]})[]} */
export const seedQuestions = [
  { id: 'q-live-1', sessionId: 'ses-rot-b', author: 'Ishita P.', studentId: 'stu-ishita', body: 'Why does choosing the pivot at the hinge remove the unknown hinge force?', status: /** @type {const} */ ('approved'), upvotes: 14, voterIds: [], createdAt: relative(-18), approvedAt: relative(-16) },
  { id: 'q-live-2', sessionId: 'ses-rot-b', author: 'Rohan M.', studentId: 'stu-rohan', body: 'Can we solve the same ladder problem using energy instead of torque?', status: /** @type {const} */ ('pending'), upvotes: 7, voterIds: [], createdAt: relative(-6), approvedAt: null },
  { id: 'q-live-3', sessionId: 'ses-chem-b', author: 'Meera S.', studentId: 'stu-meera', body: 'Does the rate constant change when concentration changes?', status: /** @type {const} */ ('pending'), upvotes: 5, voterIds: [], createdAt: relative(-4), approvedAt: null },
]

/** Initial chat history shown before the first realtime tick. */
export const seedChat = [
  { id: 'chat-seed-1', sessionId: 'ses-rot-b', author: 'Dr. Snehasish Mohapatra', role: /** @type {const} */ ('faculty'), body: 'Welcome in. Keep your notebook open — we will build the torque equation together.', sentAt: relative(-24) },
  { id: 'chat-seed-2', sessionId: 'ses-rot-b', author: 'Ishita P.', role: /** @type {const} */ ('student'), body: 'Ready, sir.', sentAt: relative(-23) },
  { id: 'chat-seed-3', sessionId: 'ses-chem-b', author: 'Rituparna Das', role: /** @type {const} */ ('faculty'), body: 'This is a broadcast. Use the question queue; I will approve questions between examples.', sentAt: relative(-11) },
]
