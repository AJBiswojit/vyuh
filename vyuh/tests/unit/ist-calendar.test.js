import { describe, expect, it } from 'vitest'
import { istDayKey, shiftIstDayKey, groupSessionsByDay } from '../../src/shared/lib/learningMath.js'
import { liveSessions } from '../../src/mock-data/liveSessions.js'

/** Minimal session shape for the pure grouper. @param {string} startsAt @param {string} id */
const at = (id, startsAt) => ({
  id, title: 'Class', subjectId: 'sub-phy', subjectName: 'Physics', facultyName: 'Faculty',
  status: /** @type {const} */ ('scheduled'), startsAt, durationMinutes: 60, attendingCount: 0,
  capacity: 100, joinUrl: '/student/live/' + id, resourcesAttached: true, mode: 'interactive',
  batchId: 'bat-prayas-m', batchName: 'Prayas', mediaUrl: '/media/rotational-dynamics-sample.mp4',
})

describe('IST calendar helpers (D-10)', () => {
  it('anchors day keys to Asia/Kolkata rather than the host timezone', () => {
    // 18:29 UTC is 23:59 IST on the 7th; 18:30 UTC is 00:00 IST on the 8th.
    expect(istDayKey(Date.parse('2026-11-07T18:29:00.000Z'))).toBe('2026-11-07')
    expect(istDayKey(Date.parse('2026-11-07T18:30:00.000Z'))).toBe('2026-11-08')
    expect(istDayKey(Date.parse('2026-11-08T18:30:00.000Z'))).toBe('2026-11-09')
  })

  it('shifts whole calendar days across month, year and leap-day boundaries', () => {
    expect(shiftIstDayKey('2026-11-30', 1)).toBe('2026-12-01')
    expect(shiftIstDayKey('2026-12-01', -1)).toBe('2026-11-30')
    expect(shiftIstDayKey('2026-01-01', -1)).toBe('2025-12-31')
    expect(shiftIstDayKey('2026-12-31', 1)).toBe('2027-01-01')
    expect(shiftIstDayKey('2024-02-28', 1)).toBe('2024-02-29')
    expect(shiftIstDayKey('2024-02-29', 1)).toBe('2024-03-01')
  })

  it('labels Today/Tomorrow/Yesterday correctly when now is exactly IST midnight', () => {
    const now = Date.parse('2026-11-07T18:30:00.000Z') // 2026-11-08 00:00 IST
    const sessions = [
      at('yesterday', '2026-11-07T04:30:00.000Z'), // IST 2026-11-07 10:00
      at('today', '2026-11-08T04:30:00.000Z'),     // IST 2026-11-08 10:00
      at('tomorrow', '2026-11-09T04:30:00.000Z'),  // IST 2026-11-09 10:00
    ]
    const labels = Object.fromEntries(groupSessionsByDay(sessions, now).map((group) => [group.sessions[0].id, group.label]))
    expect(labels).toEqual({ yesterday: 'Yesterday', today: 'Today', tomorrow: 'Tomorrow' })
    expect(groupSessionsByDay(sessions, now).flatMap((group) => group.sessions)).toHaveLength(3)
  })

  it('labels a day immediately before midnight as Today, not Tomorrow', () => {
    const now = Date.parse('2026-11-07T18:29:00.000Z') // 2026-11-07 23:59 IST
    const groups = groupSessionsByDay([at('same-day', '2026-11-07T12:00:00.000Z')], now)
    expect(groups[0].label).toBe('Today')
  })

  it('keeps the seeded schedule on the right IST days (regression for the failing test)', () => {
    const now = new Date(liveSessions[0].startsAt).getTime() + 25 * 60_000
    const groups = groupSessionsByDay(liveSessions, now)
    expect(groups.some((group) => group.label === 'Today')).toBe(true)
    expect(groups.some((group) => group.label === 'Tomorrow')).toBe(true)
    expect(groups.some((group) => group.label === 'Yesterday')).toBe(true)
    const tomorrow = groups.find((group) => group.label === 'Tomorrow')
    expect(tomorrow?.sessions.map((session) => session.id)).toContain('ses-int-c')
    expect(tomorrow?.sessions.map((session) => session.id)).toContain('ses-elec-r')
    expect(groups.find((group) => group.label === 'Yesterday')?.sessions.map((session) => session.id)).toContain('ses-rot-rec')
    expect(groups.flatMap((group) => group.sessions)).toHaveLength(liveSessions.length)
  })

  it('dayAt(1, 9) is an IST wall-clock hour on the next IST calendar day', () => {
    const tomorrow = liveSessions.find((session) => session.id === 'ses-int-c')
    const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false })
    expect(formatter.format(new Date(tomorrow.startsAt))).toBe('09:00')
    expect(istDayKey(Date.parse(tomorrow.startsAt))).toBe(shiftIstDayKey(istDayKey(Date.now()), 1))
  })
})
