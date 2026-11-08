import {
  DEMO_EMAILS, DEMO_PASSWORD, DEMO_OTP, EXPIRED_DEMO_OTP, DEMO_INSTITUTE_CODE, DEMO_INVITE_CODE,
  LOCKED_DEMO_EMAIL, OFFLINE_DEMO_EMAIL, users, signupBatches, facultyInvitations,
  institute, demoScenarios, clone, simulate,
  issueInstituteId, loadAccountsDb, saveAccountsDb, accountByIdentifier, projectSafeAccount,
  generateTemporaryPassword, normalizeAccountKey,
} from '../../mock-data/index.js'
import {
  readPersistedSession, setAccountEligibilityCheck, SESSION_LIFETIME_MS,
} from '../../shared/lib/sessionPersistence.js'
import {
  loginSchema, signupSchema, otpSchema, forgotPasswordSchema, resetPasswordRequestSchema,
  acceptInviteRequestSchema, setupAccountSchema, instituteIdSchema, instituteAccountInputSchema,
} from '../authSchemas.js'
import { serviceError } from './errors.js'

/**
 * Explicitly simulated authentication for ONE institute. No real credentials
 * leave this browser. Fixtures are public. Passwords are salted + SHA-256
 * digested before local storage — this is a PROTOTYPE: salted SHA-256 is NOT a
 * password KDF and is NOT production-grade credential security. Browser
 * localStorage is demonstration data, not encrypted at rest and not tamper-proof.
 *
 * Storage separation (never crossed):
 *   vyuh.mock.accounts.v1 → identity + lifecycle, NO secrets
 *   vyuh.mock.auth.v1     → salt, digest, lockout, legacy challenges (this file)
 *   vyuh.session          → active session metadata
 *
 * No plaintext password, hash or credential is ever logged, audited, returned
 * by an account list, placed in a URL/query/analytics or stored in a session.
 * There is deliberately NO `revealPassword`, `getPlaintext` or password
 * retrieval API of any kind.
 *
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

function emptyDb() {
  return { accounts: {}, attempts: {}, challenges: {}, resets: {}, acceptedInvites: [] }
}

/** @returns {{ accounts: Record<string, any>, attempts: Record<string, { count: number, lockedUntil: number }>, challenges: Record<string, any>, resets: Record<string, any>, acceptedInvites: string[] }} */
function readDb() {
  try {
    const stored = JSON.parse(localStorage.getItem(DB_KEY) ?? 'null')
    if (stored && typeof stored === 'object') {
      return {
        accounts: stored.accounts ?? {}, attempts: stored.attempts ?? {},
        challenges: stored.challenges ?? {}, resets: stored.resets ?? {},
        acceptedInvites: Array.isArray(stored.acceptedInvites) ? stored.acceptedInvites : [],
      }
    }
  } catch { /* A corrupt mock database never blocks the public login screen. */ }
  return emptyDb()
}

let db = readDb()
/** Re-read on every call so cross-tab writes and a cleared localStorage cannot leave a stale in-memory DB. */
function syncDb() { db = readDb() }

function save() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch { /* Keep the demo usable in memory. */ }
}

/**
 * @param {() => any} produce
 * @param {{ min?: number, max?: number, faulty?: boolean }} [options]
 */
function transactional(produce, options = {}) {
  return simulate(() => {
    syncDb()
    return produce()
  }, options)
}

/** Emails lowercased, Institute IDs uppercased. One shared identifier resolver. */
const normalize = (identifier) => normalizeAccountKey(String(identifier ?? ''))
const id = () => `mock-${crypto.randomUUID()}`
const isDemoEmail = (key) => DEMO_EMAILS.some((seat) => seat.email === key)

/** @param {string} code @param {string} message @param {number} status @param {Record<string, number | boolean>} [details] */
function fail(code, message, status = 400, details = {}) {
  const error = serviceError(code, message, status)
  Object.assign(error, details, { retryable: status === 0 || status >= 500 })
  return error
}
function networkFailure() {
  return fail('network_unavailable', 'We could not reach the sign-in service. Check your connection and try again. Your attempt was not counted.', 0)
}

