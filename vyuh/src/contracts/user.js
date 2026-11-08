/**
 * Identity contracts.
 *
 * @typedef {'student'|'faculty'|'admin'} Role
 *
 * @typedef {'JEE'|'NEET'|'NTA'} Track     Exam family the institute prepares for.
 *
 * @typedef {'active'|'invited'|'suspended'|'locked'|'archived'} AccountStatus
 *   One shared, additive vocabulary. `invited` comes from the admin import
 *   ledger; `locked` / `archived` are Batch 2 additions. Records are never
 *   deleted, so a suspended or archived account keeps its issued ID permanently.
 *
 * @typedef {Object} User
 * @property {import('./ids.js').UserId} id
 * @property {string} name                  Display name, as printed on the admit list.
 * @property {string} email
 * @property {Role} role
 * @property {string} initials              Two characters, precomputed for avatars.
 * @property {string} [phone]               E.164 without spaces.
 * @property {string} joinedAt              ISO 8601 date.
 * @property {string} [instituteCode]       Legacy DEMO field, NOT a tenant id.
 * @property {string} [batchId]
 * @property {string} [batchName]
 * @property {string} [guardianEmail]       Optional; used only for attendance summaries.
 * @property {string} [instituteId]         Issued Institute ID (Batch 2). Absent on demo seats.
 * @property {boolean} [mustChangePassword] Data-driven first-login gate. No role special case.
 * @property {string|null} [acknowledgedPolicyVersion] Unused until G5 wording + version are supplied.
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
 * @typedef {Object} InstituteAccount
 *   Canonical identity + lifecycle record. Stored in `vyuh.mock.accounts.v1`.
 *   NEVER contains a password, hash, salt, session or credential value.
 * @property {string} id
 * @property {string} key                   instituteId, or email for demo seats.
 * @property {string|null} instituteId      Login identity. Separate from rollNumber.
 * @property {Role} role
 * @property {string} name
 * @property {string} email
 * @property {string} initials
 * @property {AccountStatus} status
 * @property {boolean} mustChangePassword
 * @property {string|null} temporaryPasswordIssuedAt  Timestamp only, never the value.
 * @property {string|null} acknowledgedPolicyVersion
 * @property {'not_applicable'|'pending'|'shown'|'delivered'} credentialDelivery
 * @property {string} createdAt
 * @property {string|null} statusChangedAt
 * @property {'demo_fixture'|'institute_issued'} source
 * @property {string|null} rollNumber
 * @property {string|null} instituteCode
 * @property {string|null} batchId
 * @property {string|null} batchName
 * @property {string|null} [phone]          Batch 3 additive contact metadata. Never a login identifier.
 *
 * @typedef {Object} AuthSession
 * @property {string} token                 Opaque session token.
 * @property {User} user
 * @property {number} expiresInSeconds
 * @property {number} issuedAt             Epoch milliseconds; restoring never extends it.
 * @property {number} expiresAt            Epoch milliseconds; exactly eight hours after issue in mock mode.
 * @property {string} [instituteId]        Optional identity metadata, never a credential.
 * @property {boolean} [mustChangePassword] Survives refresh so the setup gate cannot be bypassed.
 * @property {string|null} [acknowledgedPolicyVersion] Reserved for G5; no version is invented.
 */

export {};
