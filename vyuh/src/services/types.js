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
 * ── Auth ────────────────────────────────────────────────────────────────
 * @typedef {Object} AuthService
 * @property {(credentials: Credentials) => Promise<AuthSession>} signIn
 * @property {() => Promise<void>} signOut
 * @property {() => Promise<AuthSession | null>} restore    Reads a persisted session.
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
 */

export {};