/** @param {any} record @returns {import('../../contracts/user.js').User} */
function accountToUser(record) {
  /** @type {any} */
  const user = {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    initials: record.initials,
    joinedAt: String(record.createdAt).slice(0, 10),
    mustChangePassword: record.mustChangePassword === true,
    acknowledgedPolicyVersion: record.acknowledgedPolicyVersion ?? null,
  }
  if (record.instituteId) user.instituteId = record.instituteId
  if (record.instituteCode) user.instituteCode = record.instituteCode
  if (record.phone) user.phone = record.phone
  if (record.batchId) { user.batchId = record.batchId; user.batchName = record.batchName ?? undefined }
  return user
}

/**
 * Resolve a demo email or an issued Institute ID into one account shape.
 * `record` is the credential-free identity record; `passwordHash`/`salt` come
 * only from the auth DB. Unknown identifiers resolve to null (generic error).
 * @param {string} identifier
 */
function findAccount(identifier) {
  const key = normalize(identifier)
  const stored = db.accounts[key] ?? null
  const fixtureUser = Object.values(users).find((candidate) => candidate.email === key)
  const record = accountByIdentifier(key)
  const user = stored?.user ?? (fixtureUser ? clone(fixtureUser) : record ? accountToUser(record) : null)
  if (!user && !stored) return null
  return { key, user, fixture: Boolean(fixtureUser) && !stored?.passwordHash, record, ...(stored ?? {}) }
}

