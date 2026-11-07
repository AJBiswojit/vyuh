import { useCallback, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/app/providers/queryClient.js'
import { services } from '@/shared/lib/services.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'

/**
 * Session lifecycle. The identity is restored once per boot; sign-in and
 * sign-out are mutations that write through to the session store.
 *
 * The auth service is the one place a hook may call directly rather than
 * through a cached query, because guest state must not be cached.
 */
export function useSessionBootstrap() {
  const status = useSessionStore((state) => state.status) // 'boot' until resolved
  const setUser = useSessionStore((state) => state.setUser)
  const markBooted = useSessionStore((state) => state.markBooted)

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.session,
    queryFn: () => services.auth.restore(),
    staleTime: Infinity,
    retry: 1,
    enabled: status === 'boot',
  })

  useEffect(() => {
    if (!isPending && status === 'boot') {
      if (data) setUser(data.user)
      else markBooted()
    }
  }, [data, isPending, status, setUser, markBooted])

  return { status, isError }
}

/** @returns {{ signIn: (credentials: import('../../../contracts/user.js').Credentials) => void, isPending: boolean, error: (Error & { code?: string, message: string }) | null, reset: () => void }} */
export function useSignIn() {
  const queryClient = useQueryClient()
  const setUser = useSessionStore((state) => state.setUser)

  const mutation = useMutation({
    mutationFn: (/** @type {import('../../../contracts/user.js').Credentials} */ credentials) =>
      services.auth.signIn(credentials),
    onSuccess: (session) => {
      setUser(session.user)
      queryClient.setQueryData(queryKeys.session, session)
    },
  })

  return {
    signIn: mutation.mutate,
    isPending: mutation.isPending,
    error: /** @type {any} */ (mutation.error ?? null),
    reset: mutation.reset,
  }
}

/** @returns {{ signOut: () => void, isPending: boolean }} */
export function useSignOut() {
  const queryClient = useQueryClient()
  const clear = useSessionStore((state) => state.clear)

  const mutation = useMutation({
    mutationFn: () => services.auth.signOut(),
    onSettled: () => {
      clear()
      queryClient.clear()
    },
  })

  const signOut = useCallback(() => mutation.mutate(), [mutation])
  return { signOut, isPending: mutation.isPending }
}
