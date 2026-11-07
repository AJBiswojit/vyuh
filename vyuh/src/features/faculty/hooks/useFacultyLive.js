import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import { queryKeys } from '@/app/providers/queryClient.js'
import { useFacultyId } from './useFaculty.js'

/* ── Classes ──────────────────────────────────────────────────────────── */

export function useFacultyClasses() {
  const facultyId = useFacultyId()
  return useQuery({ queryKey: queryKeys.faculty.classes(facultyId), queryFn: () => services.faculty.listClasses(facultyId), enabled: Boolean(facultyId) })
}

export function useCreateClass() {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (/** @type {import('@/contracts/faculty.js').ClassInput} */ input) => services.faculty.createClass(facultyId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.classes(facultyId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.dashboard(facultyId) })
    },
  })
}

export function useCancelClass() {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (/** @type {string} */ sessionId) => services.faculty.cancelClass(facultyId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.classes(facultyId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.dashboard(facultyId) })
    },
  })
}

/* ── Host console ─────────────────────────────────────────────────────── */

/** @param {string} sessionId */
export function useHostConsole(sessionId) {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.faculty.hostConsole(facultyId, sessionId),
    queryFn: () => services.faculty.getHostConsole(facultyId, sessionId),
    enabled: Boolean(facultyId && sessionId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
  useEffect(() => {
    if (!facultyId || !sessionId) return undefined
    return services.faculty.subscribeHost(facultyId, sessionId, (console_) => {
      queryClient.setQueryData(queryKeys.faculty.hostConsole(facultyId, sessionId), console_)
    })
  }, [facultyId, sessionId, queryClient])
  return query
}

/** @param {string} sessionId */
function useHostMutation(sessionId, mutationFn, invalidateClasses = false) {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (console_) => {
      queryClient.setQueryData(queryKeys.faculty.hostConsole(facultyId, sessionId), console_)
      if (invalidateClasses) queryClient.invalidateQueries({ queryKey: queryKeys.faculty.classes(facultyId) })
    },
  })
}

/** @param {string} sessionId */
export function useStartSession(sessionId) {
  const facultyId = useFacultyId()
  return useHostMutation(sessionId, () => services.faculty.startSession(facultyId, sessionId), true)
}

/** @param {string} sessionId */
export function useEndSession(sessionId) {
  const facultyId = useFacultyId()
  return useHostMutation(sessionId, () => services.faculty.endSession(facultyId, sessionId), true)
}

/** @param {string} sessionId */
export function useTriggerAttention(sessionId) {
  const facultyId = useFacultyId()
  return useHostMutation(sessionId, () => services.faculty.triggerAttentionCheck(facultyId, sessionId))
}

/** @param {string} sessionId */
export function useMuteParticipant(sessionId) {
  const facultyId = useFacultyId()
  return useHostMutation(sessionId, (/** @type {{ studentId: string, muted: boolean }} */ input) =>
    services.faculty.setParticipantMuted(facultyId, sessionId, input.studentId, input.muted),
  )
}

/** @param {string} sessionId */
export function useHideChatMessage(sessionId) {
  const facultyId = useFacultyId()
  return useHostMutation(sessionId, (/** @type {string} */ messageId) => services.faculty.hideChatMessage(facultyId, sessionId, messageId))
}

/** @param {string} sessionId */
export function useApproveQuestion(sessionId) {
  const facultyId = useFacultyId()
  return useHostMutation(sessionId, (/** @type {string} */ questionId) =>
    services.faculty.approveQueueQuestion(facultyId, sessionId, questionId),
  )
}

/* ── Recordings ───────────────────────────────────────────────────────── */

export function useFacultyRecordings() {
  const facultyId = useFacultyId()
  return useQuery({
    queryKey: queryKeys.faculty.facultyRecordings(facultyId),
    queryFn: () => services.faculty.listRecordings(facultyId),
    enabled: Boolean(facultyId),
  })
}

