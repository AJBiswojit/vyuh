/**
 * Assessment contracts: tests, attempts, and their analytics.
 *
 * @typedef {'mock'|'chapter'|'assignment'|'live'} TestKind
 * @typedef {'draft'|'scheduled'|'live'|'closed'} TestStatus
 * @typedef {'attempting'|'submitted'|'evaluated'} AttemptStatus
 *
 * @typedef {Object} Test
 * @property {import('./ids.js').TestId} id
 * @property {string} title                 'Full Syllabus Mock 04 — JEE Main pattern'.
 * @property {TestKind} kind
 * @property {TestStatus} status
 * @property {import('./user.js').Track} track
 * @property {number} durationMinutes
 * @property {number} questionCount
 * @property {number} maxMarks
 * @property {number} totalMarksApplied     0 when not attempted.
 * @property {string | null} scheduledFor   ISO 8601 datetime, null for untimed drills.
 * @property {import('./ids.js').SubjectId[]} subjectIds
 * @property {import('./ids.js').AttemptId | null} activeAttemptId
 * @property {number} [sectionCount]
 * @property {number} [negativeMarks]
 * @property {string | null} [endsAt]
 * @property {string[]} [instructions]
 *
 * @typedef {Object} QuestionOption
 * @property {'A'|'B'|'C'|'D'} key
 * @property {string} body                  Markdown + KaTeX source.
 *
 * @typedef {Object} Question
 * @property {import('./ids.js').QuestionId} id
 * @property {number} number                1-based position in the paper.
 * @property {import('./ids.js').SubjectId} subjectId
 * @property {import('./ids.js').ChapterId} chapterId
 * @property {'single'|'multiple'|'numeric'} type
 * @property {'easy'|'medium'|'hard'} difficulty
 * @property {string} body                  Markdown + KaTeX source.
 * @property {QuestionOption[]} options     Empty for numeric questions.
 * @property {number} marks                 +4 typical.
 * @property {number} negativeMarks         -1 typical; 0 where the pattern has no penalty.
 *
 * @typedef {'answered'|'review'|'review_answered'|'not_answered'|'not_visited'} QuestionState
 *
 * @typedef {Object} AnswerEntry
 * @property {import('./ids.js').QuestionId} questionId
 * @property {QuestionState} state
 * @property {string[]} selected            Option keys, or a single numeric string.
 * @property {number} timeSpentSeconds
 *
 * @typedef {Object} Attempt
 * @property {import('./ids.js').AttemptId} id
 * @property {import('./ids.js').TestId} testId
 * @property {string} testTitle
 * @property {import('./ids.js').StudentId} studentId
 * @property {AttemptStatus} status
 * @property {string} startedAt             ISO 8601 datetime.
 * @property {string | null} submittedAt
 * @property {number} remainingSeconds      Server-truth clock for the timer.
 * @property {number} answeredCount
 * @property {number} totalQuestions
 *
 * @typedef {Object} SubjectScore
 * @property {import('./ids.js').SubjectId} subjectId
 * @property {string} subjectName
 * @property {number} scored
 * @property {number} max
 * @property {number} accuracy              Percent, 0-100.
 *
 * @typedef {Object} ScoreReport
 * @property {import('./ids.js').AttemptId} attemptId
 * @property {number} score
 * @property {number} maxMarks
 * @property {number} percentile            One decimal.
 * @property {number} rank
 * @property {number} cohortSize
 * @property {number} accuracy              Percent.
 * @property {number} attempted
 * @property {number} correct
 * @property {number} wrong
 * @property {number} unattempted
 * @property {number} durationSeconds
 * @property {SubjectScore[]} subjects
 *
 * @typedef {Object} TrendPoint
 * @property {string} label                 'Mock 01' — short, fits an axis.
 * @property {string} date                  ISO 8601 date.
 * @property {number} score
 * @property {number} percentile
 * @property {number} cohortAverage
 */

export {};
