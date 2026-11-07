import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import { queryKeys } from '@/app/providers/queryClient.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'

/** @returns {string} */
export function useLearningStudentId() {
  return useSessionStore((state) => (state.user?.role === 'student' ? state.user.id : ''))
}

/** @param {string} studentId */
export function useLiveSchedule(studentId) {
  return useQuery({ queryKey: queryKeys.liveSchedule(studentId), queryFn: () => services.learning.listLiveSessions(studentId), enabled: Boolean(studentId) })
}
/** @param {string} sessionId @param {string} studentId */
export function useLiveRoom(sessionId, studentId) {
  return useQuery({ queryKey: queryKeys.liveRoom(sessionId, studentId), queryFn: () => services.learning.getLiveRoom(sessionId, studentId), enabled: Boolean(sessionId && studentId) })
}
/** Joining is idempotent: a refresh resumes the same persisted register. @param {string} sessionId @param {string} studentId @param {boolean} enabled */
export function useLiveAttendance(sessionId, studentId, enabled) {
  return useQuery({ queryKey: queryKeys.liveAttendance(sessionId, studentId), queryFn: () => services.learning.joinLive(sessionId, studentId), enabled: Boolean(enabled && sessionId && studentId), refetchOnWindowFocus: false, refetchOnMount: 'always', staleTime: 0 })
}

/**
 * Subscribe to the service-owned realtime channel and fold events into cache.
 * Returns the active attention challenge so the room can render one toast.
 * @param {string} sessionId @param {string} studentId @param {boolean} enabled
 */
export function useLiveRealtime(sessionId, studentId, enabled) {
  const queryClient = useQueryClient()
  const [challenge, setChallenge] = useState(/** @type {import('@/contracts/learning.js').AttentionChallenge|null} */ (null))
  useEffect(() => {
    if (!enabled || !sessionId || !studentId) return
    const unsubscribe = services.learning.subscribe(sessionId, studentId, (event) => {
      if (event.type === 'presence') {
        queryClient.setQueryData(queryKeys.liveAttendance(sessionId, studentId), event.attendance)
        if (event.attendance.lastDelta !== 0 || !event.attendance.connected) {
          queryClient.invalidateQueries({ queryKey: queryKeys.attendanceReport(studentId) })
          queryClient.invalidateQueries({ queryKey: queryKeys.studentAttendance(studentId) })
        }
      }
      if (event.type === 'chat') {
        queryClient.setQueryData(queryKeys.liveRoom(sessionId, studentId), (/** @type {any} */ room) => room ? { ...room, chat: room.chat.some((/** @type {any} */ m) => m.id === event.message.id) ? room.chat : [...room.chat, event.message].slice(-80) } : room)
      }
      if (event.type === 'question') {
        queryClient.setQueryData(queryKeys.liveRoom(sessionId, studentId), (/** @type {any} */ room) => room ? { ...room, queue: [...room.queue.filter((/** @type {any} */ q) => q.id !== event.question.id), event.question] } : room)
      }
      if (event.type === 'attention-challenge') setChallenge(event.challenge)
      if (event.type === 'attention-resolved') setChallenge((current) => current?.id === event.checkId ? null : current)
    })
    const onVisibility = () => { void services.learning.setPresenceVisibility(sessionId, studentId, !document.hidden).catch(() => {}) }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      unsubscribe()
    }
  }, [enabled, sessionId, studentId, queryClient])
  return { challenge }
}

