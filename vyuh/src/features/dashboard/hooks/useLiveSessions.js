import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/app/providers/queryClient.js'
import { services } from '@/shared/lib/services.js'

/**
 * Today's live classes. Refetches on an interval only while a class is live,
 * because that is the only state that changes minute to minute.
 */
export function useLiveSessions() {
  return useQuery({
    queryKey: queryKeys.liveSessions,
    queryFn: () => services.live.listUpcoming(),
    staleTime: 30_000,
    refetchInterval: (query) =>
      query.state.data?.some((session) => session.status === 'live') ? 60_000 : false,
  })
}
