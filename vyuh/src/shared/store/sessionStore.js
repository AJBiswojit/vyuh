import { create } from 'zustand'

/**
 * Authenticated seat. Client state, not server state: the token lives in
 * sessionStorage and the identity is restored once at boot.
 *
 * @typedef {import('../../contracts/user.js').User} User
 *
 * @typedef {Object} SessionState
 * @property {User | null} user
 * @property {'boot'|'anonymous'|'authenticated'} status
 * @property {(user: User) => void} setUser
 * @property {() => void} clear
 * @property {() => void} markBooted
 */

/** @type {import('zustand').UseBoundStore<import('zustand').StoreApi<SessionState>>} */
export const useSessionStore = create((set) => ({
  user: null,
  status: 'boot',
  setUser: (user) => set({ user, status: 'authenticated' }),
  clear: () => set({ user: null, status: 'anonymous' }),
  markBooted: () => set((state) => ({ status: state.user ? 'authenticated' : 'anonymous' })),
}))
