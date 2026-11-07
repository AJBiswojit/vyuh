import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/app/providers/queryClient.js'
import { services } from '@/shared/lib/services.js'

/** @typedef {import('../../../contracts/dashboard.js').DashboardSnapshot} DashboardSnapshot */

/**
 * The student home payload. One query, one composed snapshot: the page never
 * fans out to four endpoints, so it can never render half a story.
 *
 * @param {import('../../../contracts/ids.js').StudentId | undefined} studentId
 */
export function useStudentHome(studentId) {
  return useQuery({
    queryKey: queryKeys.studentHome(studentId ?? 'unknown'),
    queryFn: () => services.dashboard.getStudentHome(/** @type {string} */ (studentId)),
    enabled: Boolean(studentId),
    staleTime: 60_000,
  })
}
