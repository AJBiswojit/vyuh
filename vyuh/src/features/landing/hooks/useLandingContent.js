import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/app/providers/queryClient.js'
import { services } from '@/shared/lib/services.js'

/**
 * Landing copy. Cached for the session: marketing copy changes on a deploy, not
 * on a visit. Kept behind a hook so the page never imports a fixture — the same
 * rule every other screen follows.
 */
export function useLandingContent() {
  return useQuery({
    queryKey: queryKeys.landing,
    queryFn: () => services.landing.getContent(),
    staleTime: 30 * 60_000,
    // Marketing copy is the page. Two retries with backoff means a visitor can
    // stare at a skeleton for six seconds before being told anything is wrong,
    // so this query fails fast and shows its error panel instead.
    retry: 1,
    retryDelay: 400,
  })
}
