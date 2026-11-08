/** @param {import('../../contracts/user.js').Role} role */
export function roleLabel(role) {
  return { student: 'Student', faculty: 'Faculty', admin: 'Academic office' }[role] ?? 'Member'
}

/** Each role has a distinct home and layout. */
export const HOME_FOR_ROLE = Object.freeze({ student: '/student', faculty: '/faculty', admin: '/admin' })

/** @param {import('../../contracts/user.js').Role} role */
export function homeRouteFor(role) {
  return HOME_FOR_ROLE[role] ?? '/'
}

/** Only same-origin application paths are valid post-login destinations. */
/** @param {unknown} value */
export function safeReturnPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  /* Setup is a gated first-login destination, never an arbitrary return target. */
  if (/^\/(login|sign-in|signup|verify-otp|forgot-password|reset-password|join|setup-account)(\/|\?|$)/.test(value)) return null
  return value
}
