/**
 * VYUH LIVE STUDIO — canonical session compatibility resolver.
 *
 * `ses-rot-b` is the ONLY session id that exists, with matching batch, media
 * and status, in BOTH the Faculty class fixture and the Student live-session
 * fixture. Every other id keeps its existing product behaviour: the existing
 * class/live-room tools remain available and Studio-specific functionality
 * reports an honest unavailable state. No silent id mapping, no alias bypass.
 */
import {
  facultyClasses, liveSessions, CANONICAL_STUDIO_SESSION_ID, STUDIO_SCENES, STUDIO_TOOLS,
  SEEDED_POLL_TEMPLATES, PROVENANCE_LABELS, PROTOTYPE_NOTICE, MIRROR_NOTICE, UNAVAILABLE_LABEL,
} from '../../mock-data/index.js'

/**
 * @param {string|null|undefined} sessionId
 * @returns {import('../../contracts/liveStudio.js').StudioCompatibility}
 */
export function resolveStudioSession(sessionId) {
  const requested = typeof sessionId === 'string' ? sessionId.trim() : ''
  if (!requested) {
    return { compatible: false, sessionId: '', reason: 'No session id was provided.', metadata: null }
  }
  if (requested !== CANONICAL_STUDIO_SESSION_ID) {
    return {
      compatible: false,
      sessionId: requested,
      reason: `Studio synchronization is available only for the shared demo session ${CANONICAL_STUDIO_SESSION_ID}. Existing class and live-room tools remain available for this session.`,
      metadata: null,
    }
  }

  const faculty = facultyClasses.find((item) => item.id === requested) ?? null
  const student = liveSessions.find((item) => item.id === requested) ?? null
  if (!faculty || !student) {
    return {
      compatible: false, sessionId: requested,
      reason: 'The shared demo session is missing from one of the existing fixtures, so Studio state cannot be synchronized.',
      metadata: null,
    }
  }
  const checks = {
    title: faculty.title === student.title,
    batch: faculty.batchId === student.batchId,
    status: faculty.status === student.status,
    media: faculty.mediaUrl === student.mediaUrl,
  }
  if (Object.values(checks).some((ok) => !ok)) {
    return {
      compatible: false, sessionId: requested,
      reason: 'The Faculty and Student fixtures no longer describe the same session, so Studio state cannot be synchronized.',
      metadata: null,
    }
  }

  return {
    compatible: true,
    sessionId: requested,
    reason: `Shared Faculty and Student demo session ${requested}.`,
    metadata: Object.freeze({
      sessionId: requested,
      title: faculty.title,
      subjectId: faculty.subjectId,
      subjectName: faculty.subjectName,
      batchId: faculty.batchId,
      batchName: faculty.batchName,
      facultyName: faculty.facultyName,
      facultyId: faculty.facultyId,
      catalogueStatus: student.status,
      mode: student.mode,
      mediaUrl: student.mediaUrl,
      posterUrl: student.mediaUrl.replace('.mp4', '-poster.svg'),
      resourcesAttached: student.resourcesAttached,
      durationMinutes: student.durationMinutes,
      recordingId: faculty.recordingId,
      joinUrl: student.joinUrl,
      studentCapacity: student.capacity,
      /* Static labels travel with the service response so presentation files
         never import src/mock-data. Single source of truth stays in the seeds. */
      scenes: STUDIO_SCENES.map((scene) => ({ ...scene })),
      tools: STUDIO_TOOLS.map((tool) => ({ ...tool })),
      pollTemplates: SEEDED_POLL_TEMPLATES.map((template) => ({ question: template.question, options: [...template.options] })),
      provenanceLabels: { ...PROVENANCE_LABELS },
      prototypeNotice: PROTOTYPE_NOTICE,
      mirrorNotice: MIRROR_NOTICE,
      unavailableLabel: UNAVAILABLE_LABEL,
    }),
  }
}

/** Structured, explicit assertion used by every mutating service call. */
export function assertCompatible(sessionId) {
  const resolution = resolveStudioSession(sessionId)
  if (!resolution.compatible) {
    const error = new Error(resolution.reason)
    error.name = 'ServiceError'
    Object.assign(error, { code: 'studio_session_unavailable', status: 404, retryable: false })
    throw error
  }
  return resolution
}

/** @returns {string[]} Faculty fixture ids that are NOT studio-synchronized. */
export function legacyFacultySessionIds() {
  return facultyClasses.map((item) => item.id).filter((id) => id !== CANONICAL_STUDIO_SESSION_ID)
}

/** @returns {string[]} Student fixture ids that are NOT studio-synchronized. */
export function legacyStudentSessionIds() {
  return liveSessions.map((item) => item.id).filter((id) => id !== CANONICAL_STUDIO_SESSION_ID)
}
