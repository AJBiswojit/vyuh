/**
 * Arithmetic and text handling the institution console needs and the service
 * must not re-invent: CSV parsing, row-level import validation, policy impact
 * counting and report serialisation.
 *
 * The validation rules live here rather than in the wizard because the commit
 * uses the same function — a row the preview calls valid is a row the commit
 * accepts. Where a rule is subjective, the message says what to do about it.
 *
 * @typedef {import('../../contracts/admin.js').ImportPreview} ImportPreview
 * @typedef {import('../../contracts/admin.js').ImportRow} ImportRow
 * @typedef {import('../../contracts/admin.js').PolicyDefinition} PolicyDefinition
 * @typedef {import('../../contracts/admin.js').PolicyImpact} PolicyImpact
 * @typedef {import('../../contracts/admin.js').AdminBatch} AdminBatch
 * @typedef {import('../../contracts/admin.js').AdminUser} AdminUser
 * @typedef {import('../../contracts/admin.js').ReportColumn} ReportColumn
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const ROLL_RE = /^VY-\d{2}-\d{4}$/i

/**
 * Parse a CSV. Quoted fields may contain commas, quotes (doubled) and newlines.
 * Blank lines are dropped; every returned row keeps its spreadsheet line number
 * so an error can point at the row the office can see.
 * @param {string} text
 * @returns {{ headers: string[], rows: Array<{ line: number, cells: string[] }> }}
 */
export function parseCsv(text) {
  const source = String(text ?? '').replace(/\r\n?/g, '\n')
  /** @type {string[][]} */
  const raw = []
  /** @type {string[]} */
  let row = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        cell += character
      }
      continue
    }
    if (character === '"') {
      quoted = true
    } else if (character === ',') {
      row.push(cell)
      cell = ''
    } else if (character === '\n') {
      row.push(cell)
      raw.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    raw.push(row)
  }

  const cleaned = raw.map((cells) => cells.map((value) => value.trim())).filter((cells) => cells.some((value) => value.length > 0))
  if (cleaned.length === 0) return { headers: [], rows: [] }

  return {
    headers: cleaned[0].map((header) => header.replace(/^\uFEFF/, '')),
    rows: cleaned.slice(1).map((cells, index) => ({ line: index + 2, cells })),
  }
}

/**
 * Accepts the three date spellings an Indian office sheet actually contains.
 * Returns `YYYY-MM-DD` or null when the date does not exist (31 February).
 * @param {string} value
 */
