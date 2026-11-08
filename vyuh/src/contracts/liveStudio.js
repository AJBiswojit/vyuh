/**
 * VYUH LIVE STUDIO contracts (JSDoc only — the stack is plain JavaScript).
 *
 * The studio is a FRONTEND PROTOTYPE. Everything here is simulated classroom
 * data. There is no camera capture, audio, screen capture, streaming, recording
 * or backend. The shared state keyed by `sessionId` holds classroom data ONLY:
 * it never contains an authentication token, password, credential, session
 * envelope, user object or any other authentication secret.
 *
 * @typedef {'camera'|'presentation'|'whiteboard'|'content'|'split'} BroadcastScene
 *
 * @typedef {'scheduled'|'live'|'ended'} StudioStatus
 *
 * @typedef {'recorded_event'|'seeded_demo'|'unavailable'} MetricProvenance
 *
 * @typedef {Object} StudioActor
 * @property {'faculty'|'student'|'simulated'|'system'} kind
 * @property {string} id              Never an auth token; a label key only.
 * @property {string} label
 *
 * @typedef {Object} StudioEvent
 * @property {string} id
 * @property {string} type
 * @property {string} at              ISO datetime.
 * @property {StudioActor} actor
 * @property {string} detail          Plain-language description for the room log.
 * @property {Object} payload         Domain data for the pure reducer.
 *
 * @typedef {Object} StudioSetup
 * @property {string} title
 * @property {string} subjectId
 * @property {string} subjectName
 * @property {string} batchId
 * @property {string} batchName
 * @property {string} description
 * @property {string} catalogueStatus  Seeded status from the existing fixture.
 * @property {boolean} recordingPreference
 *
 * @typedef {Object} StudioMedia
 * @property {boolean} micOn
 * @property {boolean} cameraOn
 * @property {boolean} screenSharing
 * @property {boolean} recording
 *
 * @typedef {Object} ChatLine
 * @property {string} id
 * @property {string} author
 * @property {'student'|'faculty'|'system'} role
 * @property {string} body
 * @property {string} sentAt
 * @property {'seeded'|'recorded'} source
 * @property {boolean} pinned
 * @property {boolean} hidden
 *
 * @typedef {Object} StudioQuestion
 * @property {string} id
 * @property {string} author
 * @property {string} body
 * @property {'pending'|'approved'} status
 * @property {number} seedUpvotes      Labelled seeded upvotes, never merged with live votes.
 * @property {string[]} voterIds
 * @property {number} upvotes
 * @property {string} createdAt
 * @property {string|null} approvedAt
 * @property {'seeded'|'recorded'} source
 *
 * @typedef {Object} PollOption
 * @property {string} id
 * @property {string} label
 * @property {number} votes            Recorded votes only.
 *
 * @typedef {Object} StudioPoll
 * @property {string} id
 * @property {string} question
 * @property {PollOption[]} options
 * @property {'open'|'closed'} status
 * @property {string[]} voterIds
 * @property {string} createdAt
 * @property {string|null} closedAt
 *
 * @typedef {Object} StudioParticipant
 * @property {string} id
 * @property {string} name
 * @property {string} initials
 * @property {'seeded'|'mock_joined'|'simulated'} source
 * @property {'present'|'idle'|'hand_raised'|'left'} state
 * @property {boolean} handRaised
 * @property {boolean} muted
 * @property {string} lastSeenAt
 * @property {string|null} joinedAt
 *
 * @typedef {Object} StudioResource
 * @property {string} id
 * @property {string} title
 * @property {string} kind
 * @property {string} detail
 * @property {number} opens
 * @property {'seeded'|'recorded'} source
 *
 * @typedef {Object} WhiteboardShape
 * @property {string} id
 * @property {'pen'|'eraser'|'rect'|'ellipse'|'line'|'text'} type
 * @property {number} x
 * @property {number} y
 * @property {number} x2
 * @property {number} y2
 * @property {string} text
 * @property {string} at
 *
 * @typedef {Object} StudioSnapshot
 * @property {number} version
 * @property {string} sessionId
 * @property {number} revision     Bumped once per recorded event within an epoch.
 * @property {number} epoch        Bumped once per reset; ordering is (epoch, revision).
 * @property {string} updatedAt
 * @property {StudioSetup} setup
 * @property {StudioStatus} status
 * @property {BroadcastScene} activeScene
 * @property {StudioMedia} media
 * @property {{ activeTool: string, slideIndex: number }} toolbox
 * @property {ChatLine[]} chat
 * @property {StudioQuestion[]} questions
 * @property {StudioPoll[]} polls
 * @property {StudioParticipant[]} participants
 * @property {StudioResource[]} resources
 * @property {{ shapes: WhiteboardShape[], redo: WhiteboardShape[][], tool: string }} whiteboard
 * @property {{ id: string, title: string, bullets: string[] }[]} slides
 * @property {StudioEvent[]} events
 * @property {string[]} eventIds
 * @property {string|null} startedAt
 * @property {string|null} endedAt
 *
 * @typedef {Object} StudioMetric
 * @property {string} key
 * @property {string} label
 * @property {string} display
 * @property {MetricProvenance} provenance
 * @property {string} note
 * @property {boolean} available
 *
 * @typedef {Object} StudioSummary
 * @property {string} notice
 * @property {StudioMetric[]} metrics
 * @property {'not_started'|'live'|'ended'} completion
 * @property {string} completionLabel
 *
 * @typedef {Object} StudioCompatibility
 * @property {boolean} compatible
 * @property {string} sessionId
 * @property {string} reason
 * @property {Object|null} metadata
 *
 * @typedef {Object} StudioCommand
 * @property {string} type
 * @property {Object} [payload]
 * @property {string} [simulateAs]  Faculty Mirror: a labelled seeded participant.
 * @property {string} [detail]
 *
 * @typedef {Object} LiveStudioService
 * @property {(sessionId: string, role: 'faculty'|'student') => Promise<any>} getSnapshot
 * @property {(sessionId: string, role: 'faculty'|'student', listener: (snapshot: StudioSnapshot) => void) => () => void} subscribe
 * @property {(sessionId: string, role: 'faculty'|'student', command: StudioCommand) => Promise<StudioSnapshot>} dispatch
 * @property {(sessionId: string, role: 'faculty'|'student', options?: Object) => Promise<StudioSummary>} getSummary
 * @property {(sessionId: string, role: 'faculty'|'student') => Promise<StudioSnapshot>} reset
 */

export {};
