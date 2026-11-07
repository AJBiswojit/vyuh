/**
 * Shared value objects. Every service returns these shapes, never anything else.
 *
 * @typedef {Object} Paginated
 * @property {number} page          1-based page index.
 * @property {number} pageSize      Rows per page.
 * @property {number} total         Total rows across all pages.
 * @property {number} totalPages    Math.ceil(total / pageSize), minimum 1.
 *
 * @typedef {Object} ListQuery
 * @property {number} [page]        1-based, defaults to 1.
 * @property {number} [pageSize]    Defaults to the service's natural page size.
 * @property {string} [search]      Free text, matched case-insensitively.
 * @property {'asc'|'desc'} [order] Defaults to the service's natural order.
 *
 * @typedef {Object} ServiceError
 * @property {string} code          Stable machine code, e.g. 'not_found'.
 * @property {string} message       Sentence that states what happened and what to do.
 * @property {number} [status]      HTTP status when the transport has one.
 * @property {boolean} [retryable]  True when a retry can plausibly succeed.
 *
 * @typedef {Object} DateRange
 * @property {string} from  ISO 8601 date (YYYY-MM-DD).
 * @property {string} to    ISO 8601 date (YYYY-MM-DD).
 */

export {};
