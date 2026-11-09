/**
 * VYUH LIVE STUDIO seeds. New file only — every existing fixture is read, never
 * modified. All seeded values carry `source: 'seeded'` so the UI can label them
 * as demo data instead of presenting them as measured results.
 *
 * `ses-rot-b` is the ONLY id that exists in both the Faculty class fixture
 * (`facultyClasses`) and the Student live-session fixture (`liveSessions`). No
 * other id is silently mapped to a studio session.
 */
import { facultyClasses, hostParticipants } from './facultyWorkspace.js'
import { liveSessions, seedChat, seedQuestions, chatScripts } from './liveSessions.js'

/** The single canonical Faculty/Student synchronized demonstration session. */
export const CANONICAL_STUDIO_SESSION_ID = 'ses-rot-b'

/** @type {ReadonlyArray<{ id: import('../contracts/liveStudio.js').BroadcastScene, label: string, description: string }>} */
export const STUDIO_SCENES = Object.freeze([
  Object.freeze({ id: 'camera', label: 'Camera Focus', description: 'Your camera fills the stage.' }),
  Object.freeze({ id: 'presentation', label: 'Presentation + Faculty', description: 'Slides beside your camera.' }),
  Object.freeze({ id: 'whiteboard', label: 'Whiteboard Focus', description: 'The shared whiteboard fills the stage.' }),
  Object.freeze({ id: 'content', label: 'Content Only', description: 'Slides only — your camera is hidden.' }),
  Object.freeze({ id: 'split', label: 'Split Classroom', description: 'You, the slides and the class on one stage.' }),
])

/** Toolbox tools map to engagement tabs; selecting one is a real state change. */
export const STUDIO_TOOLS = Object.freeze([
  Object.freeze({ id: 'whiteboard', label: 'Whiteboard', scene: 'whiteboard' }),
  Object.freeze({ id: 'slides', label: 'Slides', scene: 'presentation' }),
  Object.freeze({ id: 'polls', label: 'Polls', scene: 'split' }),
  Object.freeze({ id: 'questions', label: 'Q&A', scene: 'split' }),
  Object.freeze({ id: 'participants', label: 'Participants', scene: 'split' }),
  Object.freeze({ id: 'resources', label: 'Resources', scene: 'content' }),
])

export const PROVENANCE_LABELS = Object.freeze({
  recorded_event: 'Recorded mock events',
  seeded_demo: 'Seeded demo data',
  unavailable: 'Unavailable',
})

export const PROTOTYPE_NOTICE =
  'Prototype session data — simulated events and labelled demo seeds. Not verified attendance or engagement results.'
export const MIRROR_NOTICE = 'Simulated student view — no Student account is signed in'
export const UNAVAILABLE_LABEL = 'Unavailable'

/** Seeded demo participants: read from the existing host roster, never invented. */
export const SEEDED_PARTICIPANTS = Object.freeze(
  hostParticipants.map((person) => Object.freeze({
    id: person.id,
    name: person.name,
    initials: person.initials,
    source: /** @type {const} */ ('seeded'),
    state: person.state === 'hand_raised' ? /** @type {const} */ ('hand_raised') : person.state === 'left' ? /** @type {const} */ ('left') : /** @type {const} */ ('present'),
    handRaised: person.state === 'hand_raised',
    muted: person.muted,
    lastSeenAt: person.lastSeenAt,
    joinedAt: null,
  })),
)

/** Seeded chat: existing fixture lines plus the existing scripted lines. */
export const SEEDED_CHAT = Object.freeze([
  ...seedChat.filter((line) => line.sessionId === CANONICAL_STUDIO_SESSION_ID),
  ...chatScripts.map((line, index) => ({ id: `studio-seed-chat-${index}`, sessionId: CANONICAL_STUDIO_SESSION_ID, author: line.author, role: line.role, body: line.body, sentAt: new Date(Date.now() - (chatScripts.length - index) * 60_000).toISOString() })),
].map((line, index) => Object.freeze({
  id: `studio-chat-${index}`,
  author: line.author,
  role: /** @type {'student'|'faculty'|'system'} */ (line.role === 'faculty' ? 'faculty' : 'student'),
  body: line.body,
  sentAt: line.sentAt,
  source: /** @type {const} */ ('seeded'),
  pinned: false,
  hidden: false,
})))

