import { useCallback, useDeferredValue, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, Upload, UserPlus, X } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, EmptyState, ErrorState, Input, Select, Skeleton } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { cn } from '@/shared/lib/cn.js'
import { formatDate, formatRelative, formatNumber } from '@/shared/lib/format.js'
import { useAdminBatches, useAdminUsers } from '../hooks/useAdmin.js'
import { useTransientCredentialLifecycle } from '../hooks/useAdminOps.js'
import { PeopleTabs } from '../components/PeopleTabs.jsx'
import { CreateUserDialog } from '../components/CreateUserDialog.jsx'
import { CredentialsSheet } from '../components/CredentialsSheet.jsx'
import { InstituteIdConfigPanel } from '../components/InstituteIdConfigPanel.jsx'
import { AccountRowActions } from '../components/AccountRowActions.jsx'

const PAGE_SIZE = 25

const STATUS_TONES = {
  active: { tone: 'answer', shape: 'square' },
  invited: { tone: 'idle', shape: 'hollow' },
  suspended: { tone: 'review', shape: 'ring' },
  locked: { tone: 'danger', shape: 'ring' },
  archived: { tone: 'danger', shape: 'square' },
}
const STATUS_LABELS = {
  active: 'Active', invited: 'Invited', suspended: 'Suspended', locked: 'Locked', archived: 'Archived',
}

/** Five honest lifecycle states. `locked` and `archived` are never called "Suspended". */
function StatusBadge({ status, mustChangePassword, credentialDelivery }) {
  const style = STATUS_TONES[status] ?? { tone: 'neutral', shape: 'square' }
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Badge tone={/** @type {any} */ (style.tone)} variant="soft" shape={/** @type {any} */ (style.shape)} data-testid={`account-status-${status}`}>
        {STATUS_LABELS[status] ?? status}
      </Badge>
      {mustChangePassword ? <Badge tone="idle" variant="soft" shape="hollow">Setup pending</Badge> : null}
      {/* The value is never stored or retrievable; this is metadata only. */}
      {credentialDelivery === 'shown' ? <Badge tone="idle" variant="soft" shape="hollow">•••••••• Shown once</Badge> : null}
    </span>
  )
}

/**
 * BATCH 3 — canonical `/admin/users`: exactly two People tabs (Students and
 * Faculty), a single filled ember primary action (Create account), creation,
 * one-time credentials, lifecycle operations, and Admin-only Institute ID
 * settings. The existing search / batch / status / role filters and pagination
 * are preserved; the tabs are shortcuts that set the role filter.
 */
