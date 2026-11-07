/**
 * Mock service bundle. Picked by src/services/index.js when VITE_USE_MOCK is not false.
 * @typedef {import('../types.js').Services} Services
 */
import { authService, demoAccounts } from './auth.js'
import { instituteService } from './institute.js'
import { landingService } from './landing.js'
import { academicService } from './academics.js'
import { studentService, dashboardService, assessmentService } from './students.js'
import { liveService } from './live.js'
import { courseService, questionService } from './courses.js'

/** @type {Services} */
export const mockServices = {
  auth: authService,
  institute: instituteService,
  landing: landingService,
  students: studentService,
  academics: academicService,
  dashboard: dashboardService,
  assessments: assessmentService,
  live: liveService,
  courses: courseService,
  questions: questionService,
}

export { demoAccounts }
