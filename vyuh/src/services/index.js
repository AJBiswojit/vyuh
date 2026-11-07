/**
 * Service boundary. The only module in the app that knows whether data comes
 * from fixtures or HTTP.
 *
 * VITE_USE_MOCK=true   → src/services/mock (default; reads src/mock-data)
 * VITE_USE_MOCK=false  → src/services/api  (HTTP + Zod validation)
 *
 * Components, hooks and pages import `useServices()` (shared/lib) or the
 * feature hooks — never this module's implementations directly, and never
 * anything under src/mock-data.
 *
 * @typedef {import('./types.js').Services} Services
 */
import { mockServices, demoAccounts } from './mock/index.js'
import { apiServices } from './api/index.js'

/** Flag is read once at module scope; flipping it needs a dev-server restart. */
const configured = String(import.meta.env.VITE_USE_MOCK ?? 'true').toLowerCase()
const useApi = configured === 'false' || configured === '0' || configured === 'no'

/** @type {Services} */
export const services = useApi ? apiServices : mockServices

/** True when the running build reads fixtures. Drives the demo banner. */
export const isMockMode = !useApi

/**
 * Demo seats, offered on the sign-in screen in mock mode only. The API
 * implementation has no equivalent: real accounts arrive by institute invite.
 * @type {ReadonlyArray<{ email: string, role: import('../contracts/user.js').Role, label: string }>}
 */
export const demoSeats = isMockMode ? demoAccounts : []

export { mockServices, apiServices }
