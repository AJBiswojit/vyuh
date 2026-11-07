/**
 * mock-data barrel.
 *
 * Services import fixtures from here and nowhere else. That keeps the deletion
 * recipe in README.md to a single edit: drop this file, drop the folder.
 */
export { institute } from './institute.js'
export { users, currentStudent, DEMO_EMAILS, DEMO_PASSWORD, DEMO_OTP, EXPIRED_DEMO_OTP, DEMO_INSTITUTE_CODE, DEMO_INVITE_CODE, LOCKED_DEMO_EMAIL, OFFLINE_DEMO_EMAIL, demoScenarios, signupBatches, facultyInvitations } from './users.js'
export { subjects, chapters } from './academics.js'
export { batches, studentBatchId } from './batches.js'
export { tests, exams, attempts, lastReport, scoreTrend, questionSamples } from './assessments.js'
export { subjectStrength } from './subject-strength.js'
export { recordings, continueRecording } from './recordings.js'
export { notifications, defaultPreferences } from './student-extras.js'
export { attendancePolicy, attendanceHistory, attendancePeriodLabel, activeAttendanceSeeds } from './attendance.js'
export { doubts } from './doubts.js'
export { studyRooms, roomVisitors } from './studyRooms.js'
export { chatScripts, seedChat, seedQuestions } from './liveSessions.js'
export { recordingPlaybackSeeds } from './recordings.js'
export { createEventEmitter, createMockClassChannel, createMockRoomChannel, createMockTicker, randomBetween } from './realtime.js'
export { liveSessions, studyLog } from './sessions.js'
export { courses } from './courses.js'
export { announcements, resumeItem } from './dashboard.js'
export { landingContent } from './landing.js'
export { simulate, clone, errorsEnabled, errorRate, readFlag } from './latency.js'

export { questions, buildQuestionBank, authoredSections, configuredQuestionCount, NEET_PRACTICE_EXAM_ID, DEFAULT_QUESTION_COUNT } from './questions.js'

export { analysisFixture, analysisFixtureMeta, perQuestionAnalysis, cohortDistribution, timeStatistics, mistakeCategories, releasePolicy, attemptTrend, buildAnalysisFromSubmission, buildTopicRevision } from './analysis.js'

/* ── Phase 7: faculty workspace ────────────────────────────────────────── */
export {
  questionBank, bankTopics, bankSubjects, subtopicsFor, topicById, topicsForSubject,
  questionKindLabels, difficultyLabels, bloomLabels, sourceLabels, difficultyOrder,
} from './questionBank.js'
export { examPatterns, facultyExams, examById, patternById, FACULTY_ID, FACULTY_NAME } from './facultyExams.js'
export { monitorRoster, monitorScript, seedMonitorStudents, monitorStatusLabels } from './monitorEvents.js'
export {
  ITEM_ANALYSIS_EXAM_ID, ITEM_ANALYSIS_MARKS, ITEM_ANALYSIS_NEGATIVE, analysedQuestionIds,
  analysisCohort, analysisResponses, itemPoints, reteachPlans, cohortItemAccuracy, itemReliability,
} from './itemAnalysis.js'
export {
  facultyProfile, facultyClasses, hostParticipants, facultyRecordings, replyTemplates,
  facultyDoubts, attendanceRows, attendancePeriod, cohortSnapshot, facultyDashboard,
} from './facultyWorkspace.js'
