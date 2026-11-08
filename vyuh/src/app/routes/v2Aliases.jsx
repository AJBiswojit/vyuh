/**
 * Thin v2 route alias redirect components. The data lives in `v2RouteTable.js`
 * so this module exports components only (React Fast Refresh friendly).
 * Both components live under the existing RequireAuth / RequireRole wrappers in
 * AppRoutes.jsx; no new guard, page or backend is introduced.
 */
import { generatePath, Navigate, useLocation, useParams } from 'react-router-dom'

/**
 * Redirect one declared v2 pattern to its canonical pattern. `generatePath`
 * substitutes :params, and query/hash/state survive the hop.
 * @param {{ to: string }} props
 */
export function V2Redirect({ to }) {
  const params = useParams()
  const location = useLocation()
  const pathname = generatePath(to, params)
  return <Navigate to={`${pathname}${location.search}${location.hash}`} replace state={location.state} />
}

/**
 * Prefix-preserving fallback for unlisted v2 sub-paths.
 * @param {{ from: string, to: string }} props
 */
export function V2NamespaceRedirect({ from, to }) {
  const location = useLocation()
  const rest = location.pathname === from ? '' : location.pathname.slice(from.length)
  return <Navigate to={`${to}${rest}${location.search}${location.hash}`} replace state={location.state} />
}