export function normaliseDate(value) {
  const text = String(value ?? '').trim()
  if (!text) return null
  let year
  let month
  let day
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (match) {
    year = Number(match[1]); month = Number(match[2]); day = Number(match[3])
  } else {
    match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (!match) return null
    day = Number(match[1]); month = Number(match[2]); year = Number(match[3])
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Phone numbers arrive with spaces, dashes, +91 or a leading zero. Keep the last
 * ten digits so the stored value is one shape.
 * @param {string} value
 */
export function normalisePhone(value) {
  const digits = String(value ?? '').replace(/[^\d]/g, '')
  if (!digits) return ''
  return digits.length > 10 ? digits.slice(-10) : digits
}

/**
 * Match a header to a target field without asking the office to remember what
 * it called the column last time.
 * @param {string} header
 * @param {Record<string, string[]>} aliases
 */
export function matchHeader(header, aliases) {
  const normalised = header.trim().toLowerCase().replace(/\s+/g, ' ')
  for (const [field, options] of Object.entries(aliases)) {
    if (options.includes(normalised)) return field
  }
  return ''
}

/**
 * Validate the sheet against the mapping, the existing roster and any fixes the
 * office has typed. `skipped` holds spreadsheet line numbers.
 *
 * @param {Object} input
 * @param {string} input.csv
 * @param {Record<string, string>} input.mapping       field key → header
 * @param {AdminUser[]} input.users
 * @param {AdminBatch[]} input.batches
 * @param {Record<number, Record<string, string>>} [input.fixes]
 * @param {number[]} [input.skipped]
 * @returns {ImportPreview}
 */
export function validateImport({ csv, mapping, users, batches, fixes = {}, skipped = [] }) {
  const { headers, rows } = parseCsv(csv)
  const skippedSet = new Set(skipped.map(Number))
  /** @param {string} field */
  const columnIndex = (field) => {
    const header = mapping?.[field]
    if (!header) return -1
    return headers.findIndex((candidate) => candidate.toLowerCase() === String(header).toLowerCase())
  }
  const index = Object.fromEntries(
    ['rollNumber', 'name', 'email', 'phone', 'role', 'batch', 'joinedAt'].map((field) => [field, columnIndex(field)]),
  )

  const batchByKey = new Map()
  for (const batch of batches) {
    batchByKey.set(batch.name.toLowerCase(), batch)
    batchByKey.set(batch.id.toLowerCase(), batch)
  }

  const existingRolls = new Set(users.map((user) => (user.rollNumber ?? '').toLowerCase()).filter(Boolean))
  const existingEmails = new Set(users.map((user) => user.email.toLowerCase()))
  const seenRolls = new Map()
  const seenEmails = new Map()

  /** @type {ImportRow[]} */
  const validated = rows.map(({ line, cells }) => {
    /** @param {string} field */
    const raw = (field) => {
      const fixed = fixes?.[line]?.[field]
      if (fixed !== undefined) return fixed
      const at = index[field]
      return at >= 0 ? cells[at] ?? '' : ''
    }

    const values = {
      rollNumber: raw('rollNumber').trim().toUpperCase(),
      name: raw('name').trim().replace(/\s+/g, ' '),
      email: raw('email').trim().toLowerCase(),
      phone: normalisePhone(raw('phone')),
      role: (raw('role').trim().toLowerCase() || 'student'),
      batch: raw('batch').trim(),
      joinedAt: raw('joinedAt').trim(),
    }

    if (skippedSet.has(line)) {
      return { line, cells, values, errors: [], status: 'skipped' }
    }

    /** @type {Array<{ field: string, message: string }>} */
    const errors = []

    if (!values.rollNumber) errors.push({ field: 'rollNumber', message: 'A roll number is required.' })
    else if (!ROLL_RE.test(values.rollNumber)) errors.push({ field: 'rollNumber', message: 'Use the board format VY-YY-NNNN, for example VY-26-4101.' })
    else if (existingRolls.has(values.rollNumber.toLowerCase())) errors.push({ field: 'rollNumber', message: `${values.rollNumber} is already on the platform.` })
    else if (seenRolls.has(values.rollNumber)) errors.push({ field: 'rollNumber', message: `Also used on row ${seenRolls.get(values.rollNumber)} of this file.` })

    if (!values.name) errors.push({ field: 'name', message: 'A full name is required.' })
    else if (values.name.length < 3) errors.push({ field: 'name', message: 'The name is too short to print on a register.' })

    if (!values.email) errors.push({ field: 'email', message: 'An email is required; it is the sign-in address.' })
    else if (!EMAIL_RE.test(values.email)) errors.push({ field: 'email', message: 'That email is incomplete. It needs a domain, for example name@vidyutacademy.in.' })
    else if (existingEmails.has(values.email)) errors.push({ field: 'email', message: `${values.email} already has an account.` })
    else if (seenEmails.has(values.email)) errors.push({ field: 'email', message: `Also used on row ${seenEmails.get(values.email)} of this file.` })

    if (values.phone && values.phone.length !== 10) errors.push({ field: 'phone', message: 'A phone number needs ten digits, or leave the cell empty.' })

    if (!['student', 'faculty'].includes(values.role)) {
      errors.push({ field: 'role', message: 'Role must be student or faculty. Office seats are created by the trust, not by import.' })
    }

    if (values.batch) {
      const batch = batchByKey.get(values.batch.toLowerCase())
      if (!batch) errors.push({ field: 'batch', message: `No batch is called “${values.batch}”. Match a name from the batch list.` })
      else values.batch = batch.name
    } else if (values.role !== 'faculty') {
      errors.push({ field: 'batch', message: 'A student needs a batch.' })
    }

    if (values.joinedAt) {
      const date = normaliseDate(values.joinedAt)
      if (!date) errors.push({ field: 'joinedAt', message: 'That date does not exist. Use YYYY-MM-DD.' })
      else values.joinedAt = date
    }

    // Record only clean rows for the duplicate check: a row already in error
    // should not make the next row fail for a value nobody will commit.
    if (errors.length === 0) {
      seenRolls.set(values.rollNumber, line)
      seenEmails.set(values.email, line)
    }

    return { line, cells, values, errors, status: errors.length === 0 ? 'ready' : 'invalid' }
  })

  const ready = validated.filter((row) => row.status === 'ready').length
  const invalid = validated.filter((row) => row.status === 'invalid').length
  const skippedCount = validated.filter((row) => row.status === 'skipped').length

  return {
    headers,
    rows: validated,
    summary: { total: validated.length, ready, invalid, skipped: skippedCount, fixable: invalid },
  }
}

/**
 * A policy change is a claim about a population. This counts that population
 * and writes the sentence the confirmation shows.
 *
 * @param {Object} input
 * @param {PolicyDefinition} input.policy
 * @param {string|number} input.value
 * @param {AdminBatch[]} input.batches
 * @param {AdminUser[]} input.users
 * @param {number} input.examCount
 * @returns {PolicyImpact}
 */
export function policyImpact({ policy, value, batches, users, examCount }) {
  const active = batches.filter((batch) => batch.status === 'active')
  const activeStudents = active.reduce((sum, batch) => sum + batch.studentCount, 0)
  const studentCount = users.filter((user) => user.role === 'student').length

  const counts = {
    batches: active.length,
    students: policy.scope === 'students' ? studentCount : activeStudents,
    exams: examCount,
  }

  const summary =
    policy.scope === 'exams'
      ? `This affects ${counts.exams} papers and ${counts.batches} batches.`
      : policy.scope === 'students'
        ? `This affects ${counts.students} students and ${counts.batches} batches.`
        : `This affects ${counts.batches} batches and ${counts.students} students.`

  const nextLabel = formatPolicyValue(policy, value)

  /** @type {Record<string, string[]>} */
  const consequences = {
    'attendance-threshold': [
      `Defaulter lists are recomputed against ${nextLabel} from the next weekly run.`,
      `Warning letters already sent keep their wording; only the line changes.`,
    ],
    'grace-period': [
      `Absences inside the new window (${nextLabel}) stop counting towards a defaulter flag.`,
      'The register shows the grace period, so a student can see why a session did not count.',
    ],
    'proctoring-level': [
      `Papers that are not yet approved will run with ${nextLabel.toLowerCase()}.`,
      'Sittings already conducted keep the signals they recorded; nothing is retroactively collected.',
    ],
    'attention-check': [
      `Live classes will ask for confirmation ${nextLabel.toLowerCase()}.`,
      'The attendance report’s attention average uses the new cadence on the next session.',
    ],
    'data-retention': [
      `Answers, recordings and result sheets are kept for ${nextLabel} after the term ends.`,
      'Deletion runs on the first Sunday of the month; anything older is removed then.',
    ],
    'consent-version': [
      `${nextLabel} becomes the text every candidate and guardian accepts.`,
      'Accounts that accepted an earlier version are re-prompted at their next sign-in.',
    ],
  }

  return {
    policyId: policy.id,
    from: policy.value,
    to: value,
    batches: counts.batches,
    students: counts.students,
    exams: counts.exams,
    summary,
    consequences: consequences[policy.id] ?? ['This changes what the office enforces from now on.'],
    changed: String(policy.value) !== String(value),
  }
}

/**
 * @param {PolicyDefinition} policy
 * @param {string|number} value
 */
export function formatPolicyValue(policy, value) {
  if (policy.kind === 'enum') {
    const option = policy.options?.find((candidate) => String(candidate.value) === String(value))
    return option?.label ?? String(value)
  }
  return `${value}${policy.unit ? ` ${policy.unit}` : ''}`.replace(' %', '%')
}

/**
 * Serialise report rows. Units are included in the cell text so a spreadsheet
 * opened by an accountant does not lose the % sign.
 * @param {ReportColumn[]} columns
 * @param {Record<string, string|number>[]} rows
 */
export function csvFromColumns(columns, rows) {
  /** @param {unknown} value */
  const cell = (value) => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return [columns.map((column) => cell(column.label)).join(','), ...rows.map((row) => columns.map((column) => cell(row[column.key])).join(','))].join('\n')
}

/**
 * @param {string} kind
 * @param {string} from
 * @param {string} to
 * @param {string} format
 */
export function reportFileName(kind, from, to, format) {
  return `vyuh-${kind}-${from}-to-${to}.${format === 'csv' ? 'csv' : format}`
}

/**
 * Page through rows without losing the page count convention used elsewhere.
 * @param {number} total @param {number} pageSize
 */
export function pageCount(total, pageSize) {
  return Math.max(1, Math.ceil(total / pageSize))
}

/**
 * A short, stable id for a mock record. Timestamp plus a counter keeps the audit
 * ledger ordered without a random source.
 * @param {string} prefix
 * @param {number} counter
 */
export function mockId(prefix, counter) {
  return `${prefix}-${Date.now().toString(36)}-${String(counter).padStart(2, '0')}`
}
