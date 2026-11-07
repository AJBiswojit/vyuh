import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, Upload, X } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, EmptyState, ErrorState, Input, Select, Skeleton } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDate, formatRelative, formatNumber } from '@/shared/lib/format.js'
import { useAdminUsers } from '../hooks/useAdmin.js'

const PAGE_SIZE = 25

/** @param {import('@/contracts/admin.js').AdminUserStatus} status */
function StatusBadge({ status }) {
  if (status === 'active') return <Badge tone="answer" variant="soft" shape="square">Active</Badge>
  if (status === 'invited') return <Badge tone="idle" variant="soft" shape="hollow">Invited</Badge>
  return <Badge tone="danger" variant="soft" shape="ring">Suspended</Badge>
}

/**
 * Who is on the platform. A table, not a gallery: the office exports this list,
 * and every row is one account with one state. The import wizard is the only
 * primary action on the screen because it is the only thing that adds people.
 */
export function AdminUsersPage() {
  useDocumentTitle('User management')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [role, setRole] = useState('all')
  const [batchId, setBatchId] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  const query = { search: deferredSearch, role, batchId, status, page, pageSize: PAGE_SIZE }
  const users = useAdminUsers(query)
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
        description="Every student, faculty member and office account in one ledger. Search by name, roll number or email; narrow by role, batch or account state. Accounts arrive by CSV import or invitation."
        meta={
          data ? (
            <>
              <span className="font-mono text-2xs tabular-nums text-muted">{formatNumber(data.total)} accounts match</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="font-mono text-2xs tabular-nums text-muted">{formatNumber(data.counts.students)} students</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="font-mono text-2xs tabular-nums text-muted">{formatNumber(data.counts.invited)} invitations pending</span>
            </>
          ) : null
        }
        actions={
          <Link
            to="/admin/users/import"
            className="inline-flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border border-ember bg-ember px-4 text-xs font-[560] tracking-tight text-on-ember transition-colors hover:border-ember-press hover:bg-ember-press"
          >
            <Upload className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Import a CSV
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-sm border border-line bg-surface-raised p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_auto] xl:items-end">
        <Input
          label="Search accounts"
          type="search"
          placeholder="Name, roll number or email"
          icon={<Search strokeWidth={1.5} />}
          value={search}
          onChange={(event) => change(setSearch, event.target.value)}
        />
        <Select label="Role" value={role} options={roleOptions} onChange={(event) => change(setRole, event.target.value)} />
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
          description="Clear one filter at a time. If the person should be here, import them from the office sheet or invite them from the faculty roster."
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
              </tr>
            </thead>
            <tbody>
              {data.items.map((user) => (
                <tr key={user.id} data-testid="user-row" className="border-b border-line last:border-0 hover:bg-surface-sunken/60">
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
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-body">{user.role === 'admin' ? 'Academic office' : user.role === 'faculty' ? 'Faculty' : 'Student'}</td>
                  <td className="max-w-[16rem] px-4 py-3">
                    <span className="block truncate text-2xs text-muted">{user.batchName ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-3 font-mono text-2xs tabular-nums text-muted">{formatDate(user.joinedAt)}</td>
                  <td className="px-4 py-3 text-2xs text-muted">
                    {user.lastActiveAt ? formatRelative(user.lastActiveAt) : user.status === 'invited' ? 'Never signed in' : '—'}
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
    </>
  )
}
