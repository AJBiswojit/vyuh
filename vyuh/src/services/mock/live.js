/**
 * Global live catalogue. BATCH 3.2 (F-01 / F-02): these readers used to hand
 * demo fixtures to ANY caller with an unknown id or without a student session.
 * They now consult the same fail-closed boundary as every other student-facing
 * service: `invalid` throws `not_found`, `issued` returns [], and only a valid
 * matching demo session sees the seeded catalogue.
 */
import { liveSessions, recordings, simulate } from '../../mock-data/index.js'
import { demoStudentWorkspace, demoSessionWorkspace } from './ownWorkspace.js'

/**
 * True ONLY for a valid matching demo seat. Throws for missing / expired /
 * malformed / wrong-role / mismatched / unknown identities.
 * @param {string} [studentId]
 */
function fixturesAllowed(studentId) {
  return studentId ? demoStudentWorkspace(studentId) : demoSessionWorkspace('student')
}

/** @typedef {import('../types.js').LiveService} LiveService */

/** @type {LiveService} */
export const liveService = {
  listUpcoming(studentId) {
    return simulate(() => {
      if (!fixturesAllowed(studentId)) return []
      return [...liveSessions].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    })
  },
  listRecordings(studentId) {
    return simulate(() => {
      if (!fixturesAllowed(studentId)) return []
      return [...recordings].sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime())
    })
  },
}
