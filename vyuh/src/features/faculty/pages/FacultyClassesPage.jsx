import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarClock, Radio } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, Checkbox, ErrorState, Input, Select, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime } from '@/shared/lib/format.js'
import { useBatches } from '@/features/batches/hooks/useBatches.js'
import { useBankQuestions } from '../hooks/useFaculty.js'
import { useCancelClass, useCreateClass, useFacultyClasses } from '../hooks/useFacultyLive.js'
import { ConfirmAction } from '../components/ConfirmAction.jsx'

/**
 * The class scheduler. Upcoming sessions on the left, one compact form on the
 * right: mode, batch, time and the attendance threshold that decides whether a
 * student is a defaulter in the register.
 */
export function FacultyClassesPage() {
  useDocumentTitle('Classes')
  const toast = useToast()
  const classes = useFacultyClasses()
  const batches = useBatches({ pageSize: 20 })
  const facets = useBankQuestions({ pageSize: 1 })
  const create = useCreateClass()
  const cancel = useCancelClass()

  const [form, setForm] = useState(() => ({
    title: '',
    mode: 'interactive',
    batchId: 'bat-neet-12',
    subjectId: 'sub-phy',
    startsAt: nextSlot(),
    durationMinutes: 75,
    attendanceThresholdPercent: 75,
    resourcesAttached: true,
  }))
  const [error, setError] = useState('')

  const sessions = [...(classes.data ?? [])].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
  const upcoming = sessions.filter((session) => session.status === 'scheduled' || session.status === 'live')
  const past = sessions.filter((session) => session.status === 'ended' || session.status === 'cancelled')

  const set = (patch) => setForm((current) => ({ ...current, ...patch }))

  const submit = (event) => {
    event.preventDefault()
    setError('')
    create.mutate(
      {
        ...form,
        startsAt: new Date(form.startsAt).toISOString(),
      },
      {
        onSuccess: (session) => {
          toast.success('Session scheduled', `${session.title} · ${session.batchName}`)
          set({ title: '' })
        },
        onError: (/** @type {Error} */ mutationError) => setError(mutationError.message),
      },
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Faculty workspace · Classes"
        title="Class scheduler"
        description="Live sessions, their attendance threshold and the room that hosts them. Starting a session turns on presence tracking for everyone on the roster."
        meta={
          <>
            <span className="font-mono text-2xs tabular-nums text-muted">{upcoming.length} upcoming</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <span className="font-mono text-2xs tabular-nums text-muted">{past.length} held</span>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="min-w-0 flex flex-col gap-5">
          {classes.isPending ? (
            <div className="space-y-2" role="status" aria-busy="true">
              <span className="sr-only">Loading the timetable</span>
              {[0, 1, 2, 3].map((index) => <Skeleton.Block key={index} className="h-16 rounded-sm" />)}
            </div>
          ) : classes.isError ? (
            <ErrorState
              code="E_CLASSES"
              title="The timetable did not load"
              description={/** @type {Error} */ (classes.error)?.message ?? 'Nothing was changed. Try again.'}
              action={<Button variant="secondary" onClick={() => classes.refetch()} loading={classes.isFetching}>Try again</Button>}
            />
          ) : (
            <>
              <section className="overflow-hidden rounded-sm border border-line bg-surface-raised">
                <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
                  <h2 className="text-xs font-[560] tracking-tight text-heading">Upcoming</h2>
                  <span className="font-mono text-2xs tabular-nums text-faint">{upcoming.length}</span>
                </header>
                {upcoming.length === 0 ? (
                  <p className="px-3 py-6 text-center text-2xs text-muted">No session is scheduled. Use the form on the right; it appears here immediately.</p>
                ) : (
                  <ul className="divide-y divide-line" data-testid="class-list">
                    {upcoming.map((session) => (
                      <li key={session.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="truncate text-xs font-[560] tracking-tight text-heading">{session.title}</span>
                            {session.status === 'live' ? (
                              <Badge tone="info" variant="solid" shape="dot">Live</Badge>
                            ) : (
                              <Badge tone="info" variant="outline" shape="circle">Scheduled</Badge>
                            )}
                            <Badge tone="neutral" variant="outline" shape="none">{session.mode === 'interactive' ? 'Interactive' : 'Broadcast'}</Badge>
                          </span>
                          <span className="mt-0.5 block truncate text-2xs text-muted">
                            {formatDateTime(session.startsAt)} · {session.durationMinutes} min · {session.batchName}
                          </span>
                          <span className="mt-0.5 block font-mono text-2xs tabular-nums text-faint">
                            attendance threshold {session.attendanceThresholdPercent}% · {session.subjectName}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1">
                          <Link
                            to={`/faculty/classes/${session.id}/host`}
                            className="inline-flex min-h-9 items-center gap-1 rounded-sm border border-line px-2.5 text-2xs font-[560] text-heading hover:border-line-strong"
                          >
                            <Radio className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                            {session.status === 'live' ? 'Host' : 'Open room'}
                          </Link>
                          <ConfirmAction
                            title="Cancel this session?"
                            description="Students see it as cancelled and lose the reminder. Nothing already recorded is deleted, and the room stops accepting participants."
                            detail={`${session.title} · ${formatDateTime(session.startsAt)}`}
                            confirmLabel="Cancel session"
                            busy={cancel.isPending}
                            onConfirm={() =>
                              cancel.mutate(session.id, {
                                onSuccess: () => toast.show({ title: 'Session cancelled', description: session.title, tone: 'neutral' }),
                                onError: (/** @type {Error} */ mutationError) => toast.error('Not cancelled', mutationError.message),
                              })
                            }
                          >
                            {(open) => (
                              <Button variant="ghost" size="sm" onClick={open} disabled={cancel.isPending}>
                                Cancel
                              </Button>
                            )}
                          </ConfirmAction>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="overflow-hidden rounded-sm border border-line bg-surface-raised">
                <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
                  <h2 className="text-xs font-[560] tracking-tight text-heading">Held and cancelled</h2>
                  <span className="font-mono text-2xs tabular-nums text-faint">{past.length}</span>
                </header>
                <ul className="divide-y divide-line">
                  {past.map((session) => (
                    <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <span className="min-w-0">
                        <span className="block truncate text-2xs font-[560] text-heading">{session.title}</span>
                        <span className="mt-0.5 block text-2xs text-faint">{formatDateTime(session.startsAt)} · {session.batchName}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge tone={session.status === 'cancelled' ? 'idle' : 'neutral'} variant="outline" shape={session.status === 'cancelled' ? 'hollow' : 'square'}>
                          {session.status === 'cancelled' ? 'Cancelled' : 'Ended'}
                        </Badge>
                        {session.status === 'ended' ? (
                          <Link to={`/faculty/recordings`} className="inline-flex min-h-9 items-center gap-1 text-2xs font-[560] text-heading hover:text-ember-press">
                            Recording
                            <ArrowUpRight className="size-3" strokeWidth={1.75} aria-hidden="true" />
                          </Link>
                        ) : null}
                      </span>
                    </li>
                  ))}
                  {past.length === 0 ? <li className="px-3 py-4 text-2xs text-muted">No session has ended yet.</li> : null}
                </ul>
              </section>
            </>
          )}
        </div>

        <Card eyebrow="Schedule" title="Create a live session" action={<CalendarClock className="size-4 text-faint" strokeWidth={1.5} aria-hidden="true" />}>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <Input
              label="Session title"
              value={form.title}
              onChange={(event) => set({ title: event.target.value })}
              placeholder="Rotational dynamics — torque problems"
              hint="Students see this in their live list."
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Mode"
                value={form.mode}
                onChange={(event) => set({ mode: event.target.value })}
                options={[
                  { value: 'interactive', label: 'Interactive' },
                  { value: 'broadcast', label: 'Broadcast' },
                ]}
                hint={form.mode === 'interactive' ? 'Chat and questions open.' : 'Listen-only room.'}
              />
              <Select
                label="Batch"
                value={form.batchId}
                onChange={(event) => set({ batchId: event.target.value })}
                options={(batches.data?.items ?? []).map((batch) => ({ value: batch.id, label: batch.name }))}
              />
            </div>
            <Select
              label="Subject"
              value={form.subjectId}
              onChange={(event) => set({ subjectId: event.target.value })}
              options={(facets.data?.facets.subjects ?? []).map((subject) => ({ value: subject.value, label: subject.label }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Starts at"
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => set({ startsAt: event.target.value })}
                hint="Future dates only."
              />
              <Input
                label="Minutes"
                type="number"
                min={15}
                max={240}
                step={5}
                value={form.durationMinutes}
                onChange={(event) => set({ durationMinutes: Number(event.target.value) })}
              />
            </div>
            <Input
              label="Attendance threshold (%)"
              type="number"
              min={0}
              max={100}
              step={5}
              value={form.attendanceThresholdPercent}
              onChange={(event) => set({ attendanceThresholdPercent: Number(event.target.value) })}
              hint="Below this a student is marked a defaulter for the term, at the same 10-minute grace the register uses."
            />
            <Checkbox
              label="Attach resources"
              description="Slides and the chapter PDF go out with the reminder."
              checked={form.resourcesAttached}
              onChange={(event) => set({ resourcesAttached: event.target.checked })}
            />
            {error ? <p role="alert" className="text-xs text-danger-fg">{error}</p> : null}
            <Button type="submit" variant="primary" loading={create.isPending} disabled={form.title.trim().length < 4}>
              Schedule session
            </Button>
          </form>
        </Card>
      </div>
    </>
  )
}

/** Default start: tomorrow at 18:00, in the local input format. */
function nextSlot() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(18, 0, 0, 0)
  const pad = (/** @type {number} */ value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
