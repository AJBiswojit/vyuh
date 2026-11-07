/**
 * The term string is configuration, not data: it is printed in the rail before
 * any network call resolves, so it must not depend on a query.
 * Kept separate from mock-data by design — this is a constant of the build.
 * @returns {string}
 */
export function institutionTerm() {
  return '2026–27 · Session 2'
}
