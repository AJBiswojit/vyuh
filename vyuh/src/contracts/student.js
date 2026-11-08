/**
 * Phase 3 student workspace contracts. These are read models for the shell and
 * dashboard; the exam player, analysis and live room get their own contracts in
 * later phases.
 *
 * @typedef {import('./assessment.js').Test} Test
 * @typedef {import('./assessment.js').SubjectScore} SubjectScore
 * @typedef {import('./live.js').LiveSession} LiveSession
 *
 * @typedef {Test & { sectionCount: number, negativeMarks: number, endsAt: string | null, instructions: string[],
 *   playable?: boolean, resultMode?: 'question_level'|'score_summary'|'unpublished', unavailableReason?: string | null }} Exam
 *
 * @typedef {Object} AttemptSummary
 * @property {string} id
 * @property {string} examId
 * @property {string} title
 * @property {string} submittedAt
 * @property {number} score
 * @property {number} maxMarks
 * @property {number} percentile
 * @property {number} accuracy
 * @property {number[]} sparkline
 * @property {SubjectScore[]} subjects
 *
 * @typedef {Object} SubjectStrength
 * @property {string} subjectId
 * @property {string} name
 * @property {number} score           0-100, the student's current strength.
 * @property {number} batchAverage    0-100, dotted marker; never a rank.
 * @property {number} delta           Change since the previous attempt.
 * @property {number[]} trend         Oldest first, same scale as score.
 *
 * @typedef {Object} Recording
 * @property {string} id
 * @property {string} title
 * @property {string} chapterName
 * @property {string} subjectName
 * @property {string} facultyName
 * @property {number} durationMinutes
 * @property {number} progressPercent 0-100.
 * @property {string} lastWatchedAt
 *
 * @typedef {Object} AttendanceSummary
 * @property {number} present
 * @property {number} total
 * @property {number} percentage
 * @property {string} periodLabel
 * @property {number} currentStreak
 *
 * @typedef {Object} NotificationPreferences
 * @property {boolean} examReminders
 * @property {boolean} liveClassReminders
 * @property {boolean} resultPublished
 * @property {boolean} attendanceAlerts
 * @property {boolean} productUpdates
 *
 * @typedef {Object} DataConsentPreferences
 * @property {boolean} attendanceTracking
 * @property {boolean} performanceAnalytics
 * @property {boolean} guardianSummary
 *
 * @typedef {Object} StudentPreferences
 * @property {NotificationPreferences} notifications
 * @property {DataConsentPreferences} dataConsent
 *
 * @typedef {Object} StudentProfile
 * @property {import('./user.js').User} user
 * @property {import('./user.js').Student} student
 * @property {import('./academic.js').Batch} batch
 * @property {import('./institute.js').InstituteProfile} institute
 * @property {StudentPreferences} preferences
 *
 * @typedef {Object} StudentNotification
 * @property {string} id
 * @property {string} title
 * @property {string} body
 * @property {string} createdAt
 * @property {boolean} read
 * @property {'exam'|'class'|'result'|'institute'} kind
 *
 * @typedef {Object} PerformanceSnapshot
 * @property {AttemptSummary[]} attempts
 * @property {import('./assessment.js').TrendPoint[]} scoreTrend
 * @property {SubjectStrength[]} subjects
 *
 * @typedef {Object} DoubtThread
 * @property {string} id
 * @property {string} title
 *
 * @typedef {Object} StudyRoom
 * @property {string} id
 * @property {string} name
 */
export {}
