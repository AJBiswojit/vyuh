/**
 * Error constructors shared by the mock services.
 * @typedef {import('../../contracts/common.js').ServiceError} ServiceError
 */

/**
 * @param {string} code
 * @param {string} message
 * @param {number} status
 * @returns {Error & ServiceError}
 */
export function serviceError(code, message, status = 400) {
  const error = new Error(message)
  error.name = 'ServiceError'
  Object.assign(error, { code, message, status, retryable: false })
  return /** @type {Error & ServiceError} */ (error)
}

/**
 * @param {string} resource
 * @returns {Error & ServiceError}
 */
export function notFound(resource) {
  return serviceError(
    'not_found',
    `We could not find that ${resource}. It may have been removed — go back and pick another.`,
    404,
  )
}
