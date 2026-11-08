/**
 * Authentication contracts. Passwords are request-only: they never enter a
 * session, a persisted client store, a log, an audit entry or a query cache.
 *
 * Batch 2: one shared authentication foundation supports Admin, Faculty and
 * Student accounts. There is no public self-registration. The same salted
 * SHA-256 mock digest is reused; it is NOT a password KDF and this prototype is
 * NOT production-grade credential security.
 *
 * @typedef {import('./user.js').User} User
 * @typedef {import('./user.js').Role} Role
 * @typedef {import('./user.js').AuthSession} AuthSession
 * @typedef {import('./user.js').AccountStatus} AccountStatus
 *
 * @typedef {Object} LoginInput
 * @property {string} [email]               Demo email OR Institute ID (one identifier field).
 * @property {string} [instituteId]         Alias for the identifier; normalised by the service.
 * @property {string} password
 *
 * @typedef {Object} LoginByInstituteIdInput
 * @property {string} instituteId
 * @property {string} password
 *
 * @typedef {Object} SetupAccountInput
 *   G5 is PENDING: no consent field, policy version or legal text exists here.
 * @property {string} newPassword
 * @property {string} confirmPassword
 *
 * @typedef {Object} AccountStatusInfo
 *   Safe projection. Never a hash, never a plaintext credential.
 * @property {string|null} instituteId
 * @property {Role} role
 * @property {AccountStatus} status
 * @property {boolean} mustChangePassword
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
 *
 * @typedef {Object} IssueTemporaryPasswordInput
 *   CONTRACT ONLY (future Admin People batch; no UI or public method in Batch 2).
 *   Recovery is Admin-controlled, out-of-band, requires a reason, and does NOT
 *   automatically clear an account lockout — a separate explicit Admin unlock
 *   action is required. The credential is returned in memory once and is never
 *   persisted, logged, audited or retrievable afterwards.
 * @property {string} actorId
 * @property {string} targetAccountKey
 * @property {string} reason
 * @property {false} [clearLockout]
 *
 * @typedef {Object} CredentialAuditEvent
 *   Audit metadata ONLY. A generated credential must never appear here.
 * @property {string} id
 * @property {string} at
 * @property {string} actorId
 * @property {string} target
 * @property {string} action
 * @property {string} reason
 */

/**
 * Batch 3 (U-5) — result of the additive Admin-controlled recovery helper in
 * `src/services/mock/auth.js`. The credential is returned exactly once, in
 * memory; no retrieval API, no persistence and no audit value exists.
 * @typedef {Object} ReissuedCredential
 * @property {string} instituteId
 * @property {string} temporaryPassword
 */
export {}