/** Seeded questions: upvotes stay separate from live votes. */
export const SEEDED_QUESTIONS = Object.freeze(
  seedQuestions
    .filter((question) => question.sessionId === CANONICAL_STUDIO_SESSION_ID)
    .map((question) => Object.freeze({
      id: question.id,
      author: question.author,
      body: question.body,
      status: /** @type {'pending'|'approved'} */ (question.status),
      seedUpvotes: question.upvotes,
      voterIds: Object.freeze([]),
      upvotes: question.upvotes,
      createdAt: question.createdAt,
      approvedAt: question.approvedAt,
      source: /** @type {const} */ ('seeded'),
    })),
)

/** Poll templates carry no results. A poll only gets votes from recorded events. */
export const SEEDED_POLL_TEMPLATES = Object.freeze([
  Object.freeze({ question: 'Which condition is required for rotational equilibrium?', options: Object.freeze(['Net force is zero', 'Net torque is zero', 'Both of these', 'Neither']) }),
  Object.freeze({ question: 'Where should we place the pivot for the ladder problem?', options: Object.freeze(['At the hinge', 'At the centre of mass', 'At the wall contact', 'Anywhere']) }),
  Object.freeze({ question: 'Ready to move to the problem set?', options: Object.freeze(['Yes, go ahead', 'One more example', 'Please repeat the derivation']) }),
])

export const SEEDED_SLIDES = Object.freeze([
  Object.freeze({ id: 'slide-1', title: 'Torque and equilibrium', bullets: Object.freeze(['Define torque about a chosen pivot', 'Write both equilibrium conditions', 'Substitute only after the equations are set']) }),
  Object.freeze({ id: 'slide-2', title: 'Choosing a pivot', bullets: Object.freeze(['A pivot at the hinge removes the unknown hinge force', 'Perpendicular distance decides the moment arm', 'The weight term can disappear from the equation']) }),
  Object.freeze({ id: 'slide-3', title: 'Worked ladder problem', bullets: Object.freeze(['Draw the free-body diagram first', 'Resolve forces horizontally and vertically', 'Take moments about the hinge']) }),
  Object.freeze({ id: 'slide-4', title: 'Practice set B', bullets: Object.freeze(['Three questions, increasing difficulty', 'Use the formula sheet resource', 'Submit doubts through the question queue']) }),
])

export const SEEDED_RESOURCES = Object.freeze([
  Object.freeze({ id: 'res-formula', title: 'Rotational dynamics formula sheet', kind: 'Reference', detail: 'Seeded one-page reference for this session.', opens: 0, source: /** @type {const} */ ('seeded') }),
  Object.freeze({ id: 'res-slides', title: 'Session slides (4 pages)', kind: 'Slides', detail: 'Seeded slide deck used by the presentation scenes.', opens: 0, source: /** @type {const} */ ('seeded') }),
  Object.freeze({ id: 'res-practice', title: 'Problem set B', kind: 'Practice', detail: 'Seeded practice questions for after class.', opens: 0, source: /** @type {const} */ ('seeded') }),
])

/**
 * Metadata for the canonical session, read from BOTH existing fixtures. This is
 * a read-only join: no fixture is edited and no relationship is invented.
 */
export function canonicalSessionMetadata() {
  const faculty = facultyClasses.find((item) => item.id === CANONICAL_STUDIO_SESSION_ID) ?? null
  const student = liveSessions.find((item) => item.id === CANONICAL_STUDIO_SESSION_ID) ?? null
  if (!faculty || !student) return null
  return Object.freeze({
    sessionId: CANONICAL_STUDIO_SESSION_ID,
    title: faculty.title,
    subjectId: faculty.subjectId,
    subjectName: faculty.subjectName,
    batchId: faculty.batchId,
    batchName: faculty.batchName,
    facultyName: faculty.facultyName,
    catalogueStatus: student.status,
    mode: student.mode,
    mediaUrl: student.mediaUrl,
    posterUrl: student.mediaUrl.replace('.mp4', '-poster.svg'),
    resourcesAttached: student.resourcesAttached,
    durationMinutes: student.durationMinutes,
  })
}
