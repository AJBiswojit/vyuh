/**
 * Role copy lives in one place so a seat always reads the same way.
 * @param {import('../../contracts/user.js').Role} role
 * @returns {string}
 */
export function roleLabel(role) {
  return { student: 'Student', faculty: 'Faculty', admin: 'Academic office' }[role] ?? 'Member'
}

/**
 * Where a role lands after sign-in.
 * @param {import('../../contracts/user.js').Role} role
 * @returns {string}
 */
export function homeRouteFor(role) {
  return role === 'student' || role === 'faculty' || role === 'admin' ? '/app' : '/'
}
