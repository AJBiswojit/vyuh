/**
 * v2 route alias table (data only — kept out of the `.jsx` component module so
 * React Fast Refresh can treat `v2Aliases.jsx` as a component-only file).
 *
 * The v2 client reference uses short namespaces: /s (student), /f (faculty),
 * /a (academic office). The repository's working pages live under /student,
 * /faculty and /admin. Renaming ~60 routes would be a rewrite, so instead every
 * v2 path redirects to the canonical page with the SAME guards, params, query,
 * hash and history state. Canonical routes, /app/* compatibility and all seeded
 * data are untouched.
 *
 * Aliases are entry points; in-app links keep using canonical paths. Five v2
 * names that have no literal canonical counterpart point at the nearest
 * existing page; those are marked `provisional` and are resolved by their
 * owning batch later (studio -> Batch 7, exam/compliance/people -> Batch 3/9).
 * Nothing here creates a new page, a new feature or a backend.
 */

/**
 * @typedef {Object} V2Alias
 * @property {string} path          v2 path pattern.
 * @property {string} to            canonical path pattern.
 * @property {boolean} [provisional] Nearest existing page, not the final feature.
 * @property {string} [note]        Why the mapping is provisional.
 */

/** @type {Readonly<Record<'student'|'faculty'|'admin', ReadonlyArray<V2Alias>>>} */
export const V2_ROUTE_ALIASES = Object.freeze({
  student: Object.freeze([
    { path: '/s', to: '/student' },
    { path: '/s/exams', to: '/student/exams' },
    { path: '/s/exams/:examId', to: '/student/exams/:examId' },
    { path: '/s/exams/:examId/hall', to: '/student/exams/:examId/hall' },
    { path: '/s/exams/:examId/result', to: '/student/exams/:examId/result' },
    { path: '/s/live', to: '/student/live' },
    { path: '/s/live/:sessionId', to: '/student/live/:sessionId' },
    { path: '/s/recordings', to: '/student/recordings' },
    { path: '/s/recordings/:recordingId', to: '/student/recordings/:recordingId' },
    { path: '/s/doubts', to: '/student/doubts' },
    { path: '/s/profile', to: '/student/profile' },
  ]),
  faculty: Object.freeze([
    { path: '/f', to: '/faculty' },
    { path: '/f/live', to: '/faculty/classes', provisional: true, note: 'Live-session hub is Batch 7; classes is the nearest existing list.' },
    { path: '/f/live/:sessionId/studio', to: '/faculty/classes/:sessionId/host', provisional: true, note: 'Studio is Batch 7; the host console is the current control panel, not a studio.' },
    { path: '/f/questions', to: '/faculty/bank' },
    { path: '/f/exams', to: '/faculty/exams' },
    { path: '/f/exams/:examId', to: '/faculty/exams/:examId' },
    { path: '/f/exams/:examId/monitor', to: '/faculty/exams/:examId/monitor' },
    { path: '/f/recordings', to: '/faculty/recordings' },
    { path: '/f/recordings/:recordingId', to: '/faculty/recordings/:recordingId' },
    { path: '/f/analytics', to: '/faculty/analysis' },
    { path: '/f/doubts', to: '/faculty/doubts' },
    { path: '/f/profile', to: '/faculty/account' },
  ]),
  admin: Object.freeze([
    { path: '/a', to: '/admin' },
    { path: '/a/people', to: '/admin/users', provisional: true, note: 'People Management tabs/Create User are Batch 3; the users ledger is the current surface.' },
    { path: '/a/people/import', to: '/admin/users/import' },
    { path: '/a/batches', to: '/admin/batches' },
    { path: '/a/batches/:batchId', to: '/admin/batches/:batchId' },
    { path: '/a/exams', to: '/admin/approvals', provisional: true, note: 'Full exam register is Batch 9; approvals is the current exam queue.' },
    { path: '/a/policies', to: '/admin/policies' },
    { path: '/a/reports', to: '/admin/reports' },
    { path: '/a/compliance', to: '/admin/integrity', provisional: true, note: 'Unified compliance page is Batch 9; integrity is the current closest surface.' },
    { path: '/a/settings', to: '/admin/settings' },
  ]),
})

/**
 * Namespace fallbacks. Any v2 sub-path not listed above (e.g. the instructions
 * or confirmation steps) still lands inside the right guarded workspace instead
 * of falling through to the public 404.
 */
export const V2_NAMESPACES = Object.freeze([
  Object.freeze({ from: '/s', to: '/student', path: '/s/*' }),
  Object.freeze({ from: '/f', to: '/faculty', path: '/f/*' }),
  Object.freeze({ from: '/a', to: '/admin', path: '/a/*' }),
])

/** Flat matrix used by the route verification tests and the completion report. */
export const V2_ROUTE_MATRIX = Object.freeze(
  Object.entries(V2_ROUTE_ALIASES).flatMap(([role, aliases]) =>
    aliases.map((alias) => ({ role: /** @type {'student'|'faculty'|'admin'} */ (role), ...alias })),
  ),
)
