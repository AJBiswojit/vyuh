import { liveSessions, recordings, simulate } from '../../mock-data/index.js'

/** @typedef {import('../types.js').LiveService} LiveService */

/** @type {LiveService} */
export const liveService = {
  listUpcoming() {
    return simulate(() => [...liveSessions].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()))
  },
  listRecordings() {
    return simulate(() => [...recordings].sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()))
  },
}
