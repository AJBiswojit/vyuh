/**
 * Minimal fetch wrapper. Owns: base URL, JSON encoding, bearer token, error
 * normalisation into ServiceError, and Zod validation of the response.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'
const TOKEN_KEY = 'vyuh.api.token'

/** @param {string} path */
export function apiUrl(path) {
  return `${BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

/** @param {string | null} token */
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch { /* Storage may be unavailable in private browsing. */ }
}

/** @returns {string | null} */
export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

/**
 * @param {string} code
 * @param {string} message
 * @param {number} status
 * @returns {Error & import('../../contracts/common.js').ServiceError}
 */
function failure(code, message, status) {
  const error = new Error(message)
  error.name = 'ServiceError'
  Object.assign(error, { code, message, status, retryable: status >= 500 || status === 0 })
  return /** @type {Error & import('../../contracts/common.js').ServiceError} */ (error)
}

/**
 * @template T
 * @param {string} path
 * @param {Object} [options]
 * @param {'GET'|'POST'|'PATCH'|'DELETE'} [options.method]
 * @param {unknown} [options.body]
 * @param {import('zod').ZodType<T>} [options.schema]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<T>}
 */
export async function request(path, { method = 'GET', body, schema, signal } = {}) {
  const token = getToken()
  /** @type {Record<string, string>} */
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(apiUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch {
    throw failure(
      'network_unavailable',
      'The connection dropped before the request finished. Check your network and try again.',
      0,
    )
  }

  if (!response.ok) {
    // Auth endpoints may supply a stable domain code and safe retry metadata.
    // Never display an arbitrary server payload or expose whether an email exists.
    const payload = /** @type {Record<string, unknown> | null} */ (await response.json().catch(() => null))
    const code = typeof payload?.code === 'string' ? payload.code : ''
    const authMessages = {
      invalid_credentials: 'That email and password do not match. Check your details and try again.',
      account_locked: 'This account is temporarily locked. Wait before trying again, or reset your password.',
      otp_expired: 'This code has expired. Request a new code to continue.',
      invalid_otp: 'That code is not correct. Check all six digits and try again.',
      otp_attempts_exceeded: 'Too many incorrect codes. Request a new verification code.',
      challenge_not_found: 'This verification request has ended. Start again to receive a new code.',
      resend_too_soon: 'Please wait for the resend timer before requesting another code.',
      email_exists: 'An account already uses this email. Sign in or reset your password.',
      email_unverified: 'Verify your email before signing in.',
      invalid_institute: 'That institute code is not recognised. Check your enrolment slip.',
      invalid_batch: 'That batch is not open for enrolment. Choose another batch.',
      reset_invalid: 'This reset link is invalid or already used. Request a new link.',
      reset_expired: 'This reset link has expired. Request a new one.',
      invite_not_found: 'This invitation is not recognised. Ask for a new link.',
      invite_expired: 'This invitation has expired. Ask for a new invitation.',
      invite_accepted: 'This invitation has already been accepted. Sign in instead.',
    }
    if (Object.hasOwn(authMessages, code)) {
      /** @type {Record<string, number>} */
      const details = {}
      for (const key of ['lockedUntil', 'remainingAttempts', 'expiresAt']) {
        const value = payload?.[key]
        if (typeof value === 'number') details[key] = value
      }
      throw Object.assign(failure(code, authMessages[/** @type {keyof typeof authMessages} */ (code)], response.status), details)
    }
    if (response.status === 401) {
      throw failure('unauthorized', 'Your session has expired. Sign in again to continue.', 401)
    }
    if (response.status >= 500) {
      throw failure(
        'service_unavailable',
        'This service is briefly unavailable. Your data is safe; try again in a moment.',
        response.status,
      )
    }
    throw failure(
      'request_rejected',
      'The server rejected that request. Refresh the page and try again.',
      response.status,
    )
  }

  if (response.status === 204) return /** @type {T} */ (undefined)

  const payload = await response.json()
  if (!schema) return /** @type {T} */ (payload)

  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    throw failure(
      'invalid_payload',
      'The server returned data this version cannot read. Reload the page; if it persists, the API is ahead of the app.',
      502,
    )
  }
  return parsed.data
}
