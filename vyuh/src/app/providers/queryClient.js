import { QueryClient } from '@tanstack/react-query'

/**
 * Query defaults chosen for a product where the network is assumed to be a
 * school Wi-Fi: refetch on focus (so a live class status is not stale), two
 * retries with exponential backoff (mock mode injects ~3% failures), and no
 * polling anywhere except where a feature asks for it explicitly.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: { retry: 0 },
  },
})

/** Stable key factory — one namespace per domain, so invalidations are exact. */
export const queryKeys = {
  institute: ['institute', 'profile'],
  landing: ['landing', 'content'],
  session: ['auth', 'session'],
  student: (id) => ['students', id],
  studentHome: (id) => ['students', id, 'home'],
  batches: (query) => ['batches', query],
  batch: (id) => ['batches', id],
  subjects: ['subjects'],
  latestReport: (id) => ['students', id, 'reports', 'latest'],
  liveSessions: ['live', 'sessions'],
}