/** @param {string} password @param {string} salt */
async function digest(password, salt) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`))
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** @param {import('../../contracts/user.js').User} user @returns {AuthSession} */
function sessionFor(user) {
  const issuedAt = Date.now()
  const safeUser = clone(user)
  const mustChangePassword = safeUser.mustChangePassword === true
  safeUser.mustChangePassword = mustChangePassword
  return {
    token: `demo.${crypto.randomUUID()}`,
    user: safeUser,
    issuedAt,
    expiresAt: issuedAt + SESSION_LIFETIME_MS,
    expiresInSeconds: SESSION_LIFETIME_MS / 1000,
    instituteId: safeUser.instituteId,
    mustChangePassword,
    acknowledgedPolicyVersion: safeUser.acknowledgedPolicyVersion ?? null,
  }
}

/** @param {any} account @param {string} password */
async function passwordMatches(account, password) {
  if (account.passwordHash) return account.passwordHash === await digest(password, account.salt)
  return account.fixture && password === DEMO_PASSWORD
}

/**
 * Store ONLY a salt + digest. `clearAttempts` is true for the legacy demo-seat
 * self-service reset (preserving its existing behaviour) and false for the
 * Batch 2 first-login rotation: recovery must never wash away a lockout.
 * @param {string} key
 * @param {string} password
 * @param {{ clearAttempts?: boolean }} [options]
 */
async function writePassword(key, password, { clearAttempts = true } = {}) {
  const existing = db.accounts[key] ?? {}
  const salt = crypto.randomUUID()
  db.accounts[key] = { ...existing, salt, passwordHash: await digest(password, salt) }
  if (clearAttempts) delete db.attempts[key]
  save()
}

/** @param {string} email @param {'signup'|'reset'} purpose */
function makeChallenge(email, purpose) {
  const now = Date.now()
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

function registrationRetired() {
  return fail('registration_retired', 'Public registration is closed. Your academic office issues Institute IDs and temporary passwords; contact them if you do not have yours.', 403)
}

/**
 * FOUNDATION HELPER — not part of the AuthService facade, not reachable from any
 * route and has no UI. It exists so the Admin People batch can create accounts
 * against the same identity/auth contract, and so Batch 2 can prove the whole
 * login → mandatory setup → dashboard rule in regression tests.
 *
 * It returns the generated temporary password ONCE, in memory. The value is
 * never persisted, logged, audited, cached or retrievable afterwards.
 * Admin-created Admin accounts are explicitly NOT supported in Batch 2.
 *
 * @param {{ role: string, name: string, email: string, phone?: string, batchId?: string, batchName?: string }} input
 * @param {{ randomBytes?: (buffer: Uint8Array) => boolean | void }} [options]  options.randomBytes is TEST ONLY.
 */
export function provisionInstituteAccount(input, options = {}) {
  return (async () => {
    syncDb()
    const values = instituteAccountInputSchema.parse(input)
    if (values.role === 'admin') {
      throw fail('admin_provisioning_not_available', 'Admin-created Admin accounts are not part of Batch 2. The three roles share one auth foundation; creation stays with the Admin People batch.', 403)
    }
    const registry = loadAccountsDb()
    const allocation = issueInstituteId(values.role, registry)
    if (!allocation.ok) throw fail(allocation.code, allocation.message, 409)

    const temporaryPassword = generateTemporaryPassword(options.randomBytes)
    const now = new Date().toISOString()
    const initials = values.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase().padEnd(2, 'X').slice(0, 2)
    /** @type {import('../../contracts/user.js').InstituteAccount} */
    const record = {
      id: allocation.instituteId,
      key: allocation.instituteId,
      instituteId: allocation.instituteId,
      role: values.role,
      name: values.name,
      email: values.email,
      initials,
      status: 'active',
      mustChangePassword: true,
      temporaryPasswordIssuedAt: now,
      acknowledgedPolicyVersion: null,
      credentialDelivery: 'pending',
      createdAt: now,
      statusChangedAt: null,
      source: 'institute_issued',
      rollNumber: null,
      instituteCode: null,
      batchId: values.batchId ?? null,
      batchName: values.batchName ?? null,
    }
    const user = accountToUser(record)
    if (values.phone) user.phone = values.phone

    const salt = crypto.randomUUID()
    db.accounts[allocation.instituteId] = { user, salt, passwordHash: await digest(temporaryPassword, salt) }
    save()
    saveAccountsDb({ ...allocation.db, accounts: { ...allocation.db.accounts, [record.key]: record } })

    return {
      account: projectSafeAccount(record),
      credentials: { instituteId: allocation.instituteId, temporaryPassword },
    }
  })()
}

/**
 * BATCH 3 (U-5) — ADDITIVE Admin-controlled recovery helper.
 *
 * This is the ONLY new behaviour added to the Batch 2 auth service. Every
 * existing method (login, changePasswordWithSetup, requestReset, resetPassword,
 * demo seats, lockout semantics, guards) is untouched. It deliberately reuses
 * the private `writePassword()` / `digest()` path so no password logic is
 * duplicated in `admin.js`, and exposes NO digest, salt or retrieval API.
 *
 * A new temporary password is issued ONCE, in memory. The old credential is
 * invalidated because its digest is replaced. `{ clearAttempts: false }` keeps
 * the failed-attempt lockout intact: recovery is never an unlock shortcut.
 *
 * @param {{ targetAccountKey: string, reason: string, actorId?: string }} input
 * @param {{ randomBytes?: (buffer: Uint8Array) => boolean | void }} [options]  TEST ONLY.
 * @returns {Promise<{ account: ReturnType<typeof projectSafeAccount>, credentials: import('../../contracts/auth.js').ReissuedCredential }>}
 */
export async function issueTemporaryPassword(input, options = {}) {
  syncDb()
  const reason = String(input?.reason ?? '').trim()
  if (!reason) throw fail('recovery_reason_required', 'Give a reason for issuing a new temporary password. It is kept in the audit ledger.', 400)
  const key = normalizeAccountKey(String(input?.targetAccountKey ?? ''))
  if (!key) throw fail('account_not_found', 'That account could not be found.', 404)

  const registry = loadAccountsDb()
  const record = accountByIdentifier(key, registry)
  if (!record) throw fail('account_not_found', 'That account could not be found.', 404)
  if (record.source !== 'institute_issued') throw fail('recovery_not_available', 'Demo seats use their own reset flow. Only institute-issued accounts receive Admin-issued temporary passwords.', 409)
  if (record.status === 'archived') throw fail('account_archived', 'An archived account cannot receive a new credential. Archive is terminal.', 409)

  const temporaryPassword = generateTemporaryPassword(options.randomBytes)
  const now = new Date().toISOString()

  /* The ONLY credential write. clearAttempts:false is the approved R-8 rule. */
  await writePassword(record.key, temporaryPassword, { clearAttempts: false })
  if (db.accounts[record.key]?.user) db.accounts[record.key].user.mustChangePassword = true
  save()

  const updated = {
    ...record,
    mustChangePassword: true,
    temporaryPasswordIssuedAt: now,
    credentialDelivery: 'pending',
  }
  saveAccountsDb({ ...registry, accounts: { ...registry.accounts, [record.key]: updated } })

  return {
    account: projectSafeAccount(updated),
    credentials: { instituteId: record.instituteId, temporaryPassword },
  }
}

/**
 * Account-status revalidation during session restoration. Registered on the
 * shared session-persistence module without importing mock-data from `shared`.
 * A session with no registry record (a legacy/demo envelope) is left untouched.
 */
setAccountEligibilityCheck((session) => {
  const key = normalizeAccountKey(session.instituteId ?? session.user?.instituteId ?? session.user?.email ?? '')
  const record = accountByIdentifier(key)
  if (!record) return true
  return record.status === 'active'
})

/** @type {AuthService} */
export const authService = {
  login(input) {
    return transactional(async () => {
      const raw = input && typeof input === 'object' && !input.email && input.instituteId
        ? { email: input.instituteId, password: input.password }
        : input
      const credentials = loginSchema.parse(raw)
      const key = normalize(credentials.email)
      if (key === OFFLINE_DEMO_EMAIL) throw networkFailure()
      const lock = db.attempts[key]
      if (key === LOCKED_DEMO_EMAIL || (lock?.lockedUntil ?? 0) > Date.now()) {
        const lockedUntil = key === LOCKED_DEMO_EMAIL ? Date.now() + LOCK_MS : lock.lockedUntil
        throw fail('account_locked', 'This account is temporarily locked after too many failed attempts. Wait for the timer, or reset your password.', 423, { lockedUntil, canUnlockDemo: false })
      }
      const account = findAccount(key)
      if (!account || !(await passwordMatches(account, credentials.password))) {
        const previous = db.attempts[key]
        const count = (previous?.count ?? 0) + 1
        const locked = count >= MAX_ATTEMPTS
        db.attempts[key] = { count: locked ? 0 : count, lockedUntil: locked ? Date.now() + LOCK_MS : 0 }
        save()
        if (locked) throw fail('account_locked', 'Five failed attempts have temporarily locked this account. Try again in 15 minutes, or reset your password.', 423, { lockedUntil: db.attempts[key].lockedUntil, canUnlockDemo: true })
        throw fail('invalid_credentials', `That email and password do not match. ${MAX_ATTEMPTS - count} ${MAX_ATTEMPTS - count === 1 ? 'attempt remains' : 'attempts remain'} before a temporary lock.`, 401, { remainingAttempts: MAX_ATTEMPTS - count })
      }
      /* Status is checked AFTER a correct credential, so a wrong password for a
         suspended account stays generic and cannot be used to enumerate IDs. */
      const status = account.record?.status
      if (status === 'suspended') throw fail('account_suspended', 'This account has been suspended. Contact your academic office to have it reactivated.', 403)
      if (status === 'archived') throw fail('account_archived', 'This account has been archived and can no longer sign in. Contact your academic office.', 403)
      if (status === 'locked') throw fail('account_locked', 'This account is locked. Your academic office must unlock it explicitly.', 423)
      if (status && status !== 'active') throw fail('invalid_credentials', 'That email and password do not match.', 401)
      if (account.pending) throw fail('email_unverified', 'Verify your email before signing in. Contact your academic office for your issued credentials.', 403)
      delete db.attempts[key]
      save()
      return sessionFor(account.user)
    })
  },

  /** Delegates to the one shared identifier resolver — no second credential path. */
  loginByInstituteId(input) {
    const { instituteId, password } = { instituteId: instituteIdSchema.parse(input?.instituteId), password: input?.password }
    return authService.login({ email: instituteId, password })
  },

  /**
   * First-login password rotation. Identity comes ONLY from the persisted
   * authenticated session — never from UI-supplied role or Institute ID.
   * G5 is PENDING: no consent, no policy version, no legal text.
   */
  changePasswordWithSetup(input) {
    return transactional(async () => {
      const values = setupAccountSchema.parse(input)
      const session = readPersistedSession()
      if (!session) throw fail('setup_session_expired', 'Your session has expired. Sign in again to finish setting up your account.', 401)
      const key = normalizeAccountKey(session.instituteId ?? session.user?.instituteId ?? session.user?.email ?? '')
      const record = accountByIdentifier(key)
      if (!record) throw fail('setup_not_required', 'This demo account does not need first-login setup.', 409)
      /* Distinct notices; no blanket suspension message for locked/archived. */
      if (record.status === 'suspended') throw fail('account_suspended', 'This account has been suspended. Contact your academic office to have it reactivated.', 403)
      if (record.status === 'archived') throw fail('account_archived', 'This account has been archived and can no longer sign in. Contact your academic office.', 403)
      if (record.status === 'locked') throw fail('account_locked', 'This account is locked. Your academic office must unlock it explicitly.', 423)
      if (record.status !== 'active') throw fail('account_suspended', 'This account is not active. Contact your academic office.', 403)
      if (record.mustChangePassword !== true) throw fail('setup_not_required', 'Your password has already been set. Sign in to continue.', 409)
      const account = findAccount(key)
      if (account?.salt && account.passwordHash === await digest(values.newPassword, account.salt)) {
        throw fail('password_reuse_rejected', 'Choose a password that is different from your temporary password.', 400)
      }
      /* No automatic lockout clear: recovery must not wash away failed logins. */
      await writePassword(key, values.newPassword, { clearAttempts: false })
      /* Keep the auth-DB user projection in step with the canonical registry so
         a later login cannot resurrect the first-login requirement. */
      if (db.accounts[key]?.user) db.accounts[key].user.mustChangePassword = false
      save()
      const registry = loadAccountsDb()
      const updated = { ...record, mustChangePassword: false, temporaryPasswordIssuedAt: null, credentialDelivery: 'delivered' }
      saveAccountsDb({ ...registry, accounts: { ...registry.accounts, [record.key]: updated } })
      return sessionFor({ ...session.user, mustChangePassword: false })
    })
  },

  /** Safe status projection for the active session. No hash, no credential. */
  getAccountStatus() {
    return transactional(() => {
      const session = readPersistedSession()
      if (!session) return null
      const key = normalizeAccountKey(session.instituteId ?? session.user?.instituteId ?? session.user?.email ?? '')
      const record = accountByIdentifier(key)
      if (!record) return { instituteId: null, role: session.user.role, status: 'active', mustChangePassword: false }
      return {
        instituteId: record.instituteId ?? null,
        role: record.role,
        status: record.status,
        mustChangePassword: record.mustChangePassword === true,
      }
    }, { faulty: false })
  },

  /** RETIRED as a provisioning path. Zod validation is retained; no account is created. */
  signup(input) {
    return transactional(() => {
      signupSchema.parse(input)
      throw registrationRetired()
    })
  },

  getChallenge(challengeId) {
    return transactional(() => {
      const challenge = db.challenges[challengeId]
      if (!challenge) throw fail('challenge_not_found', 'This verification request is no longer available. Start again to receive a new code.', 404)
      return publicChallenge(challenge)
    }, { faulty: false })
  },

  verifyOtp(input) {
    return transactional(async () => {
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
      /* A stale pre-Batch-2 pending account can never be activated into a session. */
      if (challenge.purpose === 'signup') {
        delete db.challenges[challenge.id]
        save()
        throw registrationRetired()
      }
      const token = crypto.randomUUID()
      db.resets[token] = { email: challenge.email, expiresAt: Date.now() + RESET_LIFETIME_MS }
      delete db.challenges[challenge.id]
      save()
      return { email: challenge.email, resetPath: `/reset-password?token=${encodeURIComponent(token)}` }
    })
  },

  resendOtp(challengeId) {
    return transactional(() => {
      const previous = db.challenges[challengeId]
      if (!previous) throw fail('challenge_not_found', 'This request has ended. Start again to receive a new code.', 404)
      if (previous.resendAvailableAt > Date.now()) throw fail('resend_too_soon', 'Please wait for the resend timer before requesting another code.', 429)
      return publicChallenge(makeChallenge(previous.email, previous.purpose))
    })
  },

  /**
   * Demo-only self-service reset (G4.8 ruling). Institute-ID accounts must NOT
   * use this workflow: they receive a generic response with no reset token.
   */
  requestReset(input) {
    return transactional(() => {
      const { email } = forgotPasswordSchema.parse(input)
      if (email === OFFLINE_DEMO_EMAIL) throw networkFailure()
      const key = normalize(email)
      if (!isDemoEmail(key)) return { message: GENERIC_RESET }
      const token = crypto.randomUUID()
      db.resets[token] = { email: key, expiresAt: Date.now() + RESET_LIFETIME_MS }
      save()
      return { message: GENERIC_RESET, demoResetPath: `/reset-password?token=${encodeURIComponent(token)}` }
    })
  },

  resetPassword(input) {
    return transactional(async () => {
      const values = resetPasswordRequestSchema.parse(input)
      const reset = db.resets[values.token]
      if (!reset) throw fail('reset_invalid', 'This reset link is invalid or already used. Request a new link to continue.', 400)
      if (reset.expiresAt <= Date.now()) throw fail('reset_expired', 'This reset link has expired. Request a new one; your password has not changed.', 410)
      /* Tokens are issued only for the three seeded demo email seats. */
      if (!isDemoEmail(normalize(reset.email))) throw fail('reset_invalid', 'This reset link cannot be used for an Institute ID account. Contact your academic office.', 400)
      await writePassword(normalize(reset.email), values.password)
      delete db.resets[values.token]
      for (const [key, challenge] of Object.entries(db.challenges)) {
        if (challenge.email === reset.email) delete db.challenges[key]
      }
      save()
      return { email: reset.email }
    })
  },

  getSignupOptions() {
    return transactional(() => ({ instituteName: institute.name, demoInstituteCode: DEMO_INSTITUTE_CODE, batches: clone(signupBatches) }))
  },

  /** Read-only: the retired invitation route can still display its status. */
  getInvite(inviteCode) {
    return transactional(() => {
      const invite = facultyInvitations.find((candidate) => candidate.code === inviteCode)
      if (!invite) throw fail('invite_not_found', 'We could not find this invitation. Check the link or ask your academic office to resend it.', 404)
      const user = users[invite.userId]
      const status = db.acceptedInvites.includes(inviteCode) ? 'accepted' : invite.expiresAt <= Date.now() ? 'expired' : 'active'
      return { code: inviteCode, name: user.name, email: user.email, instituteName: invite.instituteName, status, expiresAt: invite.expiresAt }
    })
  },

  /** RETIRED as a self-service provisioning path. No password is set, no session is created. */
  acceptInvite(input) {
    return transactional(() => {
      acceptInviteRequestSchema.parse(input)
      throw registrationRetired()
    })
  },

  getSession() {
    // Restore is synchronous and exempt from transport failures. Expiry is absolute;
    // account-status revalidation happens inside readPersistedSession().
    return Promise.resolve(readPersistedSession())
  },

  logout() {
    return Promise.resolve()
  },

  unlockDemo(email) {
    syncDb()
    delete db.attempts[normalize(email)]
    save()
    return Promise.resolve()
  },
}
