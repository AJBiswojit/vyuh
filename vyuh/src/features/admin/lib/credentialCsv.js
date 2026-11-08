/**
 * BATCH 3.1 (WS3 / R-2) — CREDENTIAL-EXPORT-SPECIFIC CSV SANITISATION.
 *
 * The shared `csvFromColumns()` in `shared/lib/adminMath.js` is deliberately
 * NOT changed: it serves report exports whose values are already controlled by
 * the app. Here `name` and `batchName` can originate from an uploaded CSV and
 * are therefore untrusted text cells that a spreadsheet would otherwise
 * evaluate as a formula.
 *
 * `instituteId`, `temporaryPassword` and `role` are produced by THIS app's
 * registry/generator; they are used verbatim so no generated password is ever
 * altered. The approved U-1 column order and filename are untouched, and there
 * is no credential column in the uploaded import template.
 */
import { CREDENTIAL_CSV_COLUMNS } from '@/contracts/admin.js'

const TRUSTED_KEYS = new Set(['instituteId', 'temporaryPassword', 'role'])
const FORMULA_PREFIX = /^\s*[=+\-@|\t\r]/

/**
 * @param {unknown} value
 * @param {boolean} [trusted]  true for app-generated values (no prefix added)
 * @returns {string} a single RFC-4180-style cell
 */
export function escapeCredentialCell(value, trusted = false) {
  const text = value === null || value === undefined ? '' : String(value)
  /* A leading apostrophe makes a spreadsheet treat the cell as text; Excel
     hides it, so the visible application value is preserved. CR, CRLF and LF
     remain inside the quoted cell instead of becoming new CSV records. */
  const safe = !trusted && FORMULA_PREFIX.test(text) ? `'${text}` : text
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/** @param {import('@/contracts/admin.js').CredentialSheetRow[]} rows */
export function buildCredentialCsv(rows) {
  const cell = (/** @type {any} */ row, /** @type {{key: string}} */ column) =>
    escapeCredentialCell(row[column.key], TRUSTED_KEYS.has(column.key))
  return [
    CREDENTIAL_CSV_COLUMNS.map((column) => escapeCredentialCell(column.label, true)).join(','),
    ...rows.map((row) => CREDENTIAL_CSV_COLUMNS.map((column) => cell(row, column)).join(',')),
  ].join('\n')
}
