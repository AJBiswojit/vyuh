import { DEMO_EMAILS, DEMO_PASSWORD, users, clone, simulate } from '../../mock-data/index.js'
import { serviceError } from './errors.js'

/** @typedef {import('../types.js').AuthService} AuthService */
/** @typedef {import('../../contracts/user.js').User} User */

const STORAGE_KEY = 'vyuh.session'

/** Demo seats, one per role, offered by the sign-in screen in mock mode. */
export const demoAccounts = DEMO_EMAILS

/**
 * @param {string} token
 * @param {User} user
 * @returns {import('../../contracts/user.js').AuthSession}
 */
function sessionFor(token, user) {
  return { token, user: clone(user), expiresInSeconds: 60 * 60 * 8 }
}

/** @type {AuthService} */
export const authService = {
  signIn(credentials) {
    return simulate(() => {
      const email = credentials.email.trim().toLowerCase()
      const user = Object.values(users).find((candidate) => candidate.email === email)

      if (!user) {
        throw serviceError(
          'invalid_credentials',
          'No account uses that email at this institute. Check the address or ask the academic office to resend your invite.',
          401,
        )
      }
      if (credentials.password !== DEMO_PASSWORD) {
        throw serviceError(
          'invalid_credentials',
          'That password does not match this account. Try again, or use the demo accounts listed on this page.',
          401,
        )
      }

      const token = `demo.${user.role}.${user.id}`
      sessionStorage.setItem(STORAGE_KEY, token)
      return sessionFor(token, user)
    })
  },

  signOut() {
    return simulate(() => {
      sessionStorage.removeItem(STORAGE_KEY)
      return undefined
    }, { min: 120, max: 280 })
  },

  restore() {
    return simulate(() => {
      const token = sessionStorage.getItem(STORAGE_KEY)
      if (!token) return null
      const user = Object.values(users).find((candidate) => token.endsWith(candidate.id))
      return user ? sessionFor(token, user) : null
    }, { min: 80, max: 180, faulty: false })
  },
}
