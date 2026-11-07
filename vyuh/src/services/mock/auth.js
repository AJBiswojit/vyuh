import {
  DEMO_EMAILS, DEMO_PASSWORD, DEMO_OTP, EXPIRED_DEMO_OTP, DEMO_INSTITUTE_CODE, DEMO_INVITE_CODE,
  LOCKED_DEMO_EMAIL, OFFLINE_DEMO_EMAIL, users, signupBatches, facultyInvitations,
  institute, demoScenarios, clone, simulate,
} from '../../mock-data/index.js'
import { readPersistedSession, SESSION_LIFETIME_MS } from '../../shared/lib/sessionPersistence.js'
import { loginSchema, signupSchema, otpSchema, forgotPasswordSchema, resetPasswordRequestSchema, acceptInviteRequestSchema } from '../authSchemas.js'
import { serviceError } from './errors.js'

/**
 * Explicitly simulated authentication. No real credentials or attendance events
 * leave this browser. Fixtures are public; newly created passwords are salted
 * and digested before local storage, but this is NOT a production auth system.
 * @typedef {import('../types.js').AuthService} AuthService
 * @typedef {import('../../contracts/user.js').AuthSession} AuthSession
 * @typedef {import('../../contracts/auth.js').AuthChallenge} AuthChallenge
 */
export const demoAccounts = DEMO_EMAILS
export { demoScenarios, DEMO_PASSWORD as demoCredentials, DEMO_INSTITUTE_CODE as demoInstituteCode, DEMO_OTP as demoOtp, EXPIRED_DEMO_OTP as expiredDemoOtp }
export const demoInviteCode = DEMO_INVITE_CODE

const DB_KEY = 'vyuh.mock.auth.v1'
const OTP_LIFETIME_MS = 10 * 60 * 1000
const RESET_LIFETIME_MS = 15 * 60 * 1000
const LOCK_MS = 15 * 60 * 1000
const RESEND_MS = 30 * 1000
const MAX_ATTEMPTS = 5
const GENERIC_RESET = 'If an account exists for this email, a password reset link is on its way. Check your inbox and spam folder.'

/** @type {{ accounts: Record<string, any>, attempts: Record<string, { count: number, lockedUntil: number }>, challenges: Record<string, any>, resets: Record<string, any>, acceptedInvites: string[] }} */
let db = { accounts: {}, attempts: {}, challenges: {}, resets: {}, acceptedInvites: [] }
try {
  const stored = JSON.parse(localStorage.getItem(DB_KEY) ?? 'null')
  if (stored && typeof stored === 'object') {
    db = {
      accounts: stored.accounts ?? {}, attempts: stored.attempts ?? {},
      challenges: stored.challenges ?? {}, resets: stored.resets ?? {},
      acceptedInvites: Array.isArray(stored.acceptedInvites) ? stored.acceptedInvites : [],
    }
  }
} catch { /* A corrupt mock database never blocks the public login screen. */ }

function save() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch { /* Keep the demo usable in memory. */ }
}
const normalize = (/** @type {string} */ email) => email.trim().toLowerCase()
const id = () => `mock-${crypto.randomUUID()}`

