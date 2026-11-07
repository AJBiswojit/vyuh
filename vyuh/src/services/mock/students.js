import {
  currentStudent,
  users,
  lastReport,
  scoreTrend,
  tests,
  liveSessions,
  studyLog,
  announcements,
  resumeItem,
  simulate,
} from '../../mock-data/index.js'
import { notFound } from './errors.js'

/** @typedef {import('../types.js').StudentService} StudentService */
/** @typedef {import('../types.js').DashboardService} DashboardService */
/** @typedef {import('../types.js').AssessmentService} AssessmentService */

/** @type {StudentService} */
export const studentService = {
  getById(studentId) {
    return simulate(() => {
      if (studentId !== currentStudent.id) throw notFound('student')
      const account = users[currentStudent.id]
      return { ...currentStudent, email: account?.email ?? '' }
    })
  },
}

/** @type {DashboardService} */
export const dashboardService = {
  getStudentHome(studentId) {
    return simulate(() => {
      if (studentId !== currentStudent.id) throw notFound('student')
      const nextTest = tests.find((test) => test.status === 'scheduled' && test.kind === 'mock') ?? null
      const liveNow = liveSessions.filter((session) => session.status === 'live')

      return {
        student: currentStudent,
        nextTest,
        liveNow,
        lastReport,
        trend: scoreTrend,
        resume: resumeItem,
        announcements,
        streakDays: 14,
        weeklyGoalPercent: 78,
        studyLog,
      }
    })
  },
}

/** @type {AssessmentService} */
export const assessmentService = {
  getLatestReport() {
    return simulate(() => lastReport)
  },
}
