/**
 * VYUH LIVE STUDIO — provenance-aware summary. Pure: no storage, no identity,
 * no React. Every number is either derived from recorded mock events or clearly
 * labelled as seeded demo data; anything else is reported as Unavailable.
 *
 * No verified attendance, participant count, engagement percentage or score is
 * ever inferred, rounded up, estimated or invented.
 */
import { PROTOTYPE_NOTICE, UNAVAILABLE_LABEL, PROVENANCE_LABELS } from '../../mock-data/index.js'

/** @param {number} ms */
function elapsed(ms) {
  if (!Number.isFinite(ms) || ms < 0) return UNAVAILABLE_LABEL
  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  if (hours) return `${hours}h ${minutes}m`
  if (minutes) return `${minutes}m ${rest}s`
  return `${rest}s`
}

/** @param {any[]} events @param {string} type */
function eventsOf(events, type) { return events.filter((event) => event.type === type) }

/**
 * Only provenances with a real label may ever be displayed. An unknown tag
 * (including a caller inventing one) safely degrades to `unavailable` rather
 * than rendering an undefined badge or mislabelling a number.
 * @param {unknown} provenance
 * @returns {import('../../contracts/liveStudio.js').MetricProvenance}
 */
function safeProvenance(provenance) {
  return typeof provenance === 'string' && Object.prototype.hasOwnProperty.call(PROVENANCE_LABELS, provenance)
    ? /** @type {import('../../contracts/liveStudio.js').MetricProvenance} */ (provenance)
    : 'unavailable'
}

/**
 * Attendance in this prototype has NO recorded Studio event source: the only
 * inputs are the seeded host roster and the simulated learning attendance
 * state. Restricting this view to `seeded_demo` makes it impossible to present
 * a simulated or seeded attendance figure as a recorded measurement.
 */
const ATTENDANCE_PROVENANCE = 'seeded_demo'

/**
 * @param {string} key @param {string} label @param {string} display
 * @param {import('../../contracts/liveStudio.js').MetricProvenance} provenance
 * @param {string} note @param {boolean} [available]
 */
function metric(key, label, display, provenance, note, available = true) {
  const safe = safeProvenance(provenance)
  return { key, label, display, provenance: safe, provenanceLabel: PROVENANCE_LABELS[safe], note, available }
}

/** @param {string} key @param {string} label @param {string} [note] */
function unavailable(key, label, note = 'No recorded mock events for this measure yet.') {
  return metric(key, label, UNAVAILABLE_LABEL, 'unavailable', note, false)
}

/**
 * @param {import('../../contracts/liveStudio.js').StudioSnapshot} state
 * @param {{ now?: number, attendance?: { value: string, provenance: import('../../contracts/liveStudio.js').MetricProvenance, note: string }|null }} [options]
 * @returns {import('../../contracts/liveStudio.js').StudioSummary}
 */
