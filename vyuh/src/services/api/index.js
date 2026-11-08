/**
 * HTTP implementation of every service interface in ../types.js.
 * Selected when VITE_USE_MOCK=false. Every response is validated with Zod from
 * ./schemas.js before it reaches a hook.
 */
import { request, apiUrl } from './http.js'
import { readPersistedSession } from '../../shared/lib/sessionPersistence.js'
import { setSessionToken, restoreSessionToken } from './sessionToken.js'
import {
  authSessionSchema,
  batchPageSchema,
  batchSchema,
  courseSchema,
  questionSchema,
  credentialsSchema,
  signupSchema,
  otpSchema,
  forgotPasswordSchema,
  resetPasswordRequestSchema,
  acceptInviteRequestSchema,
  authChallengeSchema,
  resetRequestSchema,
  signupOptionsSchema,
  facultyInviteSchema,
  dashboardSnapshotSchema,
  studentSchema,
  instituteProfileSchema,
  landingContentSchema,
  liveSessionSchema,
  scoreReportSchema,
  subjectSchema,
  examSchema,
  attemptSummarySchema,
  performanceSnapshotSchema,
  recordingSchema,
  studentProfileSchema,
  studentPreferencesSchema,
  studentNotificationSchema,
  attendanceSummarySchema,
  doubtThreadSchema,
  studyRoomSchema,
  liveAttendanceStateSchema, attendanceReportSchema, chatMessageSchema, queueQuestionSchema, liveRoomSchema,
  playbackStateSchema, recordingDetailSchema, quizResultSchema, doubtThreadDetailSchema, studyRoomDetailSchema, learningEventSchema,
  examPaperSchema,
  examStartInputSchema,
  examStartReceiptSchema,
  examSyncInputSchema,
  examSyncReceiptSchema,
  examSubmissionInputSchema,
  examSubmissionReceiptSchema,
  examAnalysisSchema,
  topicRevisionSchema,
  instituteIdSchema,
} from './schemas.js'
import { z } from 'zod'

/**
 * SSE subscription for the HTTP adapter. Cookie/auth context is owned by the
 * browser; the mock adapter uses the local event emitter instead.
 * @param {string} path
 * @param {(event:import('../../contracts/learning.js').LearningEvent)=>void} listener
 */
function openLearningStream(path, listener) {
  const source = new EventSource(apiUrl(path), { withCredentials: true })
  source.onmessage = (event) => {
    try {
      const parsed = learningEventSchema.safeParse(JSON.parse(event.data))
      if (parsed.success) listener(parsed.data)
    } catch { /* Malformed frames are dropped at the boundary. */ }
  }
  return () => source.close()
}

/** @typedef {import('../types.js').Services} Services */


/**
 * Faculty workspace endpoints are not published on the HTTP API yet. Rather than
 * pretend, every method rejects with one sentence that says so — a screen then
 * shows its error state instead of a blank panel. Subscription methods throw
 * synchronously because their contract is synchronous.
 */
function facultyError() {
  const error = new Error('The faculty workspace is mock-only in this build. Set VITE_USE_MOCK=true, or publish the faculty endpoints.')
  error.name = 'ServiceError'
  Object.assign(error, { code: 'faculty_api_unavailable', status: 501, retryable: false })
  return error
}

/** Batch 2: no backend endpoints exist for identity setup yet. Do not pretend. */
function authSetupUnavailable() {
  const error = new Error('First-login setup is mock-only in this build. Set VITE_USE_MOCK=true, or publish the account-setup endpoints.')
  error.name = 'ServiceError'
  Object.assign(error, { code: 'setup_api_unavailable', status: 501, retryable: false })
  return error
}

