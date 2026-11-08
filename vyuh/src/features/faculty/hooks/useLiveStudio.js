/**
 * Faculty Live Studio hook. Fixes the role to `faculty`, derives the view model
 * from the shared snapshot, and supplies an explicitly labelled attendance view
 * for the summary. It never imports fixtures or mock services directly.
 */
import { useSharedSession } from '../../live/hooks/useSharedSession.js'

export const FACULTY_STUDIO_ROLE = 'faculty'

/**
 * Pure view selectors for the dark Studio, the Classroom Mirror and the summary.
 * @param {import('@/contracts/liveStudio.js').StudioSnapshot|null} snapshot
 * @param {any} metadata
 */
export function selectFacultyView(snapshot, metadata) {
  if (!snapshot) {
    return {
      scenes: metadata?.scenes ?? [], tools: metadata?.tools ?? [], pollTemplates: metadata?.pollTemplates ?? [],
      activeSceneLabel: '', visibleChat: [], pendingQuestions: [], openPolls: [], closedPolls: [],
      roomLog: [], participants: [], resources: [], shapes: [], slide: null, prototypeNotice: metadata?.prototypeNotice ?? '',
      mirrorNotice: metadata?.mirrorNotice ?? '', provenanceLabels: metadata?.provenanceLabels ?? {},
    }
  }
  return {
    scenes: metadata?.scenes ?? [], tools: metadata?.tools ?? [], pollTemplates: metadata?.pollTemplates ?? [],
    activeSceneLabel: (metadata?.scenes ?? []).find((scene) => scene.id === snapshot.activeScene)?.label ?? snapshot.activeScene,
    visibleChat: snapshot.chat.filter((line) => !line.hidden),
    pendingQuestions: snapshot.questions.filter((question) => question.status === 'pending'),
    openPolls: snapshot.polls.filter((poll) => poll.status === 'open'),
    closedPolls: snapshot.polls.filter((poll) => poll.status === 'closed'),
    roomLog: [...snapshot.events].reverse().slice(0, 12).map((event) => ({ id: event.id, at: event.at, label: event.detail, kind: event.actor.kind })),
    participants: snapshot.participants,
    resources: snapshot.resources,
    shapes: snapshot.whiteboard.shapes,
    slide: snapshot.slides[snapshot.toolbox.slideIndex] ?? snapshot.slides[0] ?? null,
    prototypeNotice: snapshot.prototypeNotice ?? metadata?.prototypeNotice ?? '',
    mirrorNotice: metadata?.mirrorNotice ?? '',
    provenanceLabels: metadata?.provenanceLabels ?? {},
  }
}

/**
 * @param {string} sessionId
 * @param {{ present: number, idle: number, left: number }|null} [hostCounts]
 */
export function useLiveStudio(sessionId, hostCounts = null) {
  const attendance = hostCounts
    ? {
      value: `${hostCounts.present} present / ${hostCounts.idle} idle / ${hostCounts.left} left (seeded roster)`,
      provenance: /** @type {const} */ ('seeded_demo'),
      note: 'Copied from the existing seeded host-console roster counts. Not verified attendance or engagement results.',
    }
    : null
  const session = useSharedSession(sessionId, FACULTY_STUDIO_ROLE, { attendance })
  return { ...session, view: selectFacultyView(session.snapshot, session.metadata) }
}
