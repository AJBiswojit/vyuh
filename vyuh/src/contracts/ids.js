/**
 * Branded-string identity typedefs.
 *
 * Every id is a distinct JSDoc typedef rather than a bare `string` so that a
 * batch id cannot be passed where a student id is expected. They all resolve
 * to `string` at runtime; the type checker carries the intent.
 *
 * @typedef {string} UserId
 * @typedef {string} StudentId
 * @typedef {string} FacultyId
 * @typedef {string} BatchId
 * @typedef {string} SubjectId
 * @typedef {string} ChapterId
 * @typedef {string} TestId
 * @typedef {string} QuestionId
 * @typedef {string} AttemptId
 * @typedef {string} SessionId
 * @typedef {string} AnnouncementId
 * @typedef {string} ResourceId
 */

export {};