/** @param {string} sessionId @param {string} studentId */
export function useRespondAttention(sessionId, studentId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (/** @type {string} */ checkId) => services.learning.respondAttention(sessionId, studentId, checkId),
    onSuccess: (attendance) => {
      queryClient.setQueryData(queryKeys.liveAttendance(sessionId, studentId), attendance)
      queryClient.invalidateQueries({ queryKey: queryKeys.attendanceReport(studentId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.studentAttendance(studentId) })
    },
  })
}
/** @param {string} sessionId @param {string} studentId */
export function useLeaveLive(sessionId, studentId) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: () => services.learning.leaveLive(sessionId, studentId), onSuccess: (attendance) => { queryClient.setQueryData(queryKeys.liveAttendance(sessionId, studentId), attendance); queryClient.invalidateQueries({ queryKey: queryKeys.attendanceReport(studentId) }); queryClient.invalidateQueries({ queryKey: queryKeys.studentHome(studentId) }) } })
}
/** @param {string} sessionId @param {string} studentId */
export function useSendChat(sessionId, studentId) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (/** @type {string} */ body) => services.learning.sendChat(sessionId, studentId, body), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.liveRoom(sessionId, studentId) }) })
}
/** @param {string} sessionId @param {string} studentId */
export function useSubmitQuestion(sessionId, studentId) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (/** @type {string} */ body) => services.learning.submitQuestion(sessionId, studentId, body), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.liveRoom(sessionId, studentId) }) })
}
/** @param {string} sessionId @param {string} studentId */
export function useUpvoteQuestion(sessionId, studentId) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (/** @type {string} */ questionId) => services.learning.upvoteQuestion(sessionId, questionId, studentId), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.liveRoom(sessionId, studentId) }) })
}

/** @param {string} studentId */
export function useAttendanceReport(studentId) {
  return useQuery({ queryKey: queryKeys.attendanceReport(studentId), queryFn: () => services.learning.getAttendance(studentId), enabled: Boolean(studentId) })
}
/** @param {string} studentId */
export function useRecordingLibrary(studentId) {
  return useQuery({ queryKey: queryKeys.recordingLibrary(studentId), queryFn: () => services.learning.listRecordings(studentId), enabled: Boolean(studentId) })
}
/** @param {string} recordingId @param {string} studentId */
export function useRecording(recordingId, studentId) {
  return useQuery({ queryKey: queryKeys.recording(recordingId, studentId), queryFn: () => services.learning.getRecording(recordingId, studentId), enabled: Boolean(recordingId && studentId) })
}
/** @param {string} recordingId @param {string} studentId */
function useRecordingWrite(recordingId, studentId) {
  const queryClient = useQueryClient()
  /** @param {import('@/contracts/learning.js').PlaybackState} playback */
  const apply = (playback) => {
    queryClient.setQueryData(queryKeys.recording(recordingId, studentId), (/** @type {any} */ recording) => recording ? { ...recording, playback, progressPercent: playback.progressPercent, lastWatchedAt: playback.lastWatchedAt } : recording)
    queryClient.setQueryData(queryKeys.recordingLibrary(studentId), (/** @type {any} */ list) => Array.isArray(list) ? list.map((item) => item.id === recordingId ? { ...item, playback, progressPercent: playback.progressPercent, lastWatchedAt: playback.lastWatchedAt } : item) : list)
    queryClient.invalidateQueries({ queryKey: queryKeys.studentHome(studentId) })
  }
  return { queryClient, apply }
}
/** @param {string} recordingId @param {string} studentId */
export function useSavePlayback(recordingId, studentId) {
  const { apply } = useRecordingWrite(recordingId, studentId)
  return useMutation({ mutationFn: (/** @type {import('@/contracts/learning.js').PlaybackInput} */ input) => services.learning.savePlayback(recordingId, studentId, input), onSuccess: apply })
}
/** @param {string} recordingId @param {string} studentId */
export function useAddBookmark(recordingId, studentId) {
  const { apply } = useRecordingWrite(recordingId, studentId)
  return useMutation({ mutationFn: (/** @type {{timeSeconds:number,label:string}} */ input) => services.learning.addBookmark(recordingId, studentId, input.timeSeconds, input.label), onSuccess: apply })
}
/** @param {string} recordingId @param {string} studentId */
export function useAddNote(recordingId, studentId) {
  const { apply } = useRecordingWrite(recordingId, studentId)
  return useMutation({ mutationFn: (/** @type {{timeSeconds:number,text:string}} */ input) => services.learning.addNote(recordingId, studentId, input.timeSeconds, input.text), onSuccess: apply })
}
/** @param {string} recordingId @param {string} studentId */
export function useSubmitQuiz(recordingId, studentId) {
  const { queryClient } = useRecordingWrite(recordingId, studentId)
  return useMutation({ mutationFn: (/** @type {Record<string,string>} */ answers) => services.learning.submitQuiz(recordingId, studentId, answers), onSuccess: (quizResult) => queryClient.setQueryData(queryKeys.recording(recordingId, studentId), (/** @type {any} */ recording) => recording ? { ...recording, quizResult } : recording) })
}

