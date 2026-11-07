import { useState } from 'react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Button, Card, Checkbox, ErrorState, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDate } from '@/shared/lib/format.js'
import { useStudentId, useStudentProfile, useUpdatePreferences } from '../hooks/useStudentWorkspace.js'

const NOTIFICATION_OPTIONS = /** @type {Array<[keyof import('@/contracts/student.js').NotificationPreferences, string]>} */ ([
  ['examReminders', 'Exam reminders'], ['liveClassReminders', 'Live class reminders'], ['resultPublished', 'Result published'], ['attendanceAlerts', 'Attendance alerts'], ['productUpdates', 'Product updates'],
])
const CONSENT_OPTIONS = /** @type {Array<[keyof import('@/contracts/student.js').DataConsentPreferences, string, string]>} */ ([
  ['attendanceTracking', 'Attendance tracking', 'Records presence in your scheduled classes so faculty can follow up on missed sessions.'],
  ['performanceAnalytics', 'Performance analytics', 'Uses attempt scores to build subject strength and trends. No leaderboard.'],
  ['guardianSummary', 'Guardian summary', 'Shares a weekly attendance and progress summary with the guardian email on file.'],
])

/** Profile details, batch, institute, notification and data-consent preferences. */
export function ProfilePage() {
  useDocumentTitle('Profile')
  const studentId = useStudentId()
  const { data, isPending, isError, error, refetch } = useStudentProfile(studentId)
  const update = useUpdatePreferences(studentId)
  const toast = useToast()
  const [draft, setDraft] = useState(/** @type {import('@/contracts/student.js').StudentPreferences | null} */ (null))
  const prefs = draft ?? data?.preferences ?? null

  /** @param {keyof import('@/contracts/student.js').NotificationPreferences} key */
  const toggleNotification = (key) => { const base = draft ?? data?.preferences; if (base) setDraft({ ...base, notifications: { ...base.notifications, [key]: !base.notifications[key] } }) }
  /** @param {keyof import('@/contracts/student.js').DataConsentPreferences} key */
  const toggleConsent = (key) => { const base = draft ?? data?.preferences; if (base) setDraft({ ...base, dataConsent: { ...base.dataConsent, [key]: !base.dataConsent[key] } }) }

  return (
    <>
      <PageHeader eyebrow="Student workspace" title="Profile" description="Your details, batch and institute, plus the notifications and data choices you control." />
      {isPending ? <Skeleton.Block className="h-80" /> : isError || !data ? (
        <ErrorState code="E_PROFILE" title="Profile could not load" description={/** @type {any} */ (error)?.message ?? 'Try again.'} action={<Button variant="secondary" onClick={() => refetch()}>Try again</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-5">
            <Card eyebrow="Details" title={data.user.name}>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[['Email', data.user.email], ['Roll number', data.student.rollNumber], ['Track', data.student.track], ['Joined', formatDate(data.user.joinedAt)], ['Phone', data.user.phone ?? 'Not added'], ['Guardian email', data.user.guardianEmail ?? 'Not added']].map(([term, value]) => (
                  <div key={term}><dt className="rule-label">{term}</dt><dd className="mt-1 break-words text-xs text-heading">{value}</dd></div>
                ))}
              </dl>
            </Card>
            <Card eyebrow="Batch" title={data.batch.name}>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[['Lead faculty', data.batch.facultyLead], ['Schedule', data.batch.scheduleLabel], ['Cohort', data.batch.cohort], ['Students', String(data.batch.studentCount)]].map(([term, value]) => (
                  <div key={term}><dt className="rule-label">{term}</dt><dd className="mt-1 text-xs text-heading">{value}</dd></div>
                ))}
              </dl>
            </Card>
            <Card eyebrow="Institute" title={data.institute.name}>
              <p className="text-xs text-muted">{data.institute.city}, {data.institute.state} · {data.institute.term}</p>
              <p className="mt-2 text-xs text-body">{data.institute.contact.email} · {data.institute.contact.phone}</p>
            </Card>
          </div>
          <form className="flex flex-col gap-5" onSubmit={(event) => { event.preventDefault(); if (!prefs) return; update.mutate(prefs, { onSuccess: () => { setDraft(null); toast.show({ title: 'Preferences saved', description: 'Your notification and data choices are updated.', tone: 'success' }) } }) }}>
            <Card eyebrow="Notifications" title="What reaches you">
              <div className="flex flex-col gap-3">
                {prefs ? NOTIFICATION_OPTIONS.map(([key, label]) => (
                  <Checkbox key={key} label={label} checked={prefs.notifications[key]} onChange={() => toggleNotification(key)} />
                )) : null}
              </div>
            </Card>
            <Card eyebrow="Data consent" title="What is tracked and why">
              <div className="flex flex-col gap-3">
                {prefs ? CONSENT_OPTIONS.map(([key, label, description]) => (
                  <Checkbox key={key} label={label} description={description} checked={prefs.dataConsent[key]} onChange={() => toggleConsent(key)} />
                )) : null}
              </div>
            </Card>
            <Button type="submit" variant="primary" loading={update.isPending} disabled={!prefs}>Save preferences</Button>
          </form>
        </div>
      )}
    </>
  )
}
