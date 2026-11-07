/**
 * Identity contracts.
 *
 * @typedef {'student'|'faculty'|'admin'} Role
 *
 * @typedef {'JEE'|'NEET'|'NTA'} Track     Exam family the institute prepares for.
 *
 * @typedef {Object} User
 * @property {import('./ids.js').UserId} id
 * @property {string} name                  Display name, as printed on the admit list.
 * @property {string} email
 * @property {Role} role
 * @property {string} initials              Two characters, precomputed for avatars.
 * @property {string} [phone]               E.164 without spaces.
 * @property {string} joinedAt              ISO 8601 date.
 * @property {string} [instituteCode]
 * @property {string} [batchId]
 * @property {string} [batchName]
 * @property {string} [guardianEmail]       Optional; used only for attendance summaries.
 *
 * @typedef {Object} Student
 * @property {import('./ids.js').StudentId} id
 * @property {string} name
 * @property {string} rollNumber            Institute roll, e.g. 'VY-24-0187'.
 * @property {string} initials
 * @property {import('./ids.js').BatchId} batchId
 * @property {string} batchName
 * @property {Track} track
 * @property {'dropper'|'class12'|'class11'} cohort
 * @property {string} avatarTone            One of the five semantic keys, never a new hue.
 *
 * @typedef {Object} Credentials
 * @property {string} email
 * @property {string} password
 *
 * @typedef {Object} AuthSession
 * @property {string} token                 Opaque session token.
 * @property {User} user
 * @property {number} expiresInSeconds
 * @property {number} issuedAt             Epoch milliseconds; restoring never extends it.
 * @property {number} expiresAt            Epoch milliseconds; exactly eight hours after issue in mock mode.
 */

export {};
