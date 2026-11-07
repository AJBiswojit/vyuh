/**
 * mock-data barrel.
 *
 * Services import fixtures from here and nowhere else. That keeps the deletion
 * recipe in README.md to a single edit: drop this file, drop the folder.
 */
export { institute } from './institute.js'
export { users, currentStudent, DEMO_EMAILS, DEMO_PASSWORD } from './users.js'
export { subjects, chapters, batches } from './academics.js'
export { tests, lastReport, scoreTrend, questionSamples } from './assessments.js'
export { liveSessions, studyLog } from './sessions.js'
export { courses } from './courses.js'
export { announcements, resumeItem } from './dashboard.js'
export { landingContent } from './landing.js'
export { simulate, clone, errorsEnabled, errorRate, readFlag } from './latency.js'
