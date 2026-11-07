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
  recordings: ['live', 'recordings'],
  studentProfile: (id) => ['students', id, 'profile'],
  studentExams: (id) => ['students', id, 'exams'],
  studentAttempts: (id) => ['students', id, 'attempts'],
  studentPerformance: (id) => ['students', id, 'performance'],
  studentNotifications: (id) => ['students', id, 'notifications'],
  studentAttendance: (id) => ['students', id, 'attendance'],
  studentDoubts: (id) => ['students', id, 'doubts'],
  studentStudyRooms: (id) => ['students', id, 'study-rooms'],
  /** @param {string} examId @param {string} studentId */
  examPaper: (examId, studentId) => ['exams', examId, 'paper', studentId],
  /** @param {string} examId @param {string} studentId @param {string} [attemptId] */
  examAnalysis: (examId, studentId, attemptId) => ['exams', examId, 'analysis', studentId, attemptId ?? 'latest'],
  /** @param {string} studentId @param {string} topicId */
  topicRevision: (studentId, topicId) => ['students', studentId, 'revision', topicId],
  /** Phase 6 learning */
  /** @param {string} studentId */
  liveSchedule(studentId) { return ['learning', 'live', 'schedule', studentId] },
  /** @param {string} sessionId @param {string} studentId */
  liveRoom(sessionId, studentId) { return ['learning', 'live', 'room', sessionId, studentId] },
  /** @param {string} sessionId @param {string} studentId */
  liveAttendance(sessionId, studentId) { return ['learning', 'live', 'attendance', sessionId, studentId] },
  /** @param {string} studentId */
  attendanceReport(studentId) { return ['learning', 'attendance', 'report', studentId] },
  /** @param {string} studentId */
  recordingLibrary(studentId) { return ['learning', 'recordings', studentId] },
  /** @param {string} recordingId @param {string} studentId */
  recording(recordingId, studentId) { return ['learning', 'recordings', recordingId, studentId] },
  /** @param {string} studentId */
  doubtInbox(studentId) { return ['learning', 'doubts', studentId] },
  /** @param {string} doubtId @param {string} studentId */
  doubtThread(doubtId, studentId) { return ['learning', 'doubts', doubtId, studentId] },
  /** @param {string} studentId */
  studyRoomList(studentId) { return ['learning', 'study-rooms', studentId] },
  /** @param {string} roomId @param {string} studentId */
  studyRoom(roomId, studentId) { return ['learning', 'study-rooms', roomId, studentId] },
}
