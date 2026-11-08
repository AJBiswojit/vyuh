/**
 * Student Classroom hook. Fixes the role to `student`, derives an honest
 * read-only view of the shared classroom, and labels the attendance view as a
 * seeded/simulated register result — never as a recorded Studio event.
 * It never imports fixtures or mock services.
 *
 * The existing learning hooks (join/leave, attendance strip, attention toast,
 * chat, questions, upvotes, recordings) keep their own service paths unchanged.
 */
import { useSharedSession } from '../../live/hooks/useSharedSession.js'

export const STUDENT_CLASSROOM_ROLE = 'student'

/**
 * @param {import('@/contracts/liveStudio.js').StudioSnapshot|null} snapshot
 * @param {any} metadata
 */
export function selectClassroomView(snapshot, metadata) {
  if (!snapshot) {
    return {
      scenes: metadata?.scenes ?? [], activeSceneLabel: '', visibleChat: [],
      visibleQuestions: [], openPolls: [], closedPolls: [], participants: [],
      resources: [], shapes: [], slide: null, prototypeNotice: metadata?.prototypeNotice ?? '',
      provenanceLabels: metadata?.provenanceLabels ?? {},
    }
  }
  return {
    scenes: metadata?.scenes ?? [],
    activeSceneLabel: (metadata?.scenes ?? []).find((scene) => scene.id === snapshot.activeScene)?.label ?? snapshot.activeScene,
    visibleChat: snapshot.chat.filter((line) => !line.hidden),
    /* R12: Students see only Faculty-approved questions. Pending questions —
       including a Student's own just-submitted ones — stay in the moderation
       queue until Faculty approves them. `EngagementPanel` consumes this list. */
    visibleQuestions: snapshot.questions.filter((question) => question.status === 'approved'),
    openPolls: snapshot.polls.filter((poll) => poll.status === 'open'),
    closedPolls: snapshot.polls.filter((poll) => poll.status === 'closed'),
    participants: snapshot.participants,
    resources: snapshot.resources,
    shapes: snapshot.whiteboard.shapes,
    slide: snapshot.slides[snapshot.toolbox.slideIndex] ?? snapshot.slides[0] ?? null,
    prototypeNotice: snapshot.prototypeNotice ?? metadata?.prototypeNotice ?? '',
    provenanceLabels: metadata?.provenanceLabels ?? {},
  }
}

/**
 * @param {string} sessionId
 * @param {import('@/contracts/learning.js').LiveAttendanceState|null} [attendanceState]
 */
export function useLiveClassroom(sessionId, attendanceState = null) {
  /* R11: presencePercent/verdict come from the EXISTING attendance prototype's
     seeded + simulated state (learningMath.createAttendanceState), not from a
     recorded Studio event. Label it as seeded demo data and say so in the note. */
  const attendance = attendanceState
    ? {
      value: `Simulated presence ${attendanceState.presencePercent}% (${attendanceState.verdict})`,
      provenance: /** @type {const} */ ('seeded_demo'),
      note: 'Simulated presence from the existing attendance prototype (seeded/simulated state, not a recorded Studio event). Not verified attendance or engagement.',
    }
    : null
  const session = useSharedSession(sessionId, STUDENT_CLASSROOM_ROLE, { attendance })
  return { ...session, view: selectClassroomView(session.snapshot, session.metadata) }
}
