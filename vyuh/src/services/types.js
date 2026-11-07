/**
 * Service interfaces, expressed as JSDoc. These are what the rest of the app
 * codes against; `services/index.js` decides whether the mock or the HTTP
 * implementation satisfies them.
 *
 * Contract for every method:
 *   • Returns a Promise.
 *   • Rejects with a `ServiceError` (see contracts/common.js) — never a bare string.
 *   • Never mutates its arguments.
 *   • Takes 200–800ms in mock mode; may reject ~3% of the time when
 *     VITE_MOCK_ERRORS=true.
 *
 * @typedef {import('../contracts/common.js').Paginated} Paginated
 * @typedef {import('../contracts/common.js').ListQuery} ListQuery
 * @typedef {import('../contracts/user.js').Credentials} Credentials
 * @typedef {import('../contracts/user.js').AuthSession} AuthSession
 * @typedef {import('../contracts/user.js').Student} Student
 * @typedef {import('../contracts/academic.js').Batch} Batch
 * @typedef {import('../contracts/academic.js').Subject} Subject
 * @typedef {import('../contracts/assessment.js').Question} Question
 * @typedef {import('../contracts/course.js').Course} Course
 * @typedef {import('../contracts/assessment.js').ScoreReport} ScoreReport
 * @typedef {import('../contracts/live.js').LiveSession} LiveSession
 * @typedef {import('../contracts/dashboard.js').DashboardSnapshot} DashboardSnapshot
 * @typedef {import('../contracts/institute.js').InstituteProfile} InstituteProfile
 *
 * ── Auth ───────────────────────────────────────────────────────────────
 * @typedef {import('../contracts/auth.js').AuthChallenge} AuthChallenge
 * @typedef {Object} AuthService
 * @property {(input: import('../contracts/auth.js').LoginInput) => Promise<AuthSession>} login
 * @property {(input: import('../contracts/auth.js').SignupInput) => Promise<AuthChallenge>} signup
 * @property {(challengeId: string) => Promise<AuthChallenge>} getChallenge
 * @property {(input: { challengeId: string, code: string }) => Promise<AuthSession | { email: string, resetPath: string }>} verifyOtp
 * @property {(challengeId: string) => Promise<AuthChallenge>} resendOtp
 * @property {(input: { email: string }) => Promise<import('../contracts/auth.js').ResetRequestResult>} requestReset
 * @property {(input: { token: string, password: string }) => Promise<{ email: string }>} resetPassword
 * @property {() => Promise<AuthSession | null>} getSession
 * @property {() => Promise<void>} logout
 * @property {() => Promise<import('../contracts/auth.js').SignupOptions>} getSignupOptions
 * @property {(code: string) => Promise<import('../contracts/auth.js').FacultyInvite>} getInvite
 * @property {(input: import('../contracts/auth.js').AcceptInviteInput) => Promise<AuthSession>} acceptInvite
 * @property {(email: string) => Promise<void>} [unlockDemo]  Mock-only lock reset.
 *
 * ── Landing ─────────────────────────────────────────────────────────────
 * @typedef {Object} LandingService
 * @property {() => Promise<import('../contracts/landing.js').LandingContent>} getContent
 *
 * ── Institute ───────────────────────────────────────────────────────────
 * @typedef {Object} InstituteService
 * @property {() => Promise<InstituteProfile>} getProfile
 *
 * ── Students ────────────────────────────────────────────────────────────
 * @typedef {Object} StudentService
 * @property {(studentId: import('../contracts/ids.js').StudentId) => Promise<Student>} getById
 * @property {(studentId: string) => Promise<import('../contracts/student.js').StudentProfile>} getProfile
 * @property {(studentId: string, preferences: import('../contracts/student.js').StudentPreferences) => Promise<import('../contracts/student.js').StudentPreferences>} updatePreferences
 * @property {(studentId: string) => Promise<import('../contracts/student.js').StudentNotification[]>} listNotifications
 * @property {(studentId: string) => Promise<import('../contracts/student.js').StudentNotification[]>} markNotificationsRead
 * @property {(studentId: string) => Promise<import('../contracts/student.js').AttendanceSummary>} getAttendance
 * @property {(studentId: string) => Promise<import('../contracts/student.js').DoubtThread[]>} listDoubts
 * @property {(studentId: string) => Promise<import('../contracts/student.js').StudyRoom[]>} listStudyRooms
 *
 * ── Academics ───────────────────────────────────────────────────────────
 * @typedef {Object} AcademicService
 * @property {(query?: ListQuery) => Promise<Paginated & { items: Batch[] }>} listBatches
 * @property {(batchId: import('../contracts/ids.js').BatchId) => Promise<Batch>} getBatch
 * @property {() => Promise<Subject[]>} listSubjects
 *
 * ── Dashboard ───────────────────────────────────────────────────────────
 * @typedef {Object} DashboardService
 * @property {(studentId: import('../contracts/ids.js').StudentId) => Promise<DashboardSnapshot>} getStudentHome
 *
 * ── Assessments ─────────────────────────────────────────────────────────
 * @typedef {Object} AssessmentService
 * @property {(studentId: import('../contracts/ids.js').StudentId) => Promise<ScoreReport | null>} getLatestReport
 * @property {(studentId: string) => Promise<import('../contracts/student.js').Exam[]>} listExams
 * @property {(studentId: string) => Promise<import('../contracts/student.js').AttemptSummary[]>} listAttempts
 * @property {(studentId: string) => Promise<import('../contracts/student.js').PerformanceSnapshot>} getPerformance
 *
 * ── Exam flow ───────────────────────────────────────────────────────────
 * @typedef {Object} ExamFlowService
 * @property {(examId: string, studentId: string) => Promise<import('../contracts/exam.js').ExamPaper>} getPaper
 * @property {(input: import('../contracts/exam.js').ExamStartInput) => Promise<import('../contracts/exam.js').ExamStartReceipt>} startAttempt
 * @property {(input: import('../contracts/exam.js').ExamSyncInput) => Promise<import('../contracts/exam.js').ExamSyncReceipt>} syncAttempt
 * @property {(input: import('../contracts/exam.js').ExamSubmissionInput) => Promise<import('../contracts/exam.js').ExamSubmissionReceipt>} submitAttempt
 *
 * ── Analysis ───────────────────────────────────────────────────────────
 * @typedef {Object} AnalysisService
 * @property {(examId: string, studentId: string, attemptId?: string) => Promise<import('../contracts/analysis.js').ExamAnalysis>} getAnalysis
 * @property {(studentId: string, topicId: string) => Promise<import('../contracts/analysis.js').TopicRevision>} getRevision
 *
 * ── Courses ─────────────────────────────────────────────────────────────
 * @typedef {Object} CourseService
 * @property {() => Promise<Course[]>} listCourses
 *
 * ── Questions ───────────────────────────────────────────────────────────
 * @typedef {Object} QuestionService
 * @property {(subjectId?: import('../contracts/ids.js').SubjectId) => Promise<Question[]>} listSamples
 *
 * ── Live ────────────────────────────────────────────────────────────────
 * @typedef {Object} LiveService
 * @property {() => Promise<LiveSession[]>} listUpcoming
 * @property {() => Promise<import('../contracts/student.js').Recording[]>} listRecordings
 *
 * ── Learning (Phase 6) ──────────────────────────────────────────────────
 * Subscription methods are the one synchronous exception: they return an
 * unsubscribe function immediately so effects can clean up on unmount.
 * @typedef {Object} LearningService
 * @property {(studentId:string)=>Promise<LiveSession[]>} listLiveSessions
 * @property {(sessionId:string,studentId:string)=>Promise<import('../contracts/learning.js').LiveRoom>} getLiveRoom
 * @property {(sessionId:string,studentId:string)=>Promise<import('../contracts/learning.js').LiveAttendanceState>} joinLive
 * @property {(sessionId:string,studentId:string)=>Promise<import('../contracts/learning.js').LiveAttendanceState>} leaveLive
 * @property {(sessionId:string,studentId:string,visible:boolean)=>Promise<import('../contracts/learning.js').LiveAttendanceState>} setPresenceVisibility
 * @property {(sessionId:string,studentId:string,checkId:string)=>Promise<import('../contracts/learning.js').LiveAttendanceState>} respondAttention
 * @property {(sessionId:string,studentId:string,body:string)=>Promise<import('../contracts/learning.js').ChatMessage>} sendChat
 * @property {(sessionId:string,studentId:string,body:string)=>Promise<import('../contracts/learning.js').QueueQuestion>} submitQuestion
 * @property {(sessionId:string,questionId:string,studentId:string)=>Promise<import('../contracts/learning.js').QueueQuestion>} upvoteQuestion
 * @property {(sessionId:string,studentId:string,listener:(event:import('../contracts/learning.js').LearningEvent)=>void)=>()=>void} subscribe
 * @property {(studentId:string)=>Promise<import('../contracts/learning.js').AttendanceReport>} getAttendance
 * @property {(studentId:string)=>Promise<import('../contracts/learning.js').RecordingDetail[]>} listRecordings
 * @property {(recordingId:string,studentId:string)=>Promise<import('../contracts/learning.js').RecordingDetail>} getRecording
 * @property {(recordingId:string,studentId:string,input:import('../contracts/learning.js').PlaybackInput)=>Promise<import('../contracts/learning.js').PlaybackState>} savePlayback
 * @property {(recordingId:string,studentId:string,timeSeconds:number,label:string)=>Promise<import('../contracts/learning.js').PlaybackState>} addBookmark
 * @property {(recordingId:string,studentId:string,timeSeconds:number,text:string)=>Promise<import('../contracts/learning.js').PlaybackState>} addNote
 * @property {(recordingId:string,studentId:string,answers:Record<string,string>)=>Promise<import('../contracts/learning.js').QuizResult>} submitQuiz
 * @property {(studentId:string)=>Promise<import('../contracts/learning.js').DoubtThreadDetail[]>} listDoubts
 * @property {(doubtId:string,studentId:string)=>Promise<import('../contracts/learning.js').DoubtThreadDetail>} getDoubt
 * @property {(input:import('../contracts/learning.js').CreateDoubtInput)=>Promise<import('../contracts/learning.js').DoubtThreadDetail>} createDoubt
 * @property {(doubtId:string,studentId:string,body:string)=>Promise<import('../contracts/learning.js').DoubtThreadDetail>} replyDoubt
 * @property {(studentId:string)=>Promise<import('../contracts/learning.js').StudyRoomDetail[]>} listStudyRooms
 * @property {(roomId:string,studentId:string)=>Promise<import('../contracts/learning.js').StudyRoomDetail>} getStudyRoom
 * @property {(roomId:string,studentId:string)=>Promise<import('../contracts/learning.js').StudyRoomDetail>} joinStudyRoom
 * @property {(roomId:string,studentId:string)=>Promise<import('../contracts/learning.js').StudyRoomDetail>} leaveStudyRoom
 * @property {(roomId:string,studentId:string,listener:(event:import('../contracts/learning.js').LearningEvent)=>void)=>()=>void} subscribeRoom
 *
 * @typedef {Object} Services
 * @property {AuthService} auth
 * @property {LandingService} landing
 * @property {InstituteService} institute
 * @property {StudentService} students
 * @property {AcademicService} academics
 * @property {DashboardService} dashboard
 * @property {AssessmentService} assessments
 * @property {CourseService} courses
 * @property {QuestionService} questions
 * @property {LiveService} live
 * @property {ExamFlowService} examFlow
 * @property {AnalysisService} analysis
 * @property {LearningService} learning
 */

export {};