export function AdminUsersPage() {
  useDocumentTitle('User management')
  const [search, setSearch] = useState('')
  /* WS2: navigating away from People drops every transient credential result. */
  useTransientCredentialLifecycle()
  const deferredSearch = useDeferredValue(search)
  const [tab, setTab] = useState(/** @type {'student'|'faculty'} */ ('student'))
  const [role, setRole] = useState('all')
  const [batchId, setBatchId] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [credentials, setCredentials] = useState(/** @type {import('@/contracts/admin.js').CredentialSheetRow[]} */ ([]))
  /* BATCH 3.1 (WS11 / R-7): while ANY dialog or sheet is open, its confirm
     action is the primary one. The page's background actions are disabled and
     visually de-emphasised so two filled ember primaries are never co-visible. */
  const [rowDialogOpen, setRowDialogOpen] = useState(false)
  const overlayOpen = createOpen || credentials.length > 0 || rowDialogOpen
  const onRowDialogStateChange = useCallback((next) => setRowDialogOpen(next), [])

  const query = { search: deferredSearch, role, batchId, status, page, pageSize: PAGE_SIZE }
  const users = useAdminUsers(query)
  const batches = useAdminBatches()
  const data = users.data

  const dirty = search !== '' || role !== 'all' || batchId !== 'all' || status !== 'all'
  const reset = () => {
    setSearch(''); setRole('all'); setBatchId('all'); setStatus('all'); setPage(1)
  }
  /** @param {string} setter @param {string} value */
  const change = (setter, value) => {
    setter(value)
    setPage(1)
  }

  const onTab = (next) => {
    setTab(next)
    change(setRole, next)
  }
  const onRole = (value) => {
    setTab(value === 'faculty' ? 'faculty' : 'student')
    change(setRole, value)
  }

  const roleOptions = [
    { value: 'all', label: `All roles${data ? ` · ${formatNumber(data.counts.students + data.counts.faculty + data.counts.admins)}` : ''}` },
    ...(data?.facets.roles ?? []).map((facet) => ({ value: facet.value, label: `${facet.label} · ${formatNumber(facet.count)}` })),
  ]
  const batchOptions = [
    { value: 'all', label: 'All batches' },
    ...(data?.facets.batches ?? []).map((facet) => ({ value: facet.value, label: `${facet.label} · ${formatNumber(facet.count)}` })),
  ]
  const statusOptions = [
    { value: 'all', label: 'Any status' },
    ...(data?.facets.statuses ?? []).map((facet) => ({ value: facet.value, label: `${facet.label} · ${formatNumber(facet.count)}` })),
  ]

  return (
    <>
      <PageHeader
        eyebrow="Academic office · People"
        title="User management"
        description="Every institute-issued student and faculty account in one canonical ledger, alongside the read-only demo roster. Create an account, import a CSV, or manage an account's lifecycle. Credentials are shown once and cannot be retrieved later."
        meta={
          data ? (
            <>
              <span className="font-mono text-2xs tabular-nums text-muted">{formatNumber(data.total)} accounts match</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="font-mono text-2xs tabular-nums text-muted">{formatNumber(data.counts.students)} students</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="font-mono text-2xs tabular-nums text-muted">{formatNumber(data.counts.faculty)} faculty</span>
            </>
          ) : null
        }
        actions={
          <>
            <Button variant="primary" icon={<UserPlus strokeWidth={1.5} />} onClick={() => setCreateOpen(true)} disabled={overlayOpen}>
              Create account
            </Button>
            <Link
              to="/admin/users/import"
              aria-disabled={overlayOpen || undefined}
              tabIndex={overlayOpen ? -1 : undefined}
              onClick={overlayOpen ? (event) => event.preventDefault() : undefined}
              className={cn(
                'inline-flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border border-line-strong px-4 text-xs font-[560] tracking-tight text-heading transition-colors hover:border-heading',
                overlayOpen && 'pointer-events-none opacity-50',
              )}
            >
              <Upload className="size-4" strokeWidth={1.75} aria-hidden="true" />
              Import a CSV
            </Link>
          </>
        }
      />

      <InstituteIdConfigPanel />

      <PeopleTabs
        value={tab}
        onValueChange={onTab}
        studentCount={data?.counts.students}
        facultyCount={data?.counts.faculty}
      />

      <div className="my-4 grid grid-cols-1 gap-3 rounded-sm border border-line bg-surface-raised p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_auto] xl:items-end">
        <Input
          label="Search accounts"
          type="search"
          placeholder="Name, roll number or email"
          icon={<Search strokeWidth={1.5} />}
          value={search}
          onChange={(event) => change(setSearch, event.target.value)}
        />
        <Select label="Role" value={role} options={roleOptions} onChange={(event) => onRole(event.target.value)} />
        <Select label="Batch" value={batchId} options={batchOptions} onChange={(event) => change(setBatchId, event.target.value)} />
        <Select label="Status" value={status} options={statusOptions} onChange={(event) => change(setStatus, event.target.value)} />
        <Button variant="ghost" icon={<X strokeWidth={1.5} />} onClick={reset} disabled={!dirty} className="justify-self-start">
          Clear filters
        </Button>
      </div>

      {users.isPending ? (
        <div role="status" aria-busy="true" className="space-y-2">
          <span className="sr-only">Loading accounts</span>
          {[0, 1, 2, 3, 4, 5].map((key) => <Skeleton.Block key={key} className="h-12" />)}
        </div>
      ) : users.isError ? (
        <ErrorState
          code="E_USERS"
          title="Accounts could not load"
          description={/** @type {Error} */ (users.error)?.message ?? 'Try again.'}
          action={<Button variant="secondary" onClick={() => users.refetch()} loading={users.isFetching}>Try again</Button>}
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          size="panel"
          title="No account matches those filters"
          description="Clear one filter at a time. To add a person, create an account here or import them from the office sheet."
          code={`0 of ${data?.total ?? 0}`}
          action={dirty ? <Button variant="secondary" onClick={reset}>Clear filters</Button> : null}
        />
      ) : (
        <div className="overflow-x-auto rounded-sm border border-line">
          <table className="w-full border-collapse text-left text-xs">
            <caption className="sr-only">
              Accounts matching the current filters, page {data.page} of {data.pageCount}
            </caption>
            <thead>
              <tr className="border-b border-line bg-surface-sunken">
                <th scope="col" className="rule-label px-4 py-3 font-normal">Account</th>
                <th scope="col" className="rule-label px-4 py-3 font-normal">Role</th>
                <th scope="col" className="rule-label px-4 py-3 font-normal">Batch</th>
                <th scope="col" className="rule-label px-4 py-3 font-normal">Status</th>
                <th scope="col" className="rule-label px-4 py-3 font-normal">Joined</th>
                <th scope="col" className="rule-label px-4 py-3 font-normal">Last active</th>
                <th scope="col" className="rule-label px-4 py-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((user) => (
                <tr key={user.id} data-testid="user-row" className="border-b border-line align-top last:border-0 hover:bg-surface-sunken/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line font-mono text-2xs text-heading" aria-hidden="true">
                        {user.initials}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-[560] text-heading">{user.name}</span>
                        <span className="block truncate text-2xs text-muted">
                          {user.rollNumber ? <span className="font-mono">{user.rollNumber} · </span> : null}
                          {user.email}
                        </span>
                        {user.instituteId ? <span className="mt-0.5 block font-mono text-2xs text-faint">{user.instituteId}</span> : null}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-body">{user.role === 'admin' ? 'Academic office' : user.role === 'faculty' ? 'Faculty' : 'Student'}</td>
                  <td className="max-w-[16rem] px-4 py-3">
                    <span className="block truncate text-2xs text-muted">{user.batchName ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} mustChangePassword={user.mustChangePassword} credentialDelivery={user.credentialDelivery} /></td>
                  <td className="px-4 py-3 font-mono text-2xs tabular-nums text-muted">{formatDate(user.joinedAt)}</td>
                  <td className="px-4 py-3 text-2xs text-muted">
                    {user.lastActiveAt ? formatRelative(user.lastActiveAt) : user.status === 'invited' ? 'Never signed in' : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <AccountRowActions row={user} batches={batches.data ?? []} onCredentials={setCredentials} onDialogStateChange={onRowDialogStateChange} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-2xs tabular-nums text-muted" role="status" data-testid="users-count">
            {formatNumber(data.total)} account{data.total === 1 ? '' : 's'} · page {data.page} of {data.pageCount}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronLeft strokeWidth={1.5} />}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={data.page <= 1 || users.isFetching}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              trailingIcon={<ChevronRight strokeWidth={1.5} />}
              onClick={() => setPage((value) => Math.min(data.pageCount, value + 1))}
              disabled={data.page >= data.pageCount || users.isFetching}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultRole={tab}
        onCreated={setCredentials}
      />
      <CredentialsSheet rows={credentials} onClose={() => { setCredentials([]); setRowDialogOpen(false) }} />
    </>
  )
}
