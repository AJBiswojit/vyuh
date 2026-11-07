/**
 * Live class contracts.
 *
 * @typedef {'scheduled'|'live'|'ended'} SessionStatus
 *
 * @typedef {Object} LiveSession
 * @property {import('./ids.js').SessionId} id
 * @property {string} title                 'Rotational Dynamics — problem set B'.
 * @property {import('./ids.js').SubjectId} subjectId
 * @property {string} subjectName
 * @property {string} facultyName
 * @property {SessionStatus} status
 * @property {string} startsAt              ISO 8601 datetime.
 * @property {number} durationMinutes
 * @property {number} attendingCount
 * @property {number} capacity
 * @property {string} joinUrl
 * @property {boolean} resourcesAttached
 * @property {'interactive'|'broadcast'} mode
 * @property {string} batchId
 * @property {string} batchName
 * @property {string} mediaUrl                  Looping local sample media for the mock stage.
 */

export {};