const facultyMethodNames = [
  'getDashboard', 'listBankQuestions', 'getBankQuestion', 'createBankQuestion', 'updateBankQuestion',
  'deleteBankQuestion', 'listBankFacets', 'listSubtopics', 'listExamPatterns', 'listExams', 'getExam',
  'createExam', 'saveExam', 'addQuestionToExam', 'removeQuestionFromExam', 'setExamStatus',
  'getExamPreview', 'deleteExam', 'getMonitor', 'getItemAnalysis', 'markQuestionFaulty',
  'restoreQuestion', 'listClasses', 'createClass', 'cancelClass', 'getHostConsole', 'startSession',
  'endSession', 'triggerAttentionCheck', 'setParticipantMuted', 'hideChatMessage',
  'approveQueueQuestion', 'listRecordings', 'getRecording', 'createRecording', 'saveRecording',
  'deleteRecording', 'getAttendanceReport', 'exportAttendance', 'listDoubts', 'getDoubt',
  'replyDoubt', 'resolveDoubt', 'listReplyTemplates',
]

/** @type {Record<string, unknown>} */
const facultyApi = Object.fromEntries(
  facultyMethodNames.map((name) => [name, () => Promise.reject(facultyError())]),
)
facultyApi.subscribeMonitor = () => { throw facultyError() }
facultyApi.subscribeHost = () => { throw facultyError() }

/**
 * The institution console has no published HTTP endpoints either. Same rule as
 * the faculty stubs: reject with a sentence a screen can show, never a blank
 * panel. There is no subscription here — the console is request/response.
 */
function adminError() {
  const error = new Error('The institution console is mock-only in this build. Set VITE_USE_MOCK=true, or publish the admin endpoints.')
  error.name = 'ServiceError'
  Object.assign(error, { code: 'admin_api_unavailable', status: 501, retryable: false })
  return error
}

const adminMethodNames = [
  'getDashboard', 'listUsers', 'getImportTemplate', 'previewImport', 'commitImport', 'listAdminBatches',
  'getAdminBatch', 'saveBatchFaculty', 'listApprovals', 'decideApproval', 'listPolicies',
  'getPolicyImpact', 'listPolicyHistory', 'updatePolicy', 'listIntegrityReports',
  'getIntegrityReport', 'decideIntegrity', 'runReport', 'listModeration', 'decideModeration',
  'listAudit', 'getBranding', 'saveBranding',
  /* Batch 3 — name parity only. The institution console remains mock-only:
     there are no admin endpoints and every call rejects with an honest 501. */
  'getInstituteIdConfig', 'configureInstituteIds', 'previewInstituteId', 'createUser',
  'markCredentialsShown', 'applyAccountOperation', 'editAccount',
  'moveStudentBatch', 'reissueTemporaryPassword',
]

/** @type {Record<string, unknown>} */
const adminApi = Object.fromEntries(
  adminMethodNames.map((name) => [name, () => Promise.reject(adminError())]),
)

