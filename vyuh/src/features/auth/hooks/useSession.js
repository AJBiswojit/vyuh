import { useCallback, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthService } from '@/services/AuthService.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { readPersistedSession, SESSION_STORAGE_KEY } from '@/shared/lib/sessionPersistence.js'
import { useToast } from '@/shared/ui'

/**
 * Restore once, expire at the absolute deadline, and follow logout in other tabs.
 * No identity query is cached: clearing the session cannot be undone by a late
 * restore or a stale TanStack Query result.
 */
export function useSessionBootstrap() {
  const status = useSessionStore((state) => state.status)
  const session = useSessionStore((state) => state.session)
  const queryClient = useQueryClient()

  useEffect(() => {
    let active = true
    const store = useSessionStore.getState()
    AuthService.getSession()
      .then((restored) => {
        if (!active) return
        if (restored) store.setSession(restored)
        else store.initialize()
      })
      .catch(() => { if (active) store.initialize() })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!session) return
    const expire = () => {
      const current = useSessionStore.getState().session
      if (current && current.expiresAt <= Date.now()) {
        useSessionStore.getState().expire()
        queryClient.clear()
      }
    }
    // Cap the timeout to a signed 32-bit delay; recheck after long device sleep.
    const delay = Math.min(Math.max(0, session.expiresAt - Date.now()), 2_147_483_647)
    const timer = setTimeout(expire, delay)
    const onVisibility = () => { if (document.visibilityState === 'visible') expire() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', expire)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', expire)
    }
  }, [session, queryClient])

  useEffect(() => {
    /** @param {StorageEvent} event */
    const onStorage = (event) => {
      if (event.key !== SESSION_STORAGE_KEY && event.key !== null) return
      const next = readPersistedSession()
      const store = useSessionStore.getState()
      if (!next) { store.clear(); queryClient.clear() }
      else if (next.token !== store.session?.token) store.setSession(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [queryClient])

  return { status }
}

/** Commit a validated session before navigating to a protected route. */
export function useCommitSession() {
  const queryClient = useQueryClient()
  const setSession = useSessionStore((state) => state.setSession)
  return useCallback((/** @type {import('@/contracts/user.js').AuthSession} */ session) => {
    queryClient.clear()
    setSession(session)
  }, [queryClient, setSession])
}

export function useLogin() {
  const commit = useCommitSession()
  const mutation = useMutation({ mutationFn: AuthService.login, onSuccess: commit })
  return { login: mutation.mutateAsync, isPending: mutation.isPending, error: mutation.error, reset: mutation.reset }
}

/**
 * Batch 2 first-login setup. The service returns a refreshed session with
 * `mustChangePassword: false`; committing it clears the identity query cache and
 * updates the guard in the same render. No password is ever cached or logged.
 */
export function useAccountSetup() {
  const commit = useCommitSession()
  const mutation = useMutation({ mutationFn: AuthService.changePasswordWithSetup, onSuccess: commit })
  return { setup: mutation.mutateAsync, isPending: mutation.isPending, error: mutation.error, reset: mutation.reset }
}

/** Local logout is authoritative, even if the HTTP revoke request fails. */
export function useLogout() {
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: AuthService.logout,
    // Mark the navigation; the router-level cleanup clears identity only after
    // the public landing route has committed. This avoids a RequireAuth race.
    onSettled: () => navigate('/', { replace: true, state: { signedOut: true } }),
  })
  return { logout: () => mutation.mutateAsync().catch(() => {}), isPending: mutation.isPending }
}

/** Called once inside the router. Completes a logout after navigation commits. */
export function useLogoutCleanup() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clear = useSessionStore((state) => state.clear)
  const toast = useToast()
  useEffect(() => {
    if (location.pathname !== '/' || !location.state?.signedOut) return
    clear()
    queryClient.clear()
    toast.show({ title: 'Signed out', description: 'Your session has been cleared from this browser.', tone: 'success' })
    navigate('/', { replace: true, state: null })
  }, [location.pathname, location.state, clear, queryClient, toast, navigate])
}
