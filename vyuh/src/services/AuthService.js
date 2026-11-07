/**
 * Public authentication facade. The chooser in services/index.js selects the
 * mock or HTTP implementation; screens and hooks never import either directly.
 * @type {import('./types.js').AuthService}
 */
import { services } from './index.js'
export const AuthService = services.auth