/** @type {Services} */
export const apiServices = {
  auth: {
    async login(credentials) {
      const body = credentialsSchema.parse(credentials)
      const session = await request('/auth/login', { method: 'POST', body, schema: authSessionSchema })
      setSessionToken(session.token)
      return session
    },
    /** One shared identifier resolver in the facade: an Institute ID is an email-field alias. */
    loginByInstituteId(input) {
      const instituteId = instituteIdSchema.parse(input?.instituteId)
      return apiServices.auth.login({ email: instituteId, password: input?.password })
    },
    changePasswordWithSetup() {
      return Promise.reject(authSetupUnavailable())
    },
    getAccountStatus() {
      return Promise.reject(authSetupUnavailable())
    },
    async signup(input) {
      const body = signupSchema.parse(input)
      return request('/auth/signup', { method: 'POST', body, schema: authChallengeSchema })
    },
    getChallenge(challengeId) {
      return request(`/auth/challenges/${encodeURIComponent(challengeId)}`, { schema: authChallengeSchema })
    },
    async verifyOtp(input) {
      const body = otpSchema.parse(input)
      const schema = z.union([authSessionSchema, z.object({ email: z.email(), resetPath: z.string() })])
      const result = await request('/auth/verify-otp', { method: 'POST', body, schema })
      if ('token' in result) setSessionToken(result.token)
      return result
    },
    resendOtp(challengeId) {
      return request('/auth/resend-otp', { method: 'POST', body: { challengeId }, schema: authChallengeSchema })
    },
    requestReset(input) {
      return request('/auth/forgot-password', { method: 'POST', body: forgotPasswordSchema.parse(input), schema: resetRequestSchema })
    },
    resetPassword(input) {
      const body = resetPasswordRequestSchema.parse(input)
      return request('/auth/reset-password', { method: 'POST', body: { token: body.token, password: body.password }, schema: z.object({ email: z.email() }) })
    },
    getSignupOptions() {
      return request('/auth/signup-options', { schema: signupOptionsSchema })
    },
    getInvite(code) {
      return request(`/auth/invitations/${encodeURIComponent(code)}`, { schema: facultyInviteSchema })
    },
    async acceptInvite(input) {
      const body = acceptInviteRequestSchema.parse(input)
      const session = await request('/auth/accept-invite', { method: 'POST', body: { inviteCode: body.inviteCode, password: body.password }, schema: authSessionSchema })
      setSessionToken(session.token)
      return session
    },
    async getSession() {
      const stored = readPersistedSession()
      if (!stored && !restoreSessionToken()) return null
      try {
        const session = await request('/auth/session', { schema: authSessionSchema })
        setSessionToken(session.token)
        return session
      } catch (error) {
        if (/** @type {{ code?: string }} */ (error).code === 'unauthorized') { setSessionToken(null); return null }
        throw error
      }
    },
    async logout() {
      try { await request('/auth/session', { method: 'DELETE' }) }
      finally { setSessionToken(null) }
    },
  },

  institute: {
    getProfile() {
      return request('/institute', { schema: instituteProfileSchema })
    },
  },

  landing: {
    getContent() {
      return request('/landing', { schema: landingContentSchema })
    },
  },

  students: {
    getById(studentId) {
      return request(`/students/${encodeURIComponent(studentId)}`, { schema: studentSchema })
    },
    getProfile(studentId) {
      return request(`/students/${encodeURIComponent(studentId)}/profile`, { schema: studentProfileSchema })
    },
    updatePreferences(studentId, preferences) {
      return request(`/students/${encodeURIComponent(studentId)}/preferences`, { method: 'PATCH', body: preferences, schema: studentPreferencesSchema })
    },
    listNotifications(studentId) {
      return request(`/students/${encodeURIComponent(studentId)}/notifications`, { schema: z.array(studentNotificationSchema) })
    },
    markNotificationsRead(studentId) {
      return request(`/students/${encodeURIComponent(studentId)}/notifications/read`, { method: 'POST', schema: z.array(studentNotificationSchema) })
    },
    getAttendance(studentId) {
      return request(`/students/${encodeURIComponent(studentId)}/attendance`, { schema: attendanceSummarySchema })
    },
    listDoubts(studentId) {
      return request(`/students/${encodeURIComponent(studentId)}/doubts`, { schema: z.array(doubtThreadSchema) })
    },
    listStudyRooms(studentId) {
      return request(`/students/${encodeURIComponent(studentId)}/study-rooms`, { schema: z.array(studyRoomSchema) })
    },
  },

  academics: {
    listBatches(query = {}) {
      const params = new URLSearchParams()
      if (query.page) params.set('page', String(query.page))
      if (query.pageSize) params.set('pageSize', String(query.pageSize))
      if (query.search) params.set('search', query.search)
      if (query.order) params.set('order', query.order)
      const suffix = params.size > 0 ? `?${params.toString()}` : ''
      return request(`/batches${suffix}`, { schema: batchPageSchema })
    },
    getBatch(batchId) {
      return request(`/batches/${encodeURIComponent(batchId)}`, {
        schema: batchSchema.extend({ subjects: z.array(subjectSchema).optional() }),
      })
    },
    listSubjects() {
      return request('/subjects', { schema: z.array(subjectSchema) })
    },
  },

  dashboard: {
    getStudentHome(studentId) {
      return request(`/students/${encodeURIComponent(studentId)}/home`, {
        schema: dashboardSnapshotSchema,
      })
    },
  },

  assessments: {
    getLatestReport(studentId) {
      return request(`/students/${encodeURIComponent(studentId)}/reports/latest`, { schema: scoreReportSchema.nullable() })
    },
    listExams(studentId) {
      return request(`/students/${encodeURIComponent(studentId)}/exams`, { schema: z.array(examSchema) })
    },
    listAttempts(studentId) {
      return request(`/students/${encodeURIComponent(studentId)}/attempts`, { schema: z.array(attemptSummarySchema) })
    },
    getPerformance(studentId) {
      return request(`/students/${encodeURIComponent(studentId)}/performance`, { schema: performanceSnapshotSchema })
    },
  },

  examFlow: {
    getPaper(examId, studentId) {
      return request(`/exams/${encodeURIComponent(examId)}/paper?studentId=${encodeURIComponent(studentId)}`, { schema: examPaperSchema })
    },
    startAttempt(input) {
      return request(`/exams/${encodeURIComponent(input.examId)}/attempts`, { method: 'POST', body: examStartInputSchema.parse(input), schema: examStartReceiptSchema })
    },
    syncAttempt(input) {
      return request(`/exam-attempts/${encodeURIComponent(input.attemptId)}/sync`, { method: 'POST', body: examSyncInputSchema.parse(input), schema: examSyncReceiptSchema })
    },
    submitAttempt(input) {
      return request(`/exam-attempts/${encodeURIComponent(input.attemptId)}/submit`, { method: 'POST', body: examSubmissionInputSchema.parse(input), schema: examSubmissionReceiptSchema })
    },
  },

  analysis: {
    getAnalysis(examId, studentId, attemptId) {
      const params = new URLSearchParams({ studentId })
      if (attemptId) params.set('attemptId', attemptId)
      return request(`/exams/${encodeURIComponent(examId)}/analysis?${params.toString()}`, { schema: examAnalysisSchema })
    },
    getRevision(studentId, topicId) {
      return request(`/students/${encodeURIComponent(studentId)}/revision/${encodeURIComponent(topicId)}`, { schema: topicRevisionSchema })
    },
  },

  courses: {
    listCourses() {
      return request('/courses', { schema: z.array(courseSchema) })
    },
  },

  questions: {
    listSamples(subjectId) {
      const suffix = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : ''
      return request(`/questions/samples${suffix}`, { schema: z.array(questionSchema) })
    },
  },

  learning: {
    listLiveSessions(studentId) { return request(`/live/sessions?studentId=${encodeURIComponent(studentId)}`, { schema: z.array(liveSessionSchema) }) },
    getLiveRoom(sessionId, studentId) { return request(`/live/sessions/${encodeURIComponent(sessionId)}?studentId=${encodeURIComponent(studentId)}`, { schema: liveRoomSchema }) },
    joinLive(sessionId, studentId) { return request(`/live/sessions/${encodeURIComponent(sessionId)}/join`, { method: 'POST', body: { studentId }, schema: liveAttendanceStateSchema }) },
    leaveLive(sessionId, studentId) { return request(`/live/sessions/${encodeURIComponent(sessionId)}/leave`, { method: 'POST', body: { studentId }, schema: liveAttendanceStateSchema }) },
    setPresenceVisibility(sessionId, studentId, visible) { return request(`/live/sessions/${encodeURIComponent(sessionId)}/visibility`, { method: 'PATCH', body: { studentId, visible }, schema: liveAttendanceStateSchema }) },
    respondAttention(sessionId, studentId, checkId) { return request(`/live/sessions/${encodeURIComponent(sessionId)}/attention`, { method: 'POST', body: { studentId, checkId }, schema: liveAttendanceStateSchema }) },
    sendChat(sessionId, studentId, body) { return request(`/live/sessions/${encodeURIComponent(sessionId)}/chat`, { method: 'POST', body: { studentId, body }, schema: chatMessageSchema }) },
    submitQuestion(sessionId, studentId, body) { return request(`/live/sessions/${encodeURIComponent(sessionId)}/questions`, { method: 'POST', body: { studentId, body }, schema: queueQuestionSchema }) },
    upvoteQuestion(sessionId, questionId, studentId) { return request(`/live/sessions/${encodeURIComponent(sessionId)}/questions/${encodeURIComponent(questionId)}/upvote`, { method: 'POST', body: { studentId }, schema: queueQuestionSchema }) },
    subscribe(sessionId, studentId, listener) { return openLearningStream(`/live/sessions/${encodeURIComponent(sessionId)}/events?studentId=${encodeURIComponent(studentId)}`, listener) },
    getAttendance(studentId) { return request(`/students/${encodeURIComponent(studentId)}/attendance/report`, { schema: attendanceReportSchema }) },
    listRecordings(studentId) { return request(`/recordings?studentId=${encodeURIComponent(studentId)}`, { schema: z.array(recordingDetailSchema) }) },
    getRecording(recordingId, studentId) { return request(`/recordings/${encodeURIComponent(recordingId)}?studentId=${encodeURIComponent(studentId)}`, { schema: recordingDetailSchema }) },
    savePlayback(recordingId, studentId, input) { return request(`/recordings/${encodeURIComponent(recordingId)}/playback`, { method: 'PATCH', body: { studentId, ...input }, schema: playbackStateSchema }) },
    addBookmark(recordingId, studentId, timeSeconds, label) { return request(`/recordings/${encodeURIComponent(recordingId)}/bookmarks`, { method: 'POST', body: { studentId, timeSeconds, label }, schema: playbackStateSchema }) },
    addNote(recordingId, studentId, timeSeconds, text) { return request(`/recordings/${encodeURIComponent(recordingId)}/notes`, { method: 'POST', body: { studentId, timeSeconds, text }, schema: playbackStateSchema }) },
    submitQuiz(recordingId, studentId, answers) { return request(`/recordings/${encodeURIComponent(recordingId)}/quiz`, { method: 'POST', body: { studentId, answers }, schema: quizResultSchema }) },
    listDoubts(studentId) { return request(`/students/${encodeURIComponent(studentId)}/doubts`, { schema: z.array(doubtThreadDetailSchema) }) },
    getDoubt(doubtId, studentId) { return request(`/doubts/${encodeURIComponent(doubtId)}?studentId=${encodeURIComponent(studentId)}`, { schema: doubtThreadDetailSchema }) },
    createDoubt(input) { return request('/doubts', { method: 'POST', body: input, schema: doubtThreadDetailSchema }) },
    replyDoubt(doubtId, studentId, body) { return request(`/doubts/${encodeURIComponent(doubtId)}/replies`, { method: 'POST', body: { studentId, body }, schema: doubtThreadDetailSchema }) },
    listStudyRooms(studentId) { return request(`/students/${encodeURIComponent(studentId)}/study-rooms`, { schema: z.array(studyRoomDetailSchema) }) },
    getStudyRoom(roomId, studentId) { return request(`/study-rooms/${encodeURIComponent(roomId)}?studentId=${encodeURIComponent(studentId)}`, { schema: studyRoomDetailSchema }) },
    joinStudyRoom(roomId, studentId) { return request(`/study-rooms/${encodeURIComponent(roomId)}/join`, { method: 'POST', body: { studentId }, schema: studyRoomDetailSchema }) },
    leaveStudyRoom(roomId, studentId) { return request(`/study-rooms/${encodeURIComponent(roomId)}/leave`, { method: 'POST', body: { studentId }, schema: studyRoomDetailSchema }) },
    subscribeRoom(roomId, studentId, listener) { return openLearningStream(`/study-rooms/${encodeURIComponent(roomId)}/events?studentId=${encodeURIComponent(studentId)}`, listener) },
  },

  faculty: /** @type {unknown} */ (facultyApi),

  admin: /** @type {unknown} */ (adminApi),

  live: {
    listUpcoming() {
      return request('/live/sessions', { schema: z.array(liveSessionSchema) })
    },
    listRecordings() {
      return request('/live/recordings', { schema: z.array(recordingSchema) })
    },
  },
}
