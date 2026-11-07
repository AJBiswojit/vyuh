import { useEffect, useState } from 'react'
import { History, Info, Lock, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, Dialog, ErrorState, Input, Select, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime, formatNumber, formatRelative } from '@/shared/lib/format.js'
import { formatPolicyValue } from '@/shared/lib/adminMath.js'
import { usePolicies, usePolicyHistory, usePolicyImpact, useUpdatePolicy } from '../hooks/useAdmin.js'

/**
 * Six settings the office owns. Changing one is not a form save: it moves the
 * line every register and every result sheet is read against, so the dialog
 * states the population before it offers the button.
 */
export function AdminPoliciesPage() {
  useDocumentTitle('Policies')
  const policies = usePolicies()
  const history = usePolicyHistory()
  const update = useUpdatePolicy()
  const toast = useToast()

  const [active, setActive] = useState(/** @type {import('@/contracts/admin.js').PolicyDefinition | null} */ (null))
  const [draftValue, setDraftValue] = useState(/** @type {string|number} */ ('75'))
  const [note, setNote] = useState('')

  const numeric = active?.kind === 'number' ? Number(draftValue) : null
  const inRange =
    !active ? false :
    active.kind === 'number'
      ? Number.isFinite(numeric) && (active.min === undefined || Number(numeric) >= active.min) && (active.max === undefined || Number(numeric) <= active.max)
      : active.options?.some((option) => option.value === draftValue) ?? false

  const impact = usePolicyImpact(active?.id ?? '', draftValue, Boolean(active) && inRange)

  useEffect(() => {
    if (!active) return
    setDraftValue(active.value)
    setNote('')
  }, [active])

  const open = (policy) => {
    setActive(policy)
    setDraftValue(policy.value)
  }

  const close = () => {
    setActive(null)
    setDraftValue('')
  }

  const apply = () => {
    if (!active) return
    update.mutate(
      { key: active.id, value: active.kind === 'number' ? Number(draftValue) : draftValue, note },
      {
        onSuccess: (policy) => {
          toast.success('Policy applied', `${policy.label} is now ${policy.valueLabel}.`)
          close()
        },
        onError: (/** @type {Error} */ error) => toast.error('Not applied', error.message),
      },
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Academic office · Policy"
        title="Policies"
        description="The rules every register, paper and consent screen is read against. Each change states how many batches and students it touches before it is applied, and is written to the audit ledger."
        meta={
          policies.data ? (
            <>
              <span className="font-mono text-2xs tabular-nums text-muted">{policies.data.length} settings</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="font-mono text-2xs tabular-nums text-muted">Last changed {formatRelative(policies.data[0]?.updatedAt)}</span>
            </>
          ) : null
        }
        actions={
          <Badge tone="idle" variant="soft" shape="hollow" className="min-h-[var(--spacing-touch)] px-3">
            <Lock className="size-3.5" strokeWidth={2} aria-hidden="true" />
            Trust-controlled
          </Badge>
        }
      />

      {policies.isPending ? (
        <div role="status" aria-busy="true" className="space-y-3">
          <span className="sr-only">Loading policies</span>
          {[0, 1, 2, 3].map((key) => <Skeleton.Block key={key} className="h-24 rounded-sm" />)}
        </div>
      ) : policies.isError ? (
        <ErrorState
          code="E_POLICIES"
          title="Policies could not load"
          description={/** @type {Error} */ (policies.error)?.message ?? 'Try again.'}
          action={<Button variant="secondary" onClick={() => policies.refetch()} loading={policies.isFetching}>Try again</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="flex flex-col divide-y divide-line rounded-sm border border-line bg-surface-raised" data-testid="policy-list">
            {(policies.data ?? []).map((policy) => (
              <section key={policy.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xs font-[560] tracking-tight text-heading">{policy.label}</h2>
                    <Badge tone="neutral" variant="outline" shape="square" mono>{policy.scopeLabel}</Badge>
                  </div>
                  <p className="mt-1 max-w-2xl text-2xs leading-relaxed text-muted">{policy.description}</p>
                  <p className="mt-2 font-mono text-2xs text-faint">
                    Set by {policy.updatedBy} · {formatDateTime(policy.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                  <p className="font-display text-lg leading-none tracking-tight text-heading" data-testid={`policy-value-${policy.id}`}>
                    {policy.valueLabel}
                  </p>
                  <Button variant="secondary" size="sm" icon={<SlidersHorizontal strokeWidth={1.5} />} onClick={() => open(policy)}>
                    Change
                  </Button>
                </div>
              </section>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            <Card eyebrow="Why these are explicit" title="A setting is a promise" action={<ShieldCheck className="size-4 text-faint" strokeWidth={1.5} aria-hidden="true" />}>
              <p className="text-2xs leading-relaxed text-body">
                The attendance threshold is printed on every register; the consent version is what a guardian accepts;
                retention decides how long evidence exists. None of them are preferences, so none of them save silently.
              </p>
            </Card>

            <Card eyebrow="Recent changes" title="Policy history" action={<History className="size-4 text-faint" strokeWidth={1.5} aria-hidden="true" />}>
              {history.isPending ? (
                <Skeleton.Block className="h-24" />
              ) : (
                <ul className="flex flex-col divide-y divide-line" data-testid="policy-history">
                  {(history.data ?? []).slice(0, 6).map((change) => {
                    const policy = (policies.data ?? []).find((candidate) => candidate.id === change.policyId)
                    const label = policy?.label ?? change.policyId
                    return (
                      <li key={change.id} className="py-3 first:pt-0 last:pb-0">
                        <p className="text-2xs leading-relaxed text-heading">
                          {label}: {String(change.from)} → {String(policy ? formatPolicyValue(policy, change.to) : change.to)}
                        </p>
                        <p className="mt-0.5 font-mono text-2xs text-faint">{change.actorName} · {formatDateTime(change.at)}</p>
                        {change.note ? <p className="mt-1 text-2xs leading-relaxed text-muted">{change.note}</p> : null}
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(active)}
        onClose={close}
        title={active ? `Change ${active.label.toLowerCase()}?` : 'Change policy'}
        description="Nothing changes until you apply it. The impact below is counted from the live roster."
      >
        {active ? (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault()
              if (!inRange || !impact.data) return
              apply()
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
              <div>
                <p className="rule-label mb-2">Current</p>
                <p className="font-display text-lg leading-none tracking-tight text-heading">{formatPolicyValue(active, active.value)}</p>
              </div>
              <div>
                {active.kind === 'number' ? (
                  <Input
                    label="New value"
                    type="number"
                    min={active.min}
                    max={active.max}
                    step={active.step ?? 1}
                    value={String(draftValue)}
                    onChange={(event) => setDraftValue(event.target.value)}
                    hint={active.min !== undefined && active.max !== undefined ? `Allowed range ${active.min}–${active.max}${active.unit ? ` ${active.unit}` : ''}.` : undefined}
                    error={!inRange ? `Enter a value between ${active.min} and ${active.max}.` : undefined}
                  />
                ) : (
                  <Select
                    label="New value"
                    value={String(draftValue)}
                    onChange={(event) => setDraftValue(event.target.value)}
                    options={active.options ?? []}
                  />
                )}
              </div>
            </div>

            <div className="rounded-sm border border-line bg-surface-sunken px-4 py-3" data-testid="policy-impact" aria-live="polite">
              {!inRange ? (
                <p className="text-2xs text-muted">Enter a valid value to see who it affects.</p>
              ) : impact.isPending ? (
                <p className="text-2xs text-muted">Counting the batches and students this touches…</p>
              ) : impact.isError ? (
                <p className="text-2xs text-danger-fg">The impact could not be counted. Try another value.</p>
              ) : impact.data ? (
                <>
                  <p className="flex items-center gap-2 text-xs font-[560] tracking-tight text-heading">
                    <Info className="size-4 shrink-0 text-info-fg" strokeWidth={1.75} aria-hidden="true" />
                    {impact.data.summary}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1 pl-6">
                    {impact.data.consequences.map((line) => (
                      <li key={line} className="list-disc text-2xs leading-relaxed text-muted">{line}</li>
                    ))}
                  </ul>
                  <p className="mt-2 pl-6 font-mono text-2xs text-faint">
                    {formatNumber(impact.data.batches)} batches · {formatNumber(impact.data.students)} students · {formatNumber(impact.data.exams)} papers in the window
                  </p>
                </>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="policy-note" className="text-xs font-[560] tracking-tight text-heading">Reason (optional)</label>
              <textarea
                id="policy-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Why the setting is moving, for the audit ledger."
                className="w-full resize-y rounded-sm border border-line-strong bg-surface-raised px-3 py-2 text-xs leading-relaxed text-heading placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={close} disabled={update.isPending}>Cancel</Button>
              <Button type="submit" variant="primary" loading={update.isPending} disabled={!inRange || !impact.data || !impact.data.changed}>
                Apply policy
              </Button>
            </div>
            {impact.data && !impact.data.changed ? (
              <p className="text-2xs text-muted">The value is unchanged, so there is nothing to apply.</p>
            ) : null}
          </form>
        ) : null}
      </Dialog>
    </>
  )
}
