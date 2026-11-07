/**
 * Dashboard contracts. Aggregates are composed in the service layer, never in
 * components — a page renders one payload, it does not fan out.
 *
 * @typedef {Object} ContinueItem
 * @property {'test'|'session'|'assignment'} kind
 * @property {string} id
 * @property {string} title
 * @property {string} meta                 'Resumes in 41 min · 12 answered'.
 * @property {number} progress             0-100.
 *
 * @typedef {Object} Announcement
 * @property {import('./ids.js').AnnouncementId} id
 * @property {string} title
 * @property {string} body
 * @property {string} publishedAt          ISO 8601 datetime.
 * @property {'institute'|'batch'|'faculty'} scope
 * @property {string} author
 *
 * @typedef {Object} DashboardSnapshot
 * @property {import('./user.js').Student} student
 * @property {import('./student.js').Exam | null} nextTest
 * @property {import('./live.js').LiveSession[]} liveNow        Empty array is a valid, common state.
 * @property {import('./assessment.js').ScoreReport | null} lastReport
 * @property {import('./assessment.js').TrendPoint[]} trend           Last six mocks, oldest first.
 * @property {ContinueItem | null} resume
 * @property {Announcement[]} announcements
 * @property {number} streakDays
 * @property {number} weeklyGoalPercent
 * @property {DailyStudyPoint[]} studyLog   Seven entries, oldest first.
 * @property {import('./student.js').AttemptSummary[]} recentAttempts Last five, newest first.
 * @property {import('./student.js').SubjectStrength[]} subjectStrength
 * @property {import('./student.js').Recording | null} continueRecording
 * @property {import('./live.js').LiveSession[]} schedule Today's upcoming classes.
 * @property {import('./student.js').AttendanceSummary} attendance
 *
 * @typedef {Object} DailyStudyPoint
 * @property {string} day                   'Mon'.
 * @property {number} minutes               Minutes logged that day.
 * @property {number} target                That day's target.
 */

export {};
