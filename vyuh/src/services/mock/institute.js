import { institute, simulate } from '../../mock-data/index.js'

/** @typedef {import('../types.js').InstituteService} InstituteService */

/** @type {InstituteService} */
export const instituteService = {
  getProfile() {
    return simulate(() => institute)
  },
}
