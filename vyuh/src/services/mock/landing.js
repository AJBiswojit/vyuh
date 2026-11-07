import { landingContent, simulate } from '../../mock-data/index.js'

/** @typedef {import('../types.js').LandingService} LandingService */

/** @type {LandingService} */
export const landingService = {
  getContent() {
    return simulate(() => landingContent)
  },
}
