/**
 * VYUH LIVE STUDIO — shared-session React boundary.
 *
 * Presentation never reads fixtures or mock services directly: everything goes
 * through `services.liveStudio`, which applies the existing fail-closed
 * `requireSessionWorkspace(role)` gate. The subscription is cleaned up on
 * unmount and on any session/role change; no late callback can write stale
 * state after a component is gone.
 *
 * R16: `services.liveStudio.subscribe` throws for a missing, expired or
 * wrong-role session. That failure is surfaced here through the SAME query
 * error state the Studio/Classroom ErrorState panels already render — it is
 * never swallowed into a silent no-op subscription.
 */
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import { queryKeys } from '@/app/providers/queryClient.js'

/** @param {string} sessionId @param {'faculty'|'student'} role */
function snapshotKey(sessionId, role) {
  return queryKeys.liveStudio.snapshot(sessionId, role)
}

/**
 * @param {string} sessionId
 * @param {'faculty'|'student'} role
 * @param {boolean} [enabled]
 */
export function useStudioSnapshot(sessionId, role, enabled = true) {
  const queryClient = useQueryClient()
  const key = useMemo(() => snapshotKey(sessionId, role), [sessionId, role])
  const [subscriptionError, setSubscriptionError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  const query = useQuery({
    queryKey: key,
    queryFn: () => services.liveStudio.getSnapshot(sessionId, role),
    enabled: Boolean(sessionId) && enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  useEffect(() => {
    if (!sessionId || !enabled) return undefined
    let active = true
    let unsubscribe = () => {}
    try {
      unsubscribe = services.liveStudio.subscribe(sessionId, role, (snapshot) => {
        if (!active) return
        setSubscriptionError(null)
        queryClient.setQueryData(key, (previous) => previous ? { ...previous, snapshot } : previous)
      })
      setSubscriptionError(null)
    } catch (error) {
      if (active) setSubscriptionError(error instanceof Error ? error : new Error(String(error)))
    }
    return () => { active = false; unsubscribe() }
  }, [sessionId, role, enabled, queryClient, key, attempt])

  return {
    ...query,
    /* Identity/transport failures are visible through the existing error state. */
    isError: query.isError || Boolean(subscriptionError),
    error: query.error ?? subscriptionError,
    retrySubscription: () => setAttempt((value) => value + 1),
  }
}

/**
 * Send one typed command. `send(type, payload, options)` maps to
 * `services.liveStudio.dispatch`, which records a provenance-tagged mock event.
 * R15: `mutate` is a stable React Query callback, so `send` keeps a stable
 * identity instead of being rebuilt on every render from the result object.
 * @param {string} sessionId
 * @param {'faculty'|'student'} role
 */
export function useStudioSend(sessionId, role) {
  const queryClient = useQueryClient()
  const key = useMemo(() => snapshotKey(sessionId, role), [sessionId, role])
  const summaryKey = useMemo(() => queryKeys.liveStudio.summary(sessionId, role), [sessionId, role])

  const { mutate } = useMutation({
    mutationFn: (command) => services.liveStudio.dispatch(sessionId, role, command),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(key, (previous) => previous ? { ...previous, snapshot } : previous)
      queryClient.invalidateQueries({ queryKey: summaryKey })
    },
  })

  return useMemo(
    () => (type, payload = {}, options = {}) => mutate({ type, payload, ...options }),
    [mutate],
  )
}

/**
 * @param {string} sessionId
 * @param {'faculty'|'student'} role
 * @param {Object|null} attendance   An explicitly labelled attendance view.
 * @param {boolean} [enabled]
 */
export function useStudioSummary(sessionId, role, attendance = null, enabled = true) {
  return useQuery({
    /* The attendance view is part of the key, so a changed labelled view can
       never be served from a stale summary cache. Prefix invalidation from the
       base key still reaches this query. */
    queryKey: [...queryKeys.liveStudio.summary(sessionId, role), attendance?.value ?? 'none'],
    queryFn: () => services.liveStudio.getSummary(sessionId, role, { attendance }),
    enabled: Boolean(sessionId) && enabled,
    staleTime: 0,
    retry: 1,
  })
}

/**
 * The one hook used by the Studio, the Mirror and the Student Classroom.
 * @param {string} sessionId
 * @param {'faculty'|'student'} role
 * @param {{ enabled?: boolean, attendance?: Object|null }} [options]
 */
export function useSharedSession(sessionId, role, options = {}) {
  const { enabled = true, attendance = null } = options
  const query = useStudioSnapshot(sessionId, role, enabled)
  const send = useStudioSend(sessionId, role)
  const compatible = query.data?.compatible === true
  const summary = useStudioSummary(sessionId, role, attendance, enabled && compatible)
  const queryClient = useQueryClient()
  const resetMutation = useMutation({
    mutationFn: () => services.liveStudio.reset(sessionId, role),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(snapshotKey(sessionId, role), (previous) => previous ? { ...previous, snapshot } : previous)
      queryClient.invalidateQueries({ queryKey: queryKeys.liveStudio.summary(sessionId, role) })
    },
  })

  return {
    ...query,
    compatible,
    reason: query.data?.reason ?? null,
    metadata: query.data?.metadata ?? null,
    snapshot: query.data?.snapshot ?? null,
    send,
    summary: summary.data ?? null,
    summaryLoading: summary.isLoading,
    resetStudio: () => resetMutation.mutate(),
  }
}