export function buildSessionSummary(state, options = {}) {
  const now = options.now ?? Date.now()
  const events = Array.isArray(state?.events) ? state.events : []
  const started = state?.startedAt ? eventsOf(events, 'session_started')[0] : null
  const ended = state?.endedAt ? eventsOf(events, 'session_ended')[0] : null

  const metrics = []

  /* Duration — only from the lifecycle timestamps that the reducer wrote from
     recorded Go Live / End Session events. */
  if (started && state.startedAt) {
    const from = Date.parse(state.startedAt)
    const to = state.endedAt ? Date.parse(state.endedAt) : now
    const label = ended ? 'Session duration' : 'Elapsed since Go Live'
    metrics.push(metric('duration', label, Number.isFinite(from) && Number.isFinite(to) ? elapsed(to - from) : UNAVAILABLE_LABEL,
      'recorded_event', 'Calculated from the recorded Go Live and End Session mock events.'))
  } else {
    metrics.push(unavailable('duration', 'Session duration', 'Go Live has not been recorded in this prototype session.'))
  }

  /* Participant information — three separate, honestly labelled sources. */
  const seeded = (state.participants ?? []).filter((person) => person.source === 'seeded')
  const joins = eventsOf(events, 'participant_joined')
  const realJoins = joins.filter((event) => event.actor.kind === 'student')
  const simulatedJoins = joins.filter((event) => event.actor.kind === 'simulated')
  metrics.push(metric('seeded_roster', 'Seeded demo roster', `${seeded.length} labelled demo rows`, 'seeded_demo',
    'Names copied from the existing host roster fixture. Not verified attendance or a participant count.'))
  metrics.push(metric('mock_joins', 'Mock joins from Student Classroom', `${realJoins.length}`, 'recorded_event',
    'Counted from recorded mock join events; a single browser context can produce one join.'))
  metrics.push(metric('simulated_joins', 'Simulated participant joins', `${simulatedJoins.length}`, 'recorded_event',
    'Labelled simulation events triggered in the Faculty Classroom Mirror.'))

  /* Attendance information — only when a caller supplies an explicitly labelled
     view of the existing mock register. Never inferred from chat or video.
     Unknown provenance, or a claim that attendance came from recorded Studio
     events, falls back to Unavailable so no simulated value is mislabelled. */
  if (options.attendance?.value) {
    const supplied = safeProvenance(options.attendance.provenance)
    const allowed = supplied === ATTENDANCE_PROVENANCE
    metrics.push(allowed
      ? metric('attendance_view', 'Attendance register view', options.attendance.value,
        ATTENDANCE_PROVENANCE, options.attendance.note)
      : unavailable('attendance_view', 'Attendance register view',
        'The attendance view was supplied without a supported seeded/simulated provenance; no attendance or engagement is claimed.'))
  } else {
    metrics.push(unavailable('attendance_view', 'Attendance register view',
      'The mock attendance register was not supplied for this summary; no verified attendance is claimed.'))
  }

  /* Chat activity — recorded sends separated from seeded demo lines. */
  const chatSends = eventsOf(events, 'chat_sent')
  const seededChat = (state.chat ?? []).filter((line) => line.source === 'seeded')
  metrics.push(metric('chat_recorded', 'Chat messages (recorded)', `${chatSends.length}`, 'recorded_event',
    'Counted from recorded mock chat events, including labelled Mirror simulations.'))
  metrics.push(metric('chat_seeded', 'Chat messages (seeded)', `${seededChat.length} demo rows`, 'seeded_demo',
    'Seeded example lines; not engagement results.'))

  /* Question activity — seeded queue separate from recorded submissions. */
  const questionAdds = eventsOf(events, 'question_added')
  const approvals = eventsOf(events, 'question_approved')
  const seededQuestions = (state.questions ?? []).filter((question) => question.source === 'seeded')
  metrics.push(metric('questions_recorded', 'Questions submitted (recorded)', `${questionAdds.length}`, 'recorded_event',
    `Counted from recorded mock submissions. ${approvals.length} approval events recorded.`))
  metrics.push(metric('questions_seeded', 'Question queue (seeded)', `${seededQuestions.length} demo rows`, 'seeded_demo',
    'Seeded queue entries with seeded upvote counts, kept separate from live votes.'))

  /* Poll responses — only recorded votes, never a manufactured participation rate. */
  const polls = state.polls ?? []
  const responses = polls.reduce((total, poll) => total + (poll.voterIds?.length ?? 0), 0)
  if (polls.length === 0) {
    metrics.push(unavailable('poll_responses', 'Poll responses', 'No poll has been created in this prototype session.'))
  } else {
    metrics.push(metric('poll_responses', 'Poll responses', `${responses} recorded vote${responses === 1 ? '' : 's'} across ${polls.length} poll${polls.length === 1 ? '' : 's'}`,
      'recorded_event', 'Counted from recorded mock vote events. No participation percentage or score is claimed.'))
  }

  /* Whiteboard / resources are recorded-event counts, never fabricated scores. */
  const shapes = events.filter((event) => event.type === 'whiteboard_shape' || event.type === 'whiteboard_erase' || event.type === 'whiteboard_clear' || event.type === 'whiteboard_undo')
  const opens = eventsOf(events, 'resource_opened')
  metrics.push(metric('whiteboard_strokes', 'Whiteboard actions', `${shapes.length}`, 'recorded_event',
    'Recorded pen, shape, eraser, text, undo and clear actions on the shared board.'))
  metrics.push(metric('resource_opens', 'Resource opens', `${opens.length}`, 'recorded_event',
    'Recorded mock opens of seeded and added resources.'))

  const completion = ended ? 'ended' : started ? 'live' : 'not_started'
  const completionLabel = ended ? 'Ended (recorded)' : started ? 'Live (recorded Go Live)' : 'Not started (no Go Live recorded)'

  return { notice: PROTOTYPE_NOTICE, metrics, completion, completionLabel }
}
