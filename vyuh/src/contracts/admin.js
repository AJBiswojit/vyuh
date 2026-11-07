/**
 * Phase 8 contracts: the institution console.
 *
 * The office owns four kinds of decision — who is on the platform, which papers
 * may run, what the rules are, and what happens when someone breaks them. Every
 * one of those writes an audit entry, so `AuditEntry` is the spine of this
 * module rather than a side table.
 *
 * Nothing here is student- or faculty-scoped: the office reads across batches.
 */

/** @typedef {'student'|'faculty'|'admin'} AdminRole */
/** @typedef {'active'|'invited'|'suspended'} AdminUserStatus */
/** @typedef {'active'|'archived'} AdminBatchStatus */
/** @typedef {'pending'|'approved'|'rejected'} ApprovalStatus */
/** @typedef {'doubt'|'chat'} ModerationKind */
/** @typedef {'open'|'removed'|'dismissed'|'warned'} ModerationStatus */
/** @typedef {'clear'|'warn'|'invalidate'} IntegrityDecision */

/**
 * @typedef {Object} AdminStat
 * @property {string} key           students | batches | attendance | exams
 * @property {string} label
 * @property {number} value
 * @property {string} [unit]        '%' for a rate.
 * @property {number} [digits]      Decimals to render.
 * @property {string} detail        One line of context under the numeral.
 * @property {'up'|'down'|'flat'} [trend]
 * @property {string} [trendLabel]
 * @property {string} [to]          Route that explains the figure.
 */

/**
 * @typedef {Object} AttendanceTrendPoint
 * @property {string} label
 * @property {string} weekStart
 * @property {number} percent
 * @property {number} sessions
 * @property {number} present
 * @property {number} possible
 */

/**
 * @typedef {Object} CalendarExam
 * @property {string} id
 * @property {string} examId
 * @property {string} title
 * @property {string} date
 * @property {string[]} batchIds
 * @property {string[]} batchNames
 * @property {string} subject
 * @property {'scheduled'|'live'|'awaiting'|'completed'} status
 * @property {string} room
 */

/**
 * @typedef {Object} InstitutionAlert
 * @property {string} id
 * @property {'danger'|'review'|'info'} tone
 * @property {string} title
 * @property {string} detail
 * @property {string} at
 * @property {{ label: string, to: string }} action
 */

/**
 * @typedef {Object} AdminDashboard
 * @property {string} instituteName
 * @property {string} termLabel
 * @property {string} centre
 * @property {string} generatedAt
 * @property {AdminStat[]} stats
 * @property {AttendanceTrendPoint[]} attendanceTrend
 * @property {CalendarExam[]} calendar
 * @property {InstitutionAlert[]} alerts
 * @property {number} pendingApprovals
 * @property {number} openFlags
 */

/**
 * @typedef {Object} AdminUser
 * @property {string} id
 * @property {string} name
 * @property {string} initials
 * @property {string} email
 * @property {string} phone
 * @property {AdminRole} role
 * @property {AdminUserStatus} status
 * @property {string|null} batchId
 * @property {string|null} batchName
 * @property {string|null} rollNumber
 * @property {string} joinedAt
 * @property {string|null} lastActiveAt
 */

/**
 * @typedef {Object} UserQuery
 * @property {string} [search]
 * @property {'all'|AdminRole} [role]
 * @property {string} [batchId]
 * @property {'all'|AdminUserStatus} [status]
 * @property {number} [page]
 * @property {number} [pageSize]
 * @property {'name'|'joined'|'lastActive'} [sort]
 */

/**
 * @typedef {Object} UserFacets
 * @property {Array<{ value: string, label: string, count: number }>} roles
 * @property {Array<{ value: string, label: string, count: number }>} batches
 * @property {Array<{ value: string, label: string, count: number }>} statuses
 */

/**
 * @typedef {Object} UserPage
 * @property {AdminUser[]} items
 * @property {number} total
 * @property {number} page
 * @property {number} pageSize
 * @property {number} pageCount
 * @property {UserFacets} facets
 * @property {{ students: number, faculty: number, admins: number, invited: number, suspended: number }} counts
 */

/**
 * @typedef {Object} RosterFaculty
 * @property {string} id
 * @property {string} name
 * @property {string} initials
 * @property {string} email
 * @property {string[]} subjectIds
 * @property {string} designation
 * @property {string} joinedAt
 * @property {number} batchesTaught
 * @property {AdminUserStatus} status
 */

