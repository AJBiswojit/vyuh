/**
 * Heuristic feedback, not a security guarantee. Zod enforces the minimum.
 * @param {string} password
 */
export function passwordStrength(password) {
  if (!password) return { score: 0, label: 'Not entered', hints: ['Use 10 or more characters.', 'Include a letter and a number.'] }
  let score = 0
  if (password.length >= 10) score += 1
  if (password.length >= 14) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password) && /[^a-zA-Z0-9\s]/.test(password)) score += 1
  if (password.length < 10) score = Math.min(score, 1)
  else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) score = Math.min(score, 2)
  const labels = ['Not entered', 'Weak', 'Fair', 'Good', 'Strong']
  /** @type {string[]} */
  const hints = []
  if (password.length < 10) hints.push('Use at least 10 characters.')
  if (!/[a-zA-Z]/.test(password)) hints.push('Add a letter.')
  if (!/[0-9]/.test(password)) hints.push('Add a number.')
  if (hints.length === 0) hints.push(score < 4 ? 'Try a longer passphrase with a symbol.' : 'A good start. Keep it unique to Vyuh.')
  return { score, label: labels[score], hints }
}
