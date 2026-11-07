import { liveSessions, simulate } from '../../mock-data/index.js'

/** @typedef {import('../types.js').LiveService} LiveService */

/** @type {LiveService} */
export const liveService = {
  listUpcoming() {
    return simulate(() =>
      [...liveSessions].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    )
  },
}
