/**
 * Authentication contracts. Passwords are request-only: they never enter a
 * session, a persisted client store, or a query cache.
 *
 * @typedef {import('./user.js').User} User
 * @typedef {import('./user.js').Role} Role
 * @typedef {import('./user.js').AuthSession} AuthSession
 *
 * @typedef {Object} LoginInput
 * @property {string} email
 * @property {string} password
 *
 * @typedef {Object} SignupInput
 * @property {string} name
 * @property {string} email
 * @property {string} instituteCode
 * @property {string} batchId
 * @property {string} password
 * @property {string} [guardianEmail]
 * @property {true} termsConsent
 * @property {true} attendanceConsent
 *
 * @typedef {Object} AuthChallenge
 * @property {string} id                 Opaque challenge id, never an OTP.
 * @property {string} email
 * @property {'signup'|'reset'} purpose
 * @property {number} expiresAt          Epoch milliseconds.
 * @property {number} resendAvailableAt  Epoch milliseconds.
 * @property {string} [demoCode]         Present only in the explicit mock build.
 *
 * @typedef {Object} ResetRequestResult
 * @property {string} message           Same sentence for known and unknown emails.
 * @property {string} [demoResetPath]    Mock inbox shortcut; never sent by the API.
 *
 * @typedef {Object} SignupBatch
 * @property {string} id
 * @property {string} name
 * @property {string} track
 * @property {string} scheduleLabel
 *
 * @typedef {Object} SignupOptions
 * @property {string} instituteName
 * @property {string} demoInstituteCode
 * @property {SignupBatch[]} batches
 *
 * @typedef {Object} FacultyInvite
 * @property {string} code
 * @property {string} name
 * @property {string} email
 * @property {string} instituteName
 * @property {'active'|'expired'|'accepted'} status
 * @property {number} expiresAt
 *
 * @typedef {Object} AcceptInviteInput
 * @property {string} inviteCode
 * @property {string} password
 *
 * @typedef {Object} AuthErrorDetails
 * @property {number} [lockedUntil]
 * @property {number} [remainingAttempts]
 * @property {number} [expiresAt]
 * @property {boolean} [canUnlockDemo]
 */
export {}
