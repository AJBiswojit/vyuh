import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Check, Search, UserMinus, Users } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, EmptyState, ErrorState, Input, Select, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDate, formatNumber, formatRelative } from '@/shared/lib/format.js'
import { useAdminBatch, useSaveBatchFaculty } from '../hooks/useAdmin.js'
import { ConfirmAction } from '../components/ConfirmAction.jsx'

const COHORT_LABELS = { class11: 'Class 11', class12: 'Class 12', dropper: 'Dropper' }
const PAGE_SIZE = 25

/**
 * One batch. Three blocks: who is in it, what it studies, and who teaches it.
 * The faculty allocation is the only editable thing here, and it is saved
 * explicitly — selecting a name changes nothing until Save, and a removal is
 * confirmed because it takes a subject away from a room.
 */
export function AdminBatchDetailPage() {
  const { batchId = '' } = useParams()
  const detail = useAdminBatch(batchId)
  const save = useSaveBatchFaculty()
  const toast = useToast()

  useDocumentTitle(detail.data?.batch.name ?? 'Batch')

  const [facultyIds, setFacultyIds] = useState(/** @type {string[]} */ ([]))
  const [initial, setInitial] = useState(/** @type {string[]} */ ([]))
  const [addId, setAddId] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const deferredMemberSearch = useDeferredValue(memberSearch)
  const [page, setPage] = useState(1)

  // Seed the picker once per batch. A refetch after a save must not overwrite a
  // selection the reader is still editing.
  const seededFor = useRef('')
  useEffect(() => {
    if (!detail.data) return
    if (seededFor.current === detail.data.batch.id) return
    seededFor.current = detail.data.batch.id
    const ids = detail.data.faculty.map((faculty) => faculty.id)
    setFacultyIds(ids)
    setInitial(ids)
  }, [detail.data])

  const members = useMemo(() => {
    const term = deferredMemberSearch.trim().toLowerCase()
    const list = detail.data?.members ?? []
    return term
      ? list.filter((member) => [member.name, member.rollNumber, member.email].some((value) => value.toLowerCase().includes(term)))
      : list
  }, [detail.data, deferredMemberSearch])

  useEffect(() => {
    setPage(1)
  }, [deferredMemberSearch])

  if (detail.isPending) {
    return (
      <div role="status" aria-busy="true" className="space-y-4">
        <span className="sr-only">Loading the batch</span>
        <Skeleton.Line className="w-44" />
        <Skeleton.Block className="h-10 w-[min(30rem,80%)]" />
        <Skeleton.Block className="h-28" />
        <Skeleton.Block className="h-64" />
      </div>
    )
  }

  if (detail.isError) {
    return (
      <ErrorState
        code="E_BATCH"
        title="This batch could not load"
        description={/** @type {Error} */ (detail.error)?.message ?? 'Go back and pick another batch.'}
        action={<Link to="/admin/batches" className="inline-flex min-h-[var(--spacing-touch)] items-center rounded-sm border border-line-strong px-4 text-xs text-heading">All batches</Link>}
      />
    )
  }

  const data = /** @type {import('@/contracts/admin.js').BatchDetail} */ (detail.data)
  const batch = data.batch
  const dirty = facultyIds.length !== initial.length || facultyIds.some((id) => !initial.includes(id))
  const available = data.availableFaculty.filter((faculty) => !facultyIds.includes(faculty.id))
  const pageCount = Math.max(1, Math.ceil(members.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = members.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const chosen = [...detail.data.faculty, ...detail.data.availableFaculty]
    .filter((faculty, index, list) => list.findIndex((candidate) => candidate.id === faculty.id) === index)
    .filter((faculty) => facultyIds.includes(faculty.id))
  const addOptions = [{ value: '', label: 'Choose a faculty member' }, ...available.map((faculty) => ({
    value: faculty.id,
    label: `${faculty.name} · ${faculty.designation}`,
  }))]

  const saveFaculty = () => {
    save.mutate(
      { batchId: batch.id, facultyIds },
      {
        onSuccess: (updated) => {
          setInitial(facultyIds)
          toast.success('Faculty saved', `${updated.name} now carries ${facultyIds.length} faculty member${facultyIds.length === 1 ? '' : 's'}.`)
        },
        onError: (/** @type {Error} */ error) => toast.error('Not saved', error.message),
      },
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={`Academic office · ${batch.track} · ${COHORT_LABELS[batch.cohort] ?? batch.cohort}`}
        title={batch.name}
        description={`${batch.scheduleLabel} · ${batch.room}. ${batch.status === 'archived' ? 'Archived — the roster stays readable for transcripts and records requests.' : 'Active this term.'}`}
        meta={
          <>
            <span className="font-mono text-2xs tabular-nums text-muted">{formatNumber(batch.studentCount)} students</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <span className="font-mono text-2xs tabular-nums text-muted">{batch.attendancePercent.toFixed(1)}% attendance</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <span className="font-mono text-2xs tabular-nums text-muted">{batch.examCount} papers this term</span>
          </>
        }
        actions={
          <Link
            to="/admin/batches"
            className="inline-flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border border-line-strong px-4 text-xs font-[560] text-heading hover:border-heading"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            All batches
          </Link>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-4">
        {[
          { label: 'Roster', value: formatNumber(batch.studentCount), detail: `${batch.capacity - batch.studentCount} seats free of ${batch.capacity}` },
          { label: 'Sessions held', value: formatNumber(data.summary.sessionsHeld), detail: `Since ${formatDate(batch.startDate)}` },
          { label: 'Average attendance', value: `${batch.attendancePercent.toFixed(1)}%`, detail: 'Weighted across the roster' },
          { label: 'Below the 75% line', value: formatNumber(data.summary.defaulters), detail: 'Uses the current policy threshold' },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface-raised px-5 py-4">
            <p className="rule-label">{stat.label}</p>
            <p className="mt-2 font-display text-xl leading-none tracking-tight text-heading tabular-nums">{stat.value}</p>
            <p className="mt-1.5 text-2xs leading-relaxed text-muted">{stat.detail}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card eyebrow="Curriculum" title="Subjects" action={<BookOpen className="size-4 text-faint" strokeWidth={1.5} aria-hidden="true" />}>
          <ul className="flex flex-col divide-y divide-line" data-testid="batch-subjects">
            {data.subjects.map((subject) => (
              <li key={subject.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-xs font-[560] tracking-tight text-heading">{subject.name}</p>
                  <p className="mt-0.5 font-mono text-2xs text-muted">{subject.shortName} · {subject.chapterCount} chapters</p>
                </div>
                <p className="max-w-[12rem] text-right text-2xs leading-relaxed text-muted">
                  {subject.facultyIds.length > 0
                    ? chosen.filter((faculty) => subject.facultyIds.includes(faculty.id)).map((faculty) => faculty.name).join(', ')
                    : 'No faculty assigned yet'}
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          eyebrow="Allocation"
          title="Faculty"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-2xs text-muted">
                {dirty ? 'Unsaved changes. The batch keeps its previous allocation until you save.' : 'Saved. The faculty seat sees this batch immediately.'}
              </p>
              <Button variant="primary" icon={<Check strokeWidth={1.75} />} onClick={saveFaculty} loading={save.isPending} disabled={!dirty || facultyIds.length === 0}>
                Save assignment
              </Button>
            </div>
          }
        >
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <Select
              label="Add a faculty member"
              value={addId}
              onChange={(event) => {
                const id = event.target.value
                setAddId('')
                if (id && !facultyIds.includes(id)) setFacultyIds((current) => [...current, id])
              }}
              options={addOptions}
              hint={available.length === 0 ? 'Everyone on the roster already teaches this batch.' : 'Assignment takes effect when you save.'}
              disabled={available.length === 0}
            />
            <p className="font-mono text-2xs tabular-nums text-muted sm:pb-2">{facultyIds.length} assigned</p>
          </div>

          {chosen.length === 0 ? (
            <EmptyState
              title="No faculty assigned"
              description="A batch needs at least one faculty member before it can be saved. Add someone from the roster above."
              code="0 assigned"
            />
          ) : (
            <ul className="flex flex-col divide-y divide-line" data-testid="batch-faculty">
              {chosen.map((faculty) => (
                <li key={faculty.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line font-mono text-2xs text-heading" aria-hidden="true">
                      {faculty.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-[560] tracking-tight text-heading">{faculty.name}</p>
                      <p className="mt-0.5 text-2xs text-muted">{faculty.designation}</p>
                      <p className="mt-0.5 truncate font-mono text-2xs text-faint">{faculty.email}</p>
                    </div>
                  </div>
                  <ConfirmAction
                    title={`Remove ${faculty.name} from the batch?`}
                    description="They stop seeing this batch's roster and papers. Nothing they authored is deleted, and they can be added back at any time."
                    detail={`${batch.name} · takes effect when you save the assignment`}
                    confirmLabel="Remove from batch"
                    cancelLabel="Keep assigned"
                    onConfirm={() => setFacultyIds((current) => current.filter((id) => id !== faculty.id))}
                  >
                    {(open) => (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<UserMinus strokeWidth={1.5} />}
                        onClick={open}
                        disabled={facultyIds.length === 1}
                      >
                        Remove
                      </Button>
                    )}
                  </ConfirmAction>
                </li>
              ))}
            </ul>
          )}

        </Card>
      </div>

      <Card
        eyebrow="Roster"
        title={`${formatNumber(members.length)} member${members.length === 1 ? '' : 's'}`}
        action={
          <div className="w-64">
            <Input
              label="Search members"
              type="search"
              placeholder="Name, roll number or email"
              icon={<Search strokeWidth={1.5} />}
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
            />
          </div>
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-2xs tabular-nums text-muted" role="status" data-testid="member-count">
              {members.length} member{members.length === 1 ? '' : 's'} · page {currentPage} of {pageCount}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage >= pageCount}>
                Next
              </Button>
            </div>
          </div>
        }
      >
        {members.length === 0 ? (
          <EmptyState
            icon={<Users strokeWidth={1.5} />}
            title="No member matches that search"
            description="Clear the search to see the whole roster again."
            code="0 members"
            action={<Button variant="secondary" onClick={() => setMemberSearch('')}>Clear search</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <caption className="sr-only">Members of {batch.name}</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="rule-label py-2 pr-3 font-normal">Roll</th>
                  <th scope="col" className="rule-label py-2 pr-3 font-normal">Name</th>
                  <th scope="col" className="rule-label py-2 pr-3 font-normal">Email</th>
                  <th scope="col" className="rule-label py-2 pr-3 text-right font-normal">Attendance</th>
                  <th scope="col" className="rule-label py-2 pr-3 font-normal">Status</th>
                  <th scope="col" className="rule-label py-2 font-normal">Last active</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((member) => (
                  <tr key={member.id} data-testid="member-row" className="border-b border-line last:border-0">
                    <td className="py-2 pr-3 font-mono text-2xs tabular-nums text-heading">{member.rollNumber}</td>
                    <td className="py-2 pr-3 text-heading">{member.name}</td>
                    <td className="py-2 pr-3 font-mono text-2xs text-muted">{member.email}</td>
                    <td className="py-2 pr-3 text-right">
                      <span className={member.attendancePercent < 75 ? 'font-mono tabular-nums text-danger-fg' : 'font-mono tabular-nums text-heading'}>
                        {member.attendancePercent}%
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      {member.status === 'active' ? (
                        <Badge tone="answer" variant="soft" shape="square">Active</Badge>
                      ) : member.status === 'invited' ? (
                        <Badge tone="idle" variant="soft" shape="hollow">Invited</Badge>
                      ) : (
                        <Badge tone="danger" variant="soft" shape="ring">Suspended</Badge>
                      )}
                    </td>
                    <td className="py-2 text-2xs text-muted">{member.lastActiveAt ? formatRelative(member.lastActiveAt) : 'Never signed in'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