/**
 * @typedef {Object} AdminBatch
 * @property {string} id
 * @property {string} name
 * @property {'JEE'|'NEET'|'NTA'} track
 * @property {'class11'|'class12'|'dropper'} cohort
 * @property {AdminBatchStatus} status
 * @property {number} studentCount
 * @property {number} capacity
 * @property {string} scheduleLabel
 * @property {string} room
 * @property {string} startDate
 * @property {string} endDate
 * @property {string[]} facultyIds
 * @property {string[]} subjectIds
 * @property {number} attendancePercent
 * @property {number} examCount
 * @property {string} feeStatus
 */

/**
 * @typedef {Object} BatchMember
 * @property {string} id
 * @property {string} name
 * @property {string} initials
 * @property {string} rollNumber
 * @property {string} email
 * @property {AdminUserStatus} status
 * @property {number} attendancePercent
 * @property {string|null} lastActiveAt
 */

/**
 * @typedef {Object} BatchDetail
 * @property {AdminBatch} batch
 * @property {BatchMember[]} members
 * @property {Array<{ id: string, name: string, shortName: string, chapterCount: number, facultyIds: string[] }>} subjects
 * @property {RosterFaculty[]} faculty
 * @property {RosterFaculty[]} availableFaculty
 * @property {{ sessionsHeld: number, averageAttendance: number, defaulters: number, questionsAuthored: number }} summary
 */

/**
 * @typedef {Object} ApprovalItem
 * @property {string} id
 * @property {string} examId
 * @property {string} title
 * @property {string} facultyId
 * @property {string} facultyName
 * @property {string[]} subjectNames
 * @property {string[]} batchIds
 * @property {string[]} batchNames
 * @property {number} totalQuestions
 * @property {number} maxMarks
 * @property {number} durationMinutes
 * @property {string} submittedAt
 * @property {string} windowStart
 * @property {string} windowEnd
 * @property {ApprovalStatus} status
 * @property {string|null} note
 * @property {string|null} decidedBy
 * @property {string|null} decidedAt
 */

/**
 * @typedef {Object} ApprovalDecisionInput
 * @property {'approve'|'reject'|'schedule'} decision
 * @property {string} [note]         Required for reject.
 * @property {string} [windowStart]  Required for schedule.
 * @property {string} [windowEnd]
 */

/**
 * @typedef {Object} PolicyDefinition
 * @property {string} id
 * @property {string} label
 * @property {string} description
 * @property {'number'|'enum'} kind
 * @property {string|number} value
 * @property {number} [min]
 * @property {number} [max]
 * @property {number} [step]
 * @property {string} [unit]
 * @property {Array<{ value: string, label: string }>} [options]
 * @property {'batches'|'students'|'exams'} scope
 * @property {string} updatedAt
 * @property {string} updatedBy
 */

/**
 * @typedef {Object} PolicyImpact
 * @property {string} policyId
 * @property {string|number} from
 * @property {string|number} to
 * @property {number} batches
 * @property {number} students
 * @property {number} exams
 * @property {string} summary        "This affects 5 batches and 632 students."
 * @property {string[]} consequences One line per consequence, already written for the reader.
 * @property {boolean} changed
 */

/**
 * @typedef {Object} PolicyChange
 * @property {string} id
 * @property {string} policyId
 * @property {string|number} from
 * @property {string|number} to
 * @property {string} at
 * @property {string} actorName
 * @property {string} note
 */

/**
 * @typedef {Object} IntegrityEvidence
 * @property {string} id
 * @property {'window'|'focus'|'device'|'camera'|'audio'} kind
 * @property {string} label
 * @property {string} detail
 * @property {string} at
 */

/**
 * @typedef {Object} IntegritySession
 * @property {string} id
 * @property {string} studentId
 * @property {string} studentName
 * @property {string} rollNumber
 * @property {number} score
 * @property {number} maxMarks
 * @property {string} flaggedAt
 * @property {string[]} reasons
 * @property {IntegrityEvidence[]} evidence
 * @property {IntegrityDecision|null} [decision]
 * @property {string|null} [note]
 * @property {string|null} [decidedBy]
 * @property {string|null} [decidedAt]
 */

