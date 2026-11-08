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

  /* Phase 7 — faculty workspace. One namespace, then the domain. */
  faculty: {
    /** @param {string} facultyId */
    dashboard(facultyId) { return ['faculty', facultyId, 'dashboard'] },
    /** @param {string} facultyId @param {object} query */
    bank(facultyId, query) { return ['faculty', facultyId, 'bank', query] },
    /** @param {string} facultyId @param {string} questionId */
    question(facultyId, questionId) { return ['faculty', facultyId, 'bank', questionId] },
    /** @param {string} facultyId */
    exams(facultyId) { return ['faculty', facultyId, 'exams'] },
    /** @param {string} facultyId @param {string} examId */
    exam(facultyId, examId) { return ['faculty', facultyId, 'exams', examId] },
    /** @param {string} facultyId @param {string} examId */
    examPreview(facultyId, examId) { return ['faculty', facultyId, 'exams', examId, 'preview'] },
    /** @param {string} facultyId @param {string} examId */
    monitor(facultyId, examId) { return ['faculty', facultyId, 'exams', examId, 'monitor'] },
    /** @param {string} facultyId @param {string} examId */
    itemAnalysis(facultyId, examId) { return ['faculty', facultyId, 'analysis', examId] },
    /** @param {string} facultyId */
    classes(facultyId) { return ['faculty', facultyId, 'classes'] },
    /** @param {string} facultyId @param {string} sessionId */
    hostConsole(facultyId, sessionId) { return ['faculty', facultyId, 'classes', sessionId, 'host'] },
    /** @param {string} facultyId */
    facultyRecordings(facultyId) { return ['faculty', facultyId, 'recordings'] },
    /** @param {string} facultyId @param {string} recordingId */
    facultyRecording(facultyId, recordingId) { return ['faculty', facultyId, 'recordings', recordingId] },
    /** @param {string} facultyId @param {object} filter */
    facultyAttendance(facultyId, filter) { return ['faculty', facultyId, 'attendance', filter] },
    /** @param {string} facultyId @param {string} status */
    facultyDoubts(facultyId, status) { return ['faculty', facultyId, 'doubts', status] },
    /** @param {string} facultyId @param {string} doubtId */
    facultyDoubt(facultyId, doubtId) { return ['faculty', facultyId, 'doubts', doubtId] },
    /** @param {string} facultyId */
    replyTemplates(facultyId) { return ['faculty', facultyId, 'reply-templates'] },
  },

  /* Phase 8 — institution console. One namespace, then the screen. */
  admin: {
    /** @param {string} adminId */
    dashboard(adminId) { return ['admin', adminId, 'dashboard'] },
    /** @param {string} adminId @param {object} query */
    users(adminId, query) { return ['admin', adminId, 'users', query] },
    /** @param {string} adminId */
    batches(adminId) { return ['admin', adminId, 'batches'] },
    /** @param {string} adminId @param {string} batchId */
    batch(adminId, batchId) { return ['admin', adminId, 'batches', batchId] },
    /** @param {string} adminId @param {string} status */
    approvals(adminId, status) { return ['admin', adminId, 'approvals', status] },
    /** @param {string} adminId */
    policies(adminId) { return ['admin', adminId, 'policies'] },
    /** @param {string} adminId @param {string} key @param {string|number} value */
    policyImpact(adminId, key, value) { return ['admin', adminId, 'policies', key, 'impact', value] },
    /** @param {string} adminId */
    policyHistory(adminId) { return ['admin', adminId, 'policies', 'history'] },
    /** @param {string} adminId */
    integrityReports(adminId) { return ['admin', adminId, 'integrity'] },
    /** @param {string} adminId @param {string} examId */
    integrityReport(adminId, examId) { return ['admin', adminId, 'integrity', examId] },
    /** @param {string} adminId @param {object} filter */
    moderation(adminId, filter) { return ['admin', adminId, 'moderation', filter] },
    /** @param {string} adminId @param {object} query */
    audit(adminId, query) { return ['admin', adminId, 'audit', query] },
    /** @param {string} adminId */
    branding(adminId) { return ['admin', adminId, 'branding'] },
    /* Batch 3 — Admin People. Credential values are NEVER stored under a query key. */
    /** @param {string} adminId */
    instituteIdConfig(adminId) { return ['admin', adminId, 'institute-id-config'] },
  },
}
