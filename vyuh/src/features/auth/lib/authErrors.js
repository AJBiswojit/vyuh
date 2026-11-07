/** Stable, distinguishable error copy. Never substitute one generic failure. */
const COPY = {
  invalid_credentials: ['Wrong email or password', 'danger'],
  account_locked: ['Account temporarily locked', 'danger'],
  email_unverified: ['Verify your email first', 'warning'],
  network_unavailable: ['Connection interrupted', 'danger'],
  gateway_timeout: ['The service timed out', 'danger'],
  service_unavailable: ['The service is unavailable', 'danger'],
  otp_expired: ['Verification code expired', 'warning'],
  invalid_otp: ['Incorrect verification code', 'danger'],
  otp_attempts_exceeded: ['Too many incorrect codes', 'danger'],
  challenge_not_found: ['Verification request not found', 'warning'],
  resend_too_soon: ['A little too soon', 'warning'],
  email_exists: ['You already have an account', 'warning'],
  invalid_institute: ['Institute code not recognised', 'danger'],
  invalid_batch: ['Batch unavailable', 'danger'],
  reset_invalid: ['Reset link cannot be used', 'warning'],
  reset_expired: ['Reset link expired', 'warning'],
  invite_not_found: ['Invitation not found', 'warning'],
  invite_expired: ['Invitation expired', 'warning'],
  invite_accepted: ['Invitation already accepted', 'warning'],
}

/** @param {unknown} error */
export function describeAuthError(error) {
  const value = /** @type {Error & import('../../../contracts/common.js').ServiceError & import('../../../contracts/auth.js').AuthErrorDetails} */ (error)
  const [title, tone] = COPY[/** @type {keyof typeof COPY} */ (value?.code)] ?? ['Something went wrong', 'danger']
  return {
    title, tone,
    message: value?.message ?? 'The request could not be completed. Please try again.',
    code: value?.code ?? 'unknown',
    lockedUntil: value?.lockedUntil,
    canUnlockDemo: value?.canUnlockDemo === true,
    retryable: value?.retryable === true,
  }
}