/**
 * @typedef {Object} IntegrityReport
 * @property {string} id
 * @property {string} examId
 * @property {string} examTitle
 * @property {string} batchId
 * @property {string} batchName
 * @property {string} satAt
 * @property {'standard'|'strict'} proctoringLevel
 * @property {number} maxMarks
 * @property {IntegritySession[]} sessions
 */

/**
 * @typedef {Object} ModerationItem
 * @property {string} id
 * @property {ModerationKind} kind
 * @property {string} reporterName
 * @property {'student'|'faculty'} reporterRole
 * @property {string} authorId
 * @property {string} authorName
 * @property {string} batchName
 * @property {string} reason
 * @property {string} excerpt
 * @property {string} reportedAt
 * @property {number} flags
 * @property {ModerationStatus} status
 * @property {string|null} note
 * @property {string|null} decidedAt
 */

/**
 * @typedef {Object} AuditEntry
 * @property {string} id
 * @property {string} at
 * @property {string} actorId
 * @property {string} actorName
 * @property {string} actorRole
 * @property {string} action
 * @property {string} [actionLabel]  Human label, filled by the service.
 * @property {string} target
 * @property {string} summary
 * @property {string} [note]
 * @property {Record<string, unknown>} [meta]
 */

/**
 * @typedef {Object} AuditQuery
 * @property {string} [actorId]
 * @property {string} [action]
 * @property {string} [from]        YYYY-MM-DD
 * @property {string} [to]
 * @property {string} [search]
 * @property {number} [page]
 * @property {number} [pageSize]
 */

/**
 * @typedef {Object} AuditPage
 * @property {AuditEntry[]} items
 * @property {number} total
 * @property {number} page
 * @property {number} pageSize
 * @property {number} pageCount
 * @property {{ actors: Array<{ value: string, label: string, count: number }>, actions: Array<{ value: string, label: string, count: number }> }} facets
 */

/**
 * @typedef {Object} ImportField
 * @property {string} key
 * @property {string} label
 * @property {boolean} required
 * @property {string} hint
 */

/**
 * @typedef {Object} ImportRowError
 * @property {string} field
 * @property {string} message
 */

/**
 * @typedef {Object} ImportRow
 * @property {number} line           Spreadsheet row number, header included.
 * @property {string[]} cells
 * @property {Record<string, string>} values  After mapping and fixes.
 * @property {ImportRowError[]} errors
 * @property {'ready'|'invalid'|'skipped'} status
 */

/**
 * @typedef {Object} ImportPreview
 * @property {string[]} headers
 * @property {ImportRow[]} rows
 * @property {{ total: number, ready: number, invalid: number, skipped: number, fixable: number }} summary
 */

/**
 * @typedef {Object} ImportCommitResult
 * @property {number} created
 * @property {number} skipped
 * @property {number} invalid
 * @property {string[]} names
 * @property {string} auditId
 */

/**
 * @typedef {Object} ReportColumn
 * @property {string} key
 * @property {string} label
 * @property {'left'|'right'} [align]
 */

/**
 * @typedef {Object} ReportDefinition
 * @property {'attendance'|'results'|'engagement'|'users'} id
 * @property {string} label
 * @property {string} description
 * @property {ReportColumn[]} columns
 */

/**
 * @typedef {Object} ReportRequest
 * @property {'attendance'|'results'|'engagement'} kind
 * @property {string} from
 * @property {string} to
 * @property {'csv'|'xlsx'|'pdf'} format
 */

/**
 * @typedef {Object} ReportResult
 * @property {string} kind
 * @property {string} kindLabel
 * @property {string} from
 * @property {string} to
 * @property {'csv'|'xlsx'|'pdf'} format
 * @property {string} formatLabel
 * @property {ReportColumn[]} columns
 * @property {Record<string, string|number>[]} rows
 * @property {{ rows: number, note: string }} summary
 * @property {string} csv
 * @property {string} fileName
 * @property {string} generatedAt
 * @property {boolean} formatAvailable
 */

/**
 * @typedef {Object} Branding
 * @property {string} instituteName
 * @property {string} shortName
 * @property {string} tagline
 * @property {string|null} logoFileName
 * @property {string} logoMark
 * @property {string|null} logoUpdatedAt
 * @property {'locked'} colourSystem
 */

export {};
