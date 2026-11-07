import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/app/providers/queryClient.js'
import { services } from '@/shared/lib/services.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'

/** The signed-in student id, or undefined while the shell is booting. */
export function useStudentId() {
  return useSessionStore((state) => (state.user?.role === 'student' ? state.user.id : undefined))
}

/** @param {string | undefined} studentId */
export function useStudentProfile(studentId) {
  return useQuery({
    queryKey: queryKeys.studentProfile(studentId ?? 'unknown'),
    queryFn: () => services.students.getProfile(/** @type {string} */ (studentId)),
    enabled: Boolean(studentId),
  })
}

/** @param {string | undefined} studentId @param {{ enabled?: boolean }} [options] */
export function useExams(studentId, options = {}) {
  return useQuery({
    queryKey: queryKeys.studentExams(studentId ?? 'unknown'),
    queryFn: () => services.assessments.listExams(/** @type {string} */ (studentId)),
    enabled: Boolean(studentId) && options.enabled !== false,
    staleTime: 60_000,
  })
}

/** @param {string | undefined} studentId */
export function useAttempts(studentId) {
  return useQuery({
    queryKey: queryKeys.studentAttempts(studentId ?? 'unknown'),
    queryFn: () => services.assessments.listAttempts(/** @type {string} */ (studentId)),
    enabled: Boolean(studentId),
  })
}

/** @param {string | undefined} studentId */
export function usePerformance(studentId) {
  return useQuery({
    queryKey: queryKeys.studentPerformance(studentId ?? 'unknown'),
    queryFn: () => services.assessments.getPerformance(/** @type {string} */ (studentId)),
    enabled: Boolean(studentId),
  })
}

export function useRecordings() {
  return useQuery({ queryKey: queryKeys.recordings, queryFn: () => services.live.listRecordings() })
}

/** @param {string | undefined} studentId */
export function useNotifications(studentId) {
  return useQuery({
    queryKey: queryKeys.studentNotifications(studentId ?? 'unknown'),
    queryFn: () => services.students.listNotifications(/** @type {string} */ (studentId)),
    enabled: Boolean(studentId),
  })
}

/** @param {string | undefined} studentId */
export function useMarkNotificationsRead(studentId) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => services.students.markNotificationsRead(/** @type {string} */ (studentId)),
    onSuccess: (items) => client.setQueryData(queryKeys.studentNotifications(studentId ?? 'unknown'), items),
  })
}

/** @param {string | undefined} studentId */
export function useAttendance(studentId) {
  return useQuery({
    queryKey: queryKeys.studentAttendance(studentId ?? 'unknown'),
    queryFn: () => services.students.getAttendance(/** @type {string} */ (studentId)),
    enabled: Boolean(studentId),
  })
}

/** @param {string | undefined} studentId */
export function useDoubts(studentId) {
  return useQuery({
    queryKey: queryKeys.studentDoubts(studentId ?? 'unknown'),
    queryFn: () => services.students.listDoubts(/** @type {string} */ (studentId)),
    enabled: Boolean(studentId),
  })
}

/** @param {string | undefined} studentId */
export function useStudyRooms(studentId) {
  return useQuery({
    queryKey: queryKeys.studentStudyRooms(studentId ?? 'unknown'),
    queryFn: () => services.students.listStudyRooms(/** @type {string} */ (studentId)),
    enabled: Boolean(studentId),
  })
}

/** @param {string | undefined} studentId */
export function useUpdatePreferences(studentId) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (/** @type {import('@/contracts/student.js').StudentPreferences} */ preferences) =>
      services.students.updatePreferences(/** @type {string} */ (studentId), preferences),
    onSuccess: (preferences) => {
      const key = queryKeys.studentProfile(studentId ?? 'unknown')
      client.setQueryData(key, (/** @type {any} */ current) => current ? { ...current, preferences } : current)
    },
  })
}

/** @param {string | undefined} studentId */
export function useUpcomingSessions(studentId) {
  return useQuery({ queryKey: [...queryKeys.liveSessions, studentId ?? 'current'], queryFn: () => services.live.listUpcoming(), enabled: Boolean(studentId) })
}
