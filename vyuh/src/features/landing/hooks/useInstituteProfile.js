import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/app/providers/queryClient.js'
import { services } from '@/shared/lib/services.js'

/**
 * Institute profile for the landing page and footer. Cached for the session: it
 * changes once a term, not once a visit.
 */
export function useInstituteProfile() {
  return useQuery({
    queryKey: queryKeys.institute,
    queryFn: () => services.institute.getProfile(),
    staleTime: 30 * 60_000,
    // The footer and the institute section degrade to static copy, so this one
    // should not hold the page hostage either.
    retry: 1,
    retryDelay: 400,
  })
}