/** @param {string} recordingId */
export function useFacultyRecording(recordingId) {
  const facultyId = useFacultyId()
  return useQuery({
    queryKey: queryKeys.faculty.facultyRecording(facultyId, recordingId),
    queryFn: () => services.faculty.getRecording(facultyId, recordingId),
    enabled: Boolean(facultyId && recordingId),
  })
}

export function useCreateRecording() {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (/** @type {import('@/contracts/faculty.js').RecordingInput} */ input) => services.faculty.createRecording(facultyId, input),
    onSuccess: (recording) => {
      queryClient.setQueryData(queryKeys.faculty.facultyRecording(facultyId, recording.id), recording)
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.facultyRecordings(facultyId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.dashboard(facultyId) })
    },
  })
}

/** @param {string} recordingId */
export function useSaveRecording(recordingId) {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (/** @type {Partial<import('@/contracts/faculty.js').FacultyRecording>} */ patch) =>
      services.faculty.saveRecording(facultyId, recordingId, patch),
    onSuccess: (recording) => {
      queryClient.setQueryData(queryKeys.faculty.facultyRecording(facultyId, recordingId), recording)
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.facultyRecordings(facultyId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.dashboard(facultyId) })
    },
  })
}

export function useDeleteRecording() {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (/** @type {string} */ recordingId) => services.faculty.deleteRecording(facultyId, recordingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.facultyRecordings(facultyId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.dashboard(facultyId) })
    },
  })
}

/* ── Attendance ───────────────────────────────────────────────────────── */

/** @param {{ batchId?: string, defaultersOnly?: boolean }} filter */
export function useFacultyAttendance(filter) {
  const facultyId = useFacultyId()
  return useQuery({
    queryKey: queryKeys.faculty.facultyAttendance(facultyId, filter),
    queryFn: () => services.faculty.getAttendanceReport(facultyId, filter),
    enabled: Boolean(facultyId),
    placeholderData: (previous) => previous,
  })
}

export function useExportAttendance() {
  const facultyId = useFacultyId()
  return useMutation({
    mutationFn: (/** @type {{ batchId?: string, defaultersOnly?: boolean }} */ filter) => services.faculty.exportAttendance(facultyId, filter),
  })
}

/* ── Doubts ───────────────────────────────────────────────────────────── */

/** @param {'all'|'open'|'answered'|'resolved'} status */
export function useFacultyDoubts(status = 'all') {
  const facultyId = useFacultyId()
  return useQuery({
    queryKey: queryKeys.faculty.facultyDoubts(facultyId, status),
    queryFn: () => services.faculty.listDoubts(facultyId, { status }),
    enabled: Boolean(facultyId),
  })
}

/** @param {string} doubtId */
export function useFacultyDoubt(doubtId) {
  const facultyId = useFacultyId()
  return useQuery({
    queryKey: queryKeys.faculty.facultyDoubt(facultyId, doubtId),
    queryFn: () => services.faculty.getDoubt(facultyId, doubtId),
    enabled: Boolean(facultyId && doubtId),
  })
}

/** @param {string} doubtId */
export function useReplyDoubt(doubtId) {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (/** @type {string} */ body) => services.faculty.replyDoubt(facultyId, doubtId, body),
    onSuccess: (doubt) => {
      queryClient.setQueryData(queryKeys.faculty.facultyDoubt(facultyId, doubtId), doubt)
      queryClient.invalidateQueries({ queryKey: ['faculty', facultyId, 'doubts'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.dashboard(facultyId) })
    },
  })
}

/** @param {string} doubtId */
export function useResolveDoubt(doubtId) {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => services.faculty.resolveDoubt(facultyId, doubtId),
    onSuccess: (doubt) => {
      queryClient.setQueryData(queryKeys.faculty.facultyDoubt(facultyId, doubtId), doubt)
      queryClient.invalidateQueries({ queryKey: ['faculty', facultyId, 'doubts'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.dashboard(facultyId) })
    },
  })
}

export function useReplyTemplates() {
  const facultyId = useFacultyId()
  return useQuery({
    queryKey: queryKeys.faculty.replyTemplates(facultyId),
    queryFn: () => services.faculty.listReplyTemplates(facultyId),
    staleTime: 5 * 60_000,
  })
}