/** @param {string} code @param {string} message @param {number} status @param {Record<string, number | boolean>} [details] */
function fail(code, message, status = 400, details = {}) {
  const error = serviceError(code, message, status)
  Object.assign(error, details, { retryable: status === 0 || status >= 500 })
  return error
}
function networkFailure() {
  return fail('network_unavailable', 'We could not reach the sign-in service. Check your connection and try again. Your attempt was not counted.', 0)
}
/** @param {string} email */
function findAccount(email) {
  const user = Object.values(users).find((candidate) => candidate.email === email)
  if (user) return { user: clone(user), fixture: true, ...db.accounts[email] }
  return db.accounts[email] ?? null
}
/** @param {string} password @param {string} salt */
async function digest(password, salt) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`))
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
/** @param {import('../../contracts/user.js').User} user @returns {AuthSession} */
function sessionFor(user) {
  const issuedAt = Date.now()
  return { token: `demo.${crypto.randomUUID()}`, user: clone(user), issuedAt, expiresAt: issuedAt + SESSION_LIFETIME_MS, expiresInSeconds: SESSION_LIFETIME_MS / 1000 }
}
/** @param {any} account @param {string} password */
async function passwordMatches(account, password) {
  if (account.passwordHash) return account.passwordHash === await digest(password, account.salt)
  return account.fixture && password === DEMO_PASSWORD
}
/** @param {string} email @param {string} password */
async function setPassword(email, password) {
  const account = findAccount(email)
  const salt = crypto.randomUUID()
  db.accounts[email] = { ...account, salt, passwordHash: await digest(password, salt) }
  delete db.attempts[email]
  save()
}
/** @param {string} email @param {'signup'|'reset'} purpose */
function makeChallenge(email, purpose) {
  const now = Date.now()
  // A resend invalidates the previous code for the same email and purpose.
  for (const [key, challenge] of Object.entries(db.challenges)) {
    if (challenge.email === email && challenge.purpose === purpose) delete db.challenges[key]
  }
  const challenge = { id: id(), email, purpose, code: DEMO_OTP, expiresAt: now + OTP_LIFETIME_MS, resendAvailableAt: now + RESEND_MS, attempts: 0 }
  db.challenges[challenge.id] = challenge
  save()
  return challenge
}
/** @param {any} challenge @returns {AuthChallenge} */
function publicChallenge(challenge) {
  return { id: challenge.id, email: challenge.email, purpose: challenge.purpose, expiresAt: challenge.expiresAt, resendAvailableAt: challenge.resendAvailableAt, demoCode: DEMO_OTP }
}
/** @param {string} challengeId */
function requireChallenge(challengeId) {
  const challenge = db.challenges[challengeId]
  if (!challenge) throw fail('challenge_not_found', 'This verification request is no longer available. Start again to receive a new code.', 404)
  if (challenge.expiresAt <= Date.now()) throw fail('otp_expired', 'This code has expired. Request a new code to continue.', 410, { expiresAt: challenge.expiresAt })
  return challenge
}

/** @type {AuthService} */
export const authService = {
  login(input) {
    return simulate(async () => {
      const credentials = loginSchema.parse(input)
      const email = credentials.email
      if (email === OFFLINE_DEMO_EMAIL) throw networkFailure()
      const lock = db.attempts[email]
      if (email === LOCKED_DEMO_EMAIL || (lock?.lockedUntil ?? 0) > Date.now()) {
        const lockedUntil = email === LOCKED_DEMO_EMAIL ? Date.now() + LOCK_MS : lock.lockedUntil
        throw fail('account_locked', 'This account is temporarily locked after too many failed attempts. Wait for the timer, or reset your password.', 423, { lockedUntil, canUnlockDemo: false })
      }
      const account = findAccount(email)
      if (!account || !(await passwordMatches(account, credentials.password))) {
        const previous = db.attempts[email]
        const count = (previous?.count ?? 0) + 1
        const locked = count >= MAX_ATTEMPTS
        db.attempts[email] = { count: locked ? 0 : count, lockedUntil: locked ? Date.now() + LOCK_MS : 0 }
        save()
        if (locked) throw fail('account_locked', 'Five failed attempts have temporarily locked this account. Try again in 15 minutes, or reset your password.', 423, { lockedUntil: db.attempts[email].lockedUntil, canUnlockDemo: true })
        throw fail('invalid_credentials', `That email and password do not match. ${MAX_ATTEMPTS - count} ${MAX_ATTEMPTS - count === 1 ? 'attempt remains' : 'attempts remain'} before a temporary lock.`, 401, { remainingAttempts: MAX_ATTEMPTS - count })
      }
      if (account.pending) throw fail('email_unverified', 'Verify your email before signing in. Use the verification link below to continue.', 403)
      delete db.attempts[email]
      save()
      return sessionFor(account.user)
    })
  },

  signup(input) {
    return simulate(async () => {
      const values = signupSchema.parse(input)
      if (values.instituteCode !== DEMO_INSTITUTE_CODE) throw fail('invalid_institute', 'That institute code is not recognised. Check the code on your enrolment slip.', 400)
      if (!signupBatches.some((batch) => batch.id === values.batchId)) throw fail('invalid_batch', 'That batch is no longer open for enrolment. Choose another batch.', 400)
      if (findAccount(values.email)) throw fail('email_exists', 'An account already uses this email. Sign in or request a password reset instead.', 409)
      const batch = signupBatches.find((candidate) => candidate.id === values.batchId)
      const salt = crypto.randomUUID()
      /** @type {import('../../contracts/user.js').User} */
      const user = {
        id: `stu-${crypto.randomUUID()}`, name: values.name, email: values.email, role: 'student',
        initials: values.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(),
        joinedAt: new Date().toISOString().slice(0, 10), instituteCode: values.instituteCode,
        batchId: values.batchId, batchName: batch?.name, guardianEmail: values.guardianEmail,
      }
      db.accounts[values.email] = { user, salt, passwordHash: await digest(values.password, salt), pending: true }
      save()
      return publicChallenge(makeChallenge(values.email, 'signup'))
    })
  },

  getChallenge(challengeId) {
    return simulate(() => {
      const challenge = db.challenges[challengeId]
      if (!challenge) throw fail('challenge_not_found', 'This verification request is no longer available. Start again to receive a new code.', 404)
      // Return expired requests too, so the page can offer its resend action.
      return publicChallenge(challenge)
    }, { faulty: false })
  },

  verifyOtp(input) {
    return simulate(async () => {
      const values = otpSchema.parse(input)
      const challenge = requireChallenge(values.challengeId)
      if (values.code === EXPIRED_DEMO_OTP) throw fail('otp_expired', 'This demo code has expired. Request a fresh code below; your details are still saved.', 410)
      if (values.code !== challenge.code) {
        challenge.attempts += 1
        if (challenge.attempts >= MAX_ATTEMPTS) {
          delete db.challenges[challenge.id]
          save()
          throw fail('otp_attempts_exceeded', 'Too many incorrect codes. Start a new verification request to continue.', 429)
        }
        save()
        throw fail('invalid_otp', `That code is not correct. Check all six digits; ${MAX_ATTEMPTS - challenge.attempts} attempts remain.`, 400)
      }
      if (challenge.purpose === 'signup') {
        const account = db.accounts[challenge.email]
        if (!account) throw fail('challenge_not_found', 'This signup is no longer available. Create your account again.', 404)
        account.pending = false
        delete db.challenges[challenge.id]
        save()
        return sessionFor(account.user)
      }
      const token = crypto.randomUUID()
      db.resets[token] = { email: challenge.email, expiresAt: Date.now() + RESET_LIFETIME_MS }
      delete db.challenges[challenge.id]
      save()
      return { email: challenge.email, resetPath: `/reset-password?token=${encodeURIComponent(token)}` }
    })
  },

  resendOtp(challengeId) {
    return simulate(() => {
      const previous = db.challenges[challengeId]
      if (!previous) throw fail('challenge_not_found', 'This request has ended. Start again to receive a new code.', 404)
      if (previous.resendAvailableAt > Date.now()) throw fail('resend_too_soon', 'Please wait for the resend timer before requesting another code.', 429)
      return publicChallenge(makeChallenge(previous.email, previous.purpose))
    })
  },

  requestReset(input) {
    return simulate(() => {
      const { email } = forgotPasswordSchema.parse(input)
      if (email === OFFLINE_DEMO_EMAIL) throw networkFailure()
      if (!findAccount(email)) return { message: GENERIC_RESET }
      const token = crypto.randomUUID()
      db.resets[token] = { email, expiresAt: Date.now() + RESET_LIFETIME_MS }
      save()
      // The real API only returns the generic message. This shortcut is a mock inbox.
      return { message: GENERIC_RESET, demoResetPath: `/reset-password?token=${encodeURIComponent(token)}` }
    })
  },

  resetPassword(input) {
    return simulate(async () => {
      const values = resetPasswordRequestSchema.parse(input)
      const reset = db.resets[values.token]
      if (!reset) throw fail('reset_invalid', 'This reset link is invalid or already used. Request a new link to continue.', 400)
      if (reset.expiresAt <= Date.now()) throw fail('reset_expired', 'This reset link has expired. Request a new one; your password has not changed.', 410)
      await setPassword(reset.email, values.password)
      delete db.resets[values.token]
      for (const [key, challenge] of Object.entries(db.challenges)) {
        if (challenge.email === reset.email) delete db.challenges[key]
      }
      save()
      return { email: reset.email }
    })
  },

  getSignupOptions() {
    return simulate(() => ({ instituteName: institute.name, demoInstituteCode: DEMO_INSTITUTE_CODE, batches: clone(signupBatches) }))
  },

  getInvite(inviteCode) {
    return simulate(() => {
      const invite = facultyInvitations.find((candidate) => candidate.code === inviteCode)
      if (!invite) throw fail('invite_not_found', 'We could not find this invitation. Check the link or ask your academic office to resend it.', 404)
      const user = users[invite.userId]
      const status = db.acceptedInvites.includes(inviteCode) ? 'accepted' : invite.expiresAt <= Date.now() ? 'expired' : 'active'
      return { code: inviteCode, name: user.name, email: user.email, instituteName: invite.instituteName, status, expiresAt: invite.expiresAt }
    })
  },

  acceptInvite(input) {
    return simulate(async () => {
      const values = acceptInviteRequestSchema.parse(input)
      const invite = facultyInvitations.find((candidate) => candidate.code === values.inviteCode)
      if (!invite) throw fail('invite_not_found', 'This invitation is not recognised. Ask the academic office for a new link.', 404)
      if (db.acceptedInvites.includes(values.inviteCode)) throw fail('invite_accepted', 'This invitation has already been accepted. Sign in with your password instead.', 409)
      if (invite.expiresAt <= Date.now()) throw fail('invite_expired', 'This invitation has expired. Ask the academic office to send a fresh invitation.', 410)
      const user = users[invite.userId]
      await setPassword(user.email, values.password)
      db.acceptedInvites.push(values.inviteCode)
      save()
      return sessionFor(user)
    })
  },

  getSession() {
    // Restore is synchronous and exempt from transport failures. Expiry is absolute.
    return Promise.resolve(readPersistedSession())
  },

  logout() {
    // Local revocation must succeed even when the network is unavailable.
    return Promise.resolve()
  },

  unlockDemo(email) {
    delete db.attempts[normalize(email)]
    save()
    return Promise.resolve()
  },
}
