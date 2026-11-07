/**
 * Mock service bundle. Picked by src/services/index.js when VITE_USE_MOCK is not false.
 * @typedef {import('../types.js').Services} Services
 */
import { authService, demoAccounts, demoScenarios, demoCredentials, demoInstituteCode, demoInviteCode, demoOtp, expiredDemoOtp } from './auth.js'
import { instituteService } from './institute.js'
import { landingService } from './landing.js'
import { academicService } from './academics.js'
import { studentService, dashboardService, assessmentService } from './students.js'
import { liveService } from './live.js'
import { examFlowService } from './examFlow.js'
import { analysisService } from './analysis.js'
import { learningService } from './learning.js'
import { courseService, questionService } from './courses.js'
import { facultyService } from './faculty.js'
import { adminService } from './admin.js'

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
  examFlow: examFlowService,
  analysis: analysisService,
  learning: learningService,
  faculty: facultyService,
  admin: adminService,
}

export { demoAccounts }

// Mock-only configuration is withheld by services/index.js in API mode.
export { demoScenarios, demoCredentials, demoInstituteCode, demoInviteCode, demoOtp, expiredDemoOtp }
