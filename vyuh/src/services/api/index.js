/**
 * HTTP implementation of every service interface in ../types.js.
 * Selected when VITE_USE_MOCK=false. Every response is validated with Zod from
 * ./schemas.js before it reaches a hook.
 */
import { request, setToken, getToken } from './http.js'
import {
  authSessionSchema,
  batchPageSchema,
  batchSchema,
  credentialsSchema,
  dashboardSnapshotSchema,
  instituteProfileSchema,
  landingContentSchema,
  liveSessionSchema,
  scoreReportSchema,
  subjectSchema,
} from './schemas.js'
import { z } from 'zod'

/** @typedef {import('../types.js').Services} Services */

/** @type {Services} */
export const apiServices = {
  auth: {
    async signIn(credentials) {
      const body = credentialsSchema.parse(credentials)
      const session = await request('/auth/session', { method: 'POST', body, schema: authSessionSchema })
      setToken(session.token)
      return session
    },
    async signOut() {
      await request('/auth/session', { method: 'DELETE' })
      setToken(null)
    },
    async restore() {
      if (!getToken()) return null
      return request('/auth/session', { schema: authSessionSchema })
    },
  },

  institute: {
    getProfile() {
      return request('/institute', { schema: instituteProfileSchema })
    },
  },

  landing: {
    getContent() {
      return request('/landing', { schema: landingContentSchema })
    },
  },

  students: {
    getById(studentId) {
      return request(`/students/${encodeURIComponent(studentId)}`, {
        schema: dashboardSnapshotSchema.shape.student,
      })
    },
  },

  academics: {
    listBatches(query = {}) {
      const params = new URLSearchParams()
      if (query.page) params.set('page', String(query.page))
      if (query.pageSize) params.set('pageSize', String(query.pageSize))
      if (query.search) params.set('search', query.search)
      if (query.order) params.set('order', query.order)
      const suffix = params.size > 0 ? `?${params.toString()}` : ''
      return request(`/batches${suffix}`, { schema: batchPageSchema })
    },
    getBatch(batchId) {
      return request(`/batches/${encodeURIComponent(batchId)}`, {
        schema: batchSchema.extend({ subjects: z.array(subjectSchema).optional() }),
      })
    },
    listSubjects() {
      return request('/subjects', { schema: z.array(subjectSchema) })
    },
  },

  dashboard: {
    getStudentHome(studentId) {
      return request(`/students/${encodeURIComponent(studentId)}/home`, {
        schema: dashboardSnapshotSchema,
      })
    },
  },

  assessments: {
    getLatestReport(studentId) {
      return request(`/students/${encodeURIComponent(studentId)}/reports/latest`, {
        schema: scoreReportSchema.nullable(),
      })
    },
  },

  courses: {
    listCourses() {
      return request('/courses', { schema: z.array(courseSchema) })
    },
  },

  questions: {
    listSamples(subjectId) {
      const suffix = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : ''
      return request(`/questions/samples${suffix}`, { schema: z.array(questionSchema) })
    },
  },

  live: {
    listUpcoming() {
      return request('/live/sessions', { schema: z.array(liveSessionSchema) })
    },
  },
}
