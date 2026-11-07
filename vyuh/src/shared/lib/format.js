/**
 * Formatting helpers. Every number a candidate reads passes through here so
 * that grouping, tabular figures and units stay consistent across screens.
 */

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Kolkata',
})

const weekdayFormatter = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  timeZone: 'Asia/Kolkata',
})

/**
 * @param {string} iso
 * @returns {string} '08 Nov 2026'
 */
export function formatDate(iso) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

/**
 * @param {string} iso
 * @returns {string} '08 Nov, 09:00'
 */
export function formatDateTime(iso) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}

/**
 * @param {string} iso
 * @returns {string} 'Sat 08 Nov'
 */
export function formatWeekday(iso) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : weekdayFormatter.format(date)
}

/**
 * Relative phrasing for schedules. Deliberately blunt: "in 18 hours", not
 * "soon". Returns an absolute date once the gap exceeds a week.
 * @param {string} iso
 * @param {Date} [now]
 * @returns {string}
 */
export function formatRelative(iso, now = new Date()) {
  const target = new Date(iso)
  if (Number.isNaN(target.getTime())) return '—'

  const minutes = Math.round((target.getTime() - now.getTime()) / 60_000)
  const past = minutes < 0
  const magnitude = Math.abs(minutes)

  /** @param {number} value @param {string} unit @returns {string} */
  const phrase = (value, unit) => `${past ? '' : 'in '}${value} ${unit}${value === 1 ? '' : 's'}${past ? ' ago' : ''}`

  if (magnitude < 1) return 'now'
  if (magnitude < 60) return phrase(magnitude, 'minute')
  if (magnitude < 60 * 24) return phrase(Math.round(magnitude / 60), 'hour')
  if (magnitude < 60 * 24 * 7) return phrase(Math.round(magnitude / (60 * 24)), 'day')
  return formatDate(iso)
}

/**
 * Countdown clock for exams and sessions. Always mm:ss or h:mm:ss.
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatClock(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

/**
 * @param {number} seconds
 * @returns {string} '2h 53m'
 */
export function formatDuration(seconds) {
  const safe = Math.max(0, Math.round(seconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.round((safe % 3600) / 60)
  if (hours === 0) return `${minutes}m`
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

/**
 * @param {number} value
 * @param {{ digits?: number, suffix?: string }} [options]
 * @returns {string} '1,240' or '94.2%'
 */
export function formatNumber(value, { digits = 0, suffix = '' } = {}) {
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  return `${formatter.format(value)}${suffix}`
}

/**
 * Marks are always shown against their maximum so a bare number is never
 * ambiguous.
 * @param {number} score
 * @param {number} max
 * @returns {string} '214 / 300'
 */
export function formatMarks(score, max) {
  return `${formatNumber(score)} / ${formatNumber(max)}`
}

/**
 * @param {string} name
 * @returns {string} 'Ananya' — first name, for greetings and tight rails.
 */
export function firstName(name) {
  return name.trim().split(/\s+/)[0] ?? name
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