/** @param {string} studentId */
export function useDoubtInbox(studentId) {
  return useQuery({ queryKey: queryKeys.doubtInbox(studentId), queryFn: () => services.learning.listDoubts(studentId), enabled: Boolean(studentId) })
}
/** @param {string} doubtId @param {string} studentId */
export function useDoubtThread(doubtId, studentId) {
  return useQuery({ queryKey: queryKeys.doubtThread(doubtId, studentId), queryFn: () => services.learning.getDoubt(doubtId, studentId), enabled: Boolean(doubtId && studentId) })
}
/** @param {string} studentId */
export function useCreateDoubt(studentId) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (/** @type {Omit<import('@/contracts/learning.js').CreateDoubtInput,'studentId'>} */ input) => services.learning.createDoubt({ ...input, studentId }), onSuccess: (doubt) => { queryClient.invalidateQueries({ queryKey: queryKeys.doubtInbox(studentId) }); queryClient.setQueryData(queryKeys.doubtThread(doubt.id, studentId), doubt) } })
}
/** @param {string} doubtId @param {string} studentId */
export function useReplyDoubt(doubtId, studentId) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (/** @type {string} */ body) => services.learning.replyDoubt(doubtId, studentId, body), onSuccess: (doubt) => { queryClient.setQueryData(queryKeys.doubtThread(doubtId, studentId), doubt); queryClient.invalidateQueries({ queryKey: queryKeys.doubtInbox(studentId) }) } })
}

/** @param {string} studentId */
export function useStudyRooms(studentId) {
  return useQuery({ queryKey: queryKeys.studyRoomList(studentId), queryFn: () => services.learning.listStudyRooms(studentId), enabled: Boolean(studentId) })
}
/** @param {string} roomId @param {string} studentId */
export function useStudyRoom(roomId, studentId) {
  return useQuery({ queryKey: queryKeys.studyRoom(roomId, studentId), queryFn: () => services.learning.getStudyRoom(roomId, studentId), enabled: Boolean(roomId && studentId) })
}
/** @param {string} roomId @param {string} studentId @param {'join'|'leave'} action */
export function useRoomMembership(roomId, studentId, action) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: () => action === 'join' ? services.learning.joinStudyRoom(roomId, studentId) : services.learning.leaveStudyRoom(roomId, studentId), onSuccess: (room) => { queryClient.setQueryData(queryKeys.studyRoom(roomId, studentId), room); queryClient.invalidateQueries({ queryKey: queryKeys.studyRoomList(studentId) }) } })
}
/** @param {string} roomId @param {string} studentId @param {boolean} enabled */
export function useRoomRealtime(roomId, studentId, enabled) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!enabled || !roomId || !studentId) return
    return services.learning.subscribeRoom(roomId, studentId, (event) => {
      if (event.type === 'room-presence') {
        queryClient.setQueryData(queryKeys.studyRoom(roomId, studentId), event.room)
        queryClient.invalidateQueries({ queryKey: queryKeys.studyRoomList(studentId) })
      }
    })
  }, [enabled, roomId, studentId, queryClient])
}
