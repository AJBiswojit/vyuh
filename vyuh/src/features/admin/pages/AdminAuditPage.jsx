import { useDeferredValue, useState } from 'react'
import { ChevronLeft, ChevronRight, Lock, Search, X } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, EmptyState, ErrorState, Input, Select, Skeleton } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime, formatNumber } from '@/shared/lib/format.js'
import { useAuditLog } from '../hooks/useAdminOps.js'

const PAGE_SIZE = 25
const ACTION_TONES = {
  'policy.update': 'review',
  'approval.approve': 'answer',
  'approval.reject': 'danger',
  'approval.schedule': 'review',
  'integrity.clear': 'answer',
  'integrity.warn': 'review',
  'integrity.invalidate': 'danger',
  'moderation.remove': 'danger',
  'moderation.dismiss': 'neutral',
  'moderation.warn': 'review',
  'import.commit': 'answer',
  'report.export': 'info',
  'batch.faculty': 'info',
  'settings.branding': 'info',
  'user.invite': 'info',
}

/**
 * The ledger. Read-only by construction: there is no action on this screen, no
 * row to delete and no field to edit. It answers who did what, to what, when and
 * why — the why being the note the actor was required to write.
 */
export function AdminAuditPage() {
  useDocumentTitle('Audit logs')
  const [actorId, setActorId] = useState('all')
  const [action, setAction] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [page, setPage] = useState(1)

  const query = { actorId, action, from, to, search: deferredSearch, page, pageSize: PAGE_SIZE }
  const audit = useAuditLog(query)
  const data = audit.data
  const dirty = actorId !== 'all' || action !== 'all' || from !== '' || to !== '' || search !== ''

  /** @param {string} setter @param {string} value */
  const change = (setter, value) => {
    setter(value)
    setPage(1)
  }
  const reset = () => {
    setActorId('all'); setAction('all'); setFrom(''); setTo(''); setSearch(''); setPage(1)
  }

  return (
    <>
      <PageHeader
        eyebrow="Academic office · Record"
        title="Audit logs"
        description="Every decision the office has taken, newest first. Entries are append-only: this screen cannot edit or delete one, and that is the point."
        meta={
          data ? (
            <>
              <span className="font-mono text-2xs tabular-nums text-muted">{formatNumber(data.total)} entries match</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="flex items-center gap-1 font-mono text-2xs text-muted">
                <Lock className="size-3" strokeWidth={2} aria-hidden="true" />
                Read-only
              </span>
            </>
          ) : null
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-sm border border-line bg-surface-raised p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] xl:items-end">
        <Input
          label="Search the ledger"
          type="search"
          placeholder="Target, summary or actor"
          icon={<Search strokeWidth={1.5} />}
          value={search}
          onChange={(event) => change(setSearch, event.target.value)}
        />
        <Select
          label="Actor"
          value={actorId}
          onChange={(event) => change(setActorId, event.target.value)}
          options={[
            { value: 'all', label: 'Any actor' },
            ...(data?.facets.actors ?? []).map((facet) => ({ value: facet.value, label: `${facet.label} · ${facet.count}` })),
          ]}
        />
        <Select
          label="Action"
          value={action}
          onChange={(event) => change(setAction, event.target.value)}
          options={[
            { value: 'all', label: 'Any action' },
            ...(data?.facets.actions ?? []).map((facet) => ({ value: facet.value, label: `${facet.label} · ${facet.count}` })),
          ]}
        />
        <Input label="From" type="date" value={from} max={to || undefined} onChange={(event) => change(setFrom, event.target.value)} />
        <Input label="To" type="date" value={to} min={from || undefined} onChange={(event) => change(setTo, event.target.value)} />
        <Button variant="ghost" icon={<X strokeWidth={1.5} />} onClick={reset} disabled={!dirty}>
          Clear
        </Button>
      </div>

      {audit.isPending ? (
        <div role="status" aria-busy="true" className="space-y-2">
          <span className="sr-only">Loading the ledger</span>
          {[0, 1, 2, 3, 4, 5].map((key) => <Skeleton.Block key={key} className="h-14" />)}
        </div>
      ) : audit.isError ? (
        <ErrorState
          code="E_AUDIT"
          title="The ledger could not load"
          description={/** @type {Error} */ (audit.error)?.message ?? 'Try again.'}
          action={<Button variant="secondary" onClick={() => audit.refetch()} loading={audit.isFetching}>Try again</Button>}
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          size="panel"
          icon={<Lock strokeWidth={1.5} />}
          title="No entry matches those filters"
          description="Widen the date range or clear the actor and action filters. Every action taken in the console appears here immediately."
          code={`0 of ${data?.total ?? 0}`}
          action={dirty ? <Button variant="secondary" onClick={reset}>Clear filters</Button> : null}
        />
      ) : (
        <div className="overflow-x-auto rounded-sm border border-line">
          <table className="w-full border-collapse text-left text-xs">
            <caption className="sr-only">Audit entries, newest first, page {data.page} of {data.pageCount}</caption>
            <thead>
              <tr className="border-b border-line bg-ink text-paper">
                <th scope="col" className="rule-label px-4 py-2.5 font-normal text-(--color-on-ink-label)">When</th>
                <th scope="col" className="rule-label px-4 py-2.5 font-normal text-(--color-on-ink-label)">Actor</th>
                <th scope="col" className="rule-label px-4 py-2.5 font-normal text-(--color-on-ink-label)">Action</th>
                <th scope="col" className="rule-label px-4 py-2.5 font-normal text-(--color-on-ink-label)">Target</th>
                <th scope="col" className="rule-label px-4 py-2.5 font-normal text-(--color-on-ink-label)">What happened</th>
                <th scope="col" className="rule-label px-4 py-2.5 font-normal text-(--color-on-ink-label)">Ref</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((entry) => (
                <tr key={entry.id} data-testid="audit-row" className="border-b border-line align-top last:border-0 hover:bg-surface-sunken/60">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-2xs tabular-nums text-muted">{formatDateTime(entry.at)}</td>
                  <td className="px-4 py-3">
                    <span className="block font-[560] text-heading">{entry.actorName}</span>
                    <span className="mt-0.5 block text-2xs text-muted">{entry.actorRole === 'admin' ? 'Academic office' : entry.actorRole}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={/** @type {any} */ (ACTION_TONES[entry.action] ?? 'neutral')}
                      variant="soft"
                      shape="square"
                      className="whitespace-nowrap"
                      data-testid={`audit-action-${entry.action}`}
                    >
                      {entry.actionLabel ?? entry.action}
                    </Badge>
                  </td>
                  <td className="max-w-[16rem] px-4 py-3 text-2xs leading-relaxed text-heading">{entry.target}</td>
                  <td className="max-w-[26rem] px-4 py-3">
                    <span className="block text-2xs leading-relaxed text-body">{entry.summary}</span>
                    {entry.note ? <span className="mt-1 block text-2xs leading-relaxed text-muted">{entry.note}</span> : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-2xs text-faint">{entry.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-2xs tabular-nums text-muted" role="status">
            {formatNumber(data.total)} entr{data.total === 1 ? 'y' : 'ies'} · page {data.page} of {data.pageCount}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<ChevronLeft strokeWidth={1.5} />} onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={data.page <= 1 || audit.isFetching}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" trailingIcon={<ChevronRight strokeWidth={1.5} />} onClick={() => setPage((value) => Math.min(data.pageCount, value + 1))} disabled={data.page >= data.pageCount || audit.isFetching}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
