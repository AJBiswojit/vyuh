/**
 * Contract barrel. Import typedefs from a single module:
 *
 * @example
 * /// JSDoc usage
 * /// @typedef {import('@/contracts').DashboardSnapshot} DashboardSnapshot
 *
 * @typedef {import('./ids.js')} ids
 * @typedef {import('./common.js').Paginated} Paginated
 * @typedef {import('./common.js').ListQuery} ListQuery
 * @typedef {import('./common.js').ServiceError} ServiceError
 * @typedef {import('./user.js').Role} Role
 * @typedef {import('./user.js').Track} Track
 * @typedef {import('./user.js').User} User
 * @typedef {import('./user.js').Student} Student
 * @typedef {import('./user.js').Credentials} Credentials
 * @typedef {import('./user.js').AuthSession} AuthSession
 * @typedef {import('./academic.js').Subject} Subject
 * @typedef {import('./academic.js').Chapter} Chapter
 * @typedef {import('./academic.js').Batch} Batch
 * @typedef {import('./assessment.js').TestKind} TestKind
 * @typedef {import('./assessment.js').TestStatus} TestStatus
 * @typedef {import('./assessment.js').Test} Test
 * @typedef {import('./assessment.js').Question} Question
 * @typedef {import('./assessment.js').QuestionOption} QuestionOption
 * @typedef {import('./assessment.js').QuestionState} QuestionState
 * @typedef {import('./assessment.js').AnswerEntry} AnswerEntry
 * @typedef {import('./assessment.js').Attempt} Attempt
 * @typedef {import('./assessment.js').SubjectScore} SubjectScore
 * @typedef {import('./assessment.js').ScoreReport} ScoreReport
 * @typedef {import('./assessment.js').TrendPoint} TrendPoint
 * @typedef {import('./live.js').SessionStatus} SessionStatus
 * @typedef {import('./live.js').LiveSession} LiveSession
 * @typedef {import('./dashboard.js').ContinueItem} ContinueItem
 * @typedef {import('./dashboard.js').Announcement} Announcement
 * @typedef {import('./dashboard.js').DashboardSnapshot} DashboardSnapshot
 * @typedef {import('./dashboard.js').DailyStudyPoint} DailyStudyPoint
 * @typedef {import('./institute.js').InstituteProfile} InstituteProfile
 * @typedef {import('./institute.js').InstituteStat} InstituteStat
 * @typedef {import('./analysis.js').ExamAnalysis} ExamAnalysis
 * @typedef {import('./analysis.js').AnalysisDetails} AnalysisDetails
 * @typedef {import('./analysis.js').QuestionAnalysis} QuestionAnalysis
 * @typedef {import('./analysis.js').ReleasePolicy} ReleasePolicy
 * @typedef {import('./analysis.js').TopicRevision} TopicRevision
 * @typedef {import('./learning.js').AttendancePolicy} AttendancePolicy
 * @typedef {import('./learning.js').LiveAttendanceState} LiveAttendanceState
 * @typedef {import('./learning.js').AttendanceReport} AttendanceReport
 * @typedef {import('./learning.js').LiveRoom} LiveRoom
 * @typedef {import('./learning.js').RecordingDetail} RecordingDetail
 * @typedef {import('./learning.js').PlaybackState} PlaybackState
 * @typedef {import('./learning.js').DoubtThreadDetail} DoubtThreadDetail
 * @typedef {import('./learning.js').StudyRoomDetail} StudyRoomDetail
 * @typedef {import('./learning.js').LearningEvent} LearningEvent
 *
 * Faculty workspace (Phase 7). Attendance is aliased because the student module
 * already publishes a report under that name.
 * @typedef {import('./faculty.js').QuestionKind} QuestionKind
 * @typedef {import('./faculty.js').BankOption} BankOption
 * @typedef {import('./faculty.js').BankQuestion} BankQuestion
 * @typedef {import('./faculty.js').BankQuery} BankQuery
 * @typedef {import('./faculty.js').BankFacets} BankFacets
 * @typedef {import('./faculty.js').BankPage} BankPage
 * @typedef {import('./faculty.js').QuestionInput} QuestionInput
 * @typedef {import('./faculty.js').ExamPatternId} ExamPatternId
 * @typedef {import('./faculty.js').ExamPattern} ExamPattern
 * @typedef {import('./faculty.js').FacultyExamStatus} FacultyExamStatus
 * @typedef {import('./faculty.js').ExamSectionDraft} ExamSectionDraft
 * @typedef {import('./faculty.js').ExamIntegrity} ExamIntegrity
 * @typedef {import('./faculty.js').FacultyExam} FacultyExam
 * @typedef {import('./faculty.js').PaletteCell} PaletteCell
 * @typedef {import('./faculty.js').ExamPreview} ExamPreview
 * @typedef {import('./faculty.js').MonitorStudentStatus} MonitorStudentStatus
 * @typedef {import('./faculty.js').MonitorStudent} MonitorStudent
 * @typedef {import('./faculty.js').MonitorEvent} MonitorEvent
 * @typedef {import('./faculty.js').MonitorSnapshot} MonitorSnapshot
 * @typedef {import('./faculty.js').ItemPoint} ItemPoint
 * @typedef {import('./faculty.js').WeakTopic} WeakTopic
 * @typedef {import('./faculty.js').ScoreImpactRow} ScoreImpactRow
 * @typedef {import('./faculty.js').ItemAnalysis} ItemAnalysis
 * @typedef {import('./faculty.js').FacultyClass} FacultyClass
 * @typedef {import('./faculty.js').ClassInput} ClassInput
 * @typedef {import('./faculty.js').HostParticipant} HostParticipant
 * @typedef {import('./faculty.js').HostEvent} HostEvent
 * @typedef {import('./faculty.js').HostConsole} HostConsole
 * @typedef {import('./faculty.js').RecordingChapterDraft} RecordingChapterDraft
 * @typedef {import('./faculty.js').FacultyRecording} FacultyRecording
 * @typedef {import('./faculty.js').RecordingInput} RecordingInput
 * @typedef {import('./faculty.js').AttendanceRow} AttendanceRow
 * @typedef {import('./faculty.js').AttendanceExport} AttendanceExport
 * @typedef {import('./faculty.js').AttendanceReport} FacultyAttendanceReport
 * @typedef {import('./faculty.js').FacultyDoubtMessage} FacultyDoubtMessage
 * @typedef {import('./faculty.js').FacultyDoubt} FacultyDoubt
 * @typedef {import('./faculty.js').ReplyTemplate} ReplyTemplate
 * @typedef {import('./faculty.js').FacultyDashboard} FacultyDashboard
 *
 * Institution console (Phase 8).
 * @typedef {import('./admin.js').AdminRole} AdminRole
 * @typedef {import('./admin.js').AdminUser} AdminUser
 * @typedef {import('./admin.js').UserQuery} UserQuery
 * @typedef {import('./admin.js').UserPage} UserPage
 * @typedef {import('./admin.js').UserFacets} UserFacets
 * @typedef {import('./admin.js').AdminBatch} AdminBatch
 * @typedef {import('./admin.js').BatchDetail} BatchDetail
 * @typedef {import('./admin.js').BatchMember} BatchMember
 * @typedef {import('./admin.js').RosterFaculty} RosterFaculty
 * @typedef {import('./admin.js').AdminDashboard} AdminDashboard
 * @typedef {import('./admin.js').AdminStat} AdminStat
 * @typedef {import('./admin.js').AttendanceTrendPoint} AttendanceTrendPoint
 * @typedef {import('./admin.js').CalendarExam} CalendarExam
 * @typedef {import('./admin.js').InstitutionAlert} InstitutionAlert
 * @typedef {import('./admin.js').ApprovalItem} ApprovalItem
 * @typedef {import('./admin.js').ApprovalDecisionInput} ApprovalDecisionInput
 * @typedef {import('./admin.js').PolicyDefinition} PolicyDefinition
 * @typedef {import('./admin.js').PolicyImpact} PolicyImpact
 * @typedef {import('./admin.js').PolicyChange} PolicyChange
 * @typedef {import('./admin.js').IntegrityReport} IntegrityReport
 * @typedef {import('./admin.js').IntegritySession} IntegritySession
 * @typedef {import('./admin.js').IntegrityDecision} IntegrityDecision
 * @typedef {import('./admin.js').ModerationItem} ModerationItem
 * @typedef {import('./admin.js').AuditEntry} AuditEntry
 * @typedef {import('./admin.js').AuditQuery} AuditQuery
 * @typedef {import('./admin.js').AuditPage} AuditPage
 * @typedef {import('./admin.js').ImportField} ImportField
 * @typedef {import('./admin.js').ImportRow} ImportRow
 * @typedef {import('./admin.js').ImportPreview} ImportPreview
 * @typedef {import('./admin.js').ImportCommitResult} ImportCommitResult
 * @typedef {import('./admin.js').ReportDefinition} ReportDefinition
 * @typedef {import('./admin.js').ReportRequest} ReportRequest
 * @typedef {import('./admin.js').ReportResult} ReportResult
 * @typedef {import('./admin.js').Branding} Branding
 */

export {};
