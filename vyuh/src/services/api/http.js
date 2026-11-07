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
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

/** @returns {string | null} */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
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
  } catch (cause) {
    throw failure(
      'network_unavailable',
      'The connection dropped before the request finished. Check your network and try again.',
      0,
    )
  }

  if (!response.ok) {
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
