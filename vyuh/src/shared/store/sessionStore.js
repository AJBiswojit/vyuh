import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { mergeSession, readPersistedSession, SESSION_STORAGE_KEY, sessionStateStorage } from '../lib/sessionPersistence.js'

/**
 * @typedef {import('../../contracts/user.js').User} User
 * @typedef {import('../../contracts/user.js').AuthSession} AuthSession
 * @typedef {Object} SessionState
 * @property {AuthSession | null} session
 * @property {User | null} user
 * @property {'boot'|'anonymous'|'authenticated'} status
 * @property {'expired'|null} notice
 * @property {(session: AuthSession) => void} setSession
 * @property {() => void} initialize
 * @property {() => void} clear
 * @property {() => void} expire
 * @property {() => void} clearNotice
 */

/** @type {import('zustand').UseBoundStore<import('zustand').StoreApi<SessionState>>} */
export const useSessionStore = create()(
  persist(
    (set) => ({
      session: null, user: null, status: 'boot', notice: null,
      setSession: (session) => {
        if (session.expiresAt <= Date.now()) {
          set({ session: null, user: null, status: 'anonymous', notice: 'expired' })
          return
        }
        set({ session, user: session.user, status: 'authenticated', notice: null })
      },
      initialize: () => {
        const session = readPersistedSession()
        set({ session, user: session?.user ?? null, status: session ? 'authenticated' : 'anonymous' })
      },
      clear: () => {
        set({ session: null, user: null, status: 'anonymous', notice: null })
        sessionStateStorage.removeItem(SESSION_STORAGE_KEY)
      },
      expire: () => {
        set({ session: null, user: null, status: 'anonymous', notice: 'expired' })
        sessionStateStorage.removeItem(SESSION_STORAGE_KEY)
      },
      clearNotice: () => set({ notice: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => sessionStateStorage),
      partialize: (state) => ({ session: state.session }),
      merge: mergeSession,
    },
  ),
)
