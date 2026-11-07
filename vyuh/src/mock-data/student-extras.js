/** Notifications and preference defaults. Learning fixtures live in their own Phase 6 modules. */
export const notifications = [
  { id: 'n1', title: 'Result published', body: 'JEE Main Mock 08 result is out — 236/300, AIR 184.', createdAt: '2026-10-21T06:30:00.000Z', read: false, kind: /** @type {const} */ ('result') },
  { id: 'n2', title: 'Class starting soon', body: 'Organic Reaction Mechanisms starts at 10:30 with Rituparna Das.', createdAt: '2026-10-22T04:45:00.000Z', read: false, kind: /** @type {const} */ ('class') },
  { id: 'n3', title: 'Registration closes Friday', body: 'NTA Abhyas 04 registration closes 24 Oct, 23:59 IST.', createdAt: '2026-10-21T11:00:00.000Z', read: false, kind: /** @type {const} */ ('exam') },
  { id: 'n4', title: 'Term calendar updated', body: 'Deepavali break: 8–12 Nov. Classes resume 13 Nov.', createdAt: '2026-10-20T09:20:00.000Z', read: true, kind: /** @type {const} */ ('institute') },
]

export const defaultPreferences = {
  notifications: { examReminders: true, liveClassReminders: true, resultPublished: true, attendanceAlerts: true, productUpdates: false },
  dataConsent: { attendanceTracking: true, performanceAnalytics: true, guardianSummary: false },
}
