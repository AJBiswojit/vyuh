import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, ShieldAlert } from 'lucide-react'
import { Badge, Button, Checkbox, Dialog, Input, Select, useToast } from '@/shared/ui'
import {
  useAccountOperation,
  useEditAccount,
  useMoveStudentBatch,
  useReissueTemporaryPassword,
  useTransientCredentialLifecycle,
} from '../hooks/useAdminOps.js'

/** Labels are factual; no lifecycle state is mislabelled as "Suspended". */
const STATE_LABELS = {
  active: 'Active', invited: 'Invited', suspended: 'Suspended', locked: 'Locked', archived: 'Archived',
}

/**
 * BATCH 3 (WS6) — lifecycle operations on a single canonical account.
 *
 * Demo fixtures and pre-Batch-3 legacy rows are read-only here: the registry
 * never owned them. Every sensitive operation requires a service-validated
 * reason; archive additionally needs an explicit irreversible acknowledgement.
 * Recovery (`reissue`) delegates to the additive auth helper and returns the
 * new credential once, in memory, to the one-time sheet.
 *
 * @param {Object} props
 * @param {import('@/contracts/admin.js').AdminUser} props.row
 * @param {import('@/contracts/admin.js').AdminBatch[]} props.batches
 * @param {(rows: import('@/contracts/admin.js').CredentialSheetRow[]) => void} props.onCredentials
 * @param {(open: boolean) => void} [props.onDialogStateChange]  WS11 overlay signal
 */
export function AccountRowActions({ row, batches, onCredentials, onDialogStateChange }) {
  const toast = useToast()
  const operation = useAccountOperation()
  const edit = useEditAccount()
  const move = useMoveStudentBatch()
  const reissue = useReissueTemporaryPassword()
  const clearCredentials = useTransientCredentialLifecycle()
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState(/** @type {string | null} */ (null))
  const [reason, setReason] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', rollNumber: '', batchId: '' })

  /* BATCH 3.1 (WS2 / R-1): all four mutations may hold a transient credential
     (reissue) while a navigation unmounts the row. Drop every result. */
  const mutationsRef = useRef({ operation, edit, move, reissue })
  mutationsRef.current = { operation, edit, move, reissue }
  useEffect(() => () => {
    const current = mutationsRef.current
    current.operation.reset(); current.edit.reset(); current.move.reset(); current.reissue.reset()
  }, [])
  /* WS11: tell the page that a confirmation dialog owns the primary action. */
  useEffect(() => {
    onDialogStateChange?.(open)
    return () => onDialogStateChange?.(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const issued = row.source === 'institute_issued' && Boolean(row.instituteId)
  if (!issued) {
    return <span className="text-2xs text-faint">Demo fixture · read only</span>
  }

  const accountKey = String(row.instituteId)
  const archived = row.status === 'archived'
  const activeBatches = batches.filter((batch) => batch.status === 'active')

  /** @type {{ id: string, label: string, description: string, danger?: boolean }[]} */
  const operations = [
    ...(archived ? [] : [{ id: 'edit', label: 'Edit profile', description: 'Name, email, phone and optional roll number. Institute ID, source and role stay fixed.' }]),
    ...(!archived && row.role === 'student' ? [{ id: 'move', label: 'Move to another batch', description: 'A dedicated move that preserves all existing history.' }] : []),
    ...(row.status === 'active' ? [{ id: 'suspend', label: 'Suspend account', description: 'Blocks sign-in and session restore. Reversible.' }] : []),
    ...(row.status === 'suspended' ? [{ id: 'reactivate', label: 'Reactivate account', description: 'Returns a suspended account to Active.' }] : []),
    ...(row.status === 'active' ? [{ id: 'lock', label: 'Lock account', description: 'Marks the account Locked. Failed-attempt lockout is preserved.' }] : []),
    ...(['active', 'suspended', 'locked'].includes(row.status) ? [{ id: 'unlock', label: 'Unlock account', description: 'Clears a failed-attempt lockout; also returns a Locked account to Active. Recovery alone never does this.' }] : []),
    ...(!archived ? [{ id: 'reissue', label: 'Issue a new temporary password', description: 'For a lost credential. Shown once; does not clear lockout. First-login change is required again.' }] : []),
    ...(!archived ? [{ id: 'archive', label: 'Archive account', description: 'Terminal. Blocks sign-in permanently and the Institute ID is never reused.', danger: true }] : []),
  ]

  const close = () => {
    setOpen(false)
    setAction(null)
    setReason('')
    setAcknowledged(false)
    setError('')
    operation.reset(); edit.reset(); move.reset(); reissue.reset()
    clearCredentials()
  }

  const begin = (id) => {
    setAction(id)
    setReason('')
    setAcknowledged(false)
    setError('')
    setForm({
      name: row.name,
      email: row.email,
      phone: row.phone ?? '',
      rollNumber: row.rollNumber ?? '',
      batchId: '',
    })
  }

  const busy = operation.isPending || edit.isPending || move.isPending || reissue.isPending
  const reasonReady = reason.trim().length >= 4
  const batchReady = action !== 'move' || Boolean(form.batchId)
  const archiveReady = action !== 'archive' || acknowledged
  const canConfirm = reasonReady && batchReady && archiveReady && !busy

  const confirm = (event) => {
    event.preventDefault()
    if (!action || !canConfirm) return
    const payload = { accountKey, reason: reason.trim() }
    const onError = (/** @type {Error} */ failure) => {
      setError(failure.message)
      toast.error('Not saved', failure.message)
    }
    const onDone = (message) => {
      toast.success('Account updated', message)
      close()
    }

    if (action === 'edit') {
      edit.mutate({ ...payload, name: form.name, email: form.email, phone: form.phone, rollNumber: form.rollNumber || null }, {
        onSuccess: () => onDone('Profile saved. Institute ID and role are unchanged.'), onError,
      })
      return
    }
    if (action === 'move') {
      move.mutate({ ...payload, batchId: form.batchId }, {
        onSuccess: () => onDone('Batch changed. Existing history is preserved.'), onError,
      })
      return
    }
    if (action === 'reissue') {
      reissue.mutate(payload, {
        onSuccess: (result) => {
          toast.success('New credential issued', 'It is shown once in the credentials sheet. Lockout was not cleared.')
          onCredentials(result.credentials)
          close()
        },
        onError,
      })
      return
    }
    operation.mutate(
      { operation: /** @type {import('@/contracts/admin.js').AccountOperation} */ (action), input: { ...payload, acknowledged: action === 'archive' ? acknowledged : undefined } },
      { onSuccess: (result) => onDone(`${row.name} is now ${STATE_LABELS[result.account.status] ?? result.account.status}.`), onError },
    )
  }

  const actionTitle = operations.find((item) => item.id === action)?.label ?? 'Manage account'

  return (
    <>
      <Button variant="ghost" size="sm" icon={<MoreHorizontal strokeWidth={1.5} />} onClick={() => setOpen(true)}>
        Manage
      </Button>

      <Dialog
        open={open}
        onClose={close}
        title={action ? actionTitle : `Manage ${row.name}`}
        description={action ? `${row.name} · ${row.instituteId}` : `Institute-issued account · ${row.instituteId}`}
      >
        {!action ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral" variant="soft" shape="square">{STATE_LABELS[row.status] ?? row.status}</Badge>
              <span className="font-mono text-2xs text-muted">{row.role === 'faculty' ? 'Faculty' : 'Student'}</span>
              <span className="font-mono text-2xs text-faint">{row.batchName ?? 'No batch'}</span>
            </div>
            {operations.length === 0 ? (
              <p className="text-2xs leading-relaxed text-muted">This account is archived. Archive is terminal; its Institute ID is never reused and no further lifecycle changes are available.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {operations.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => begin(item.id)}
                      className="flex w-full flex-col items-start gap-1 py-3 text-left hover:bg-surface-sunken/60"
                    >
                      <span className={item.danger ? 'text-xs font-[560] text-danger-fg' : 'text-xs font-[560] text-heading'}>{item.label}</span>
                      <span className="text-2xs leading-relaxed text-muted">{item.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end border-t border-line pt-4">
              <Button variant="ghost" onClick={close}>Close</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={confirm} className="flex flex-col gap-4" data-testid="account-action-form">
            {action === 'edit' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Full name" value={form.name} onChange={(event) => setForm((v) => ({ ...v, name: event.target.value }))} />
                <Input label="Email" type="email" value={form.email} onChange={(event) => setForm((v) => ({ ...v, email: event.target.value }))} />
                <Input label="Phone" value={form.phone} onChange={(event) => setForm((v) => ({ ...v, phone: event.target.value }))} />
                <Input label="Roll number (optional)" value={form.rollNumber} onChange={(event) => setForm((v) => ({ ...v, rollNumber: event.target.value }))} />
              </div>
            ) : null}
            {action === 'move' ? (
              <Select
                label="Destination batch"
                value={form.batchId}
                options={[{ value: '', label: 'Choose a batch' }, ...activeBatches.map((batch) => ({ value: batch.id, label: batch.name }))]}
                onChange={(event) => setForm((v) => ({ ...v, batchId: event.target.value }))}
                hint="Past attendance, attempts and history stay with the account."
              />
            ) : null}
            {action === 'archive' ? (
              <div className="rounded-sm border border-danger/40 bg-danger/5 p-3">
                <p className="flex gap-2 text-2xs leading-relaxed text-danger-fg">
                  <ShieldAlert className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  Archiving is irreversible: sign-in and session restore are blocked permanently, the account is never
                  deleted, and the Institute ID is never reused.
                </p>
                <Checkbox
                  className="mt-3"
                  label="I understand this action is irreversible"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                />
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <label htmlFor={`reason-${accountKey}`} className="text-xs font-[560] tracking-tight text-heading">Reason for the record</label>
              <textarea
                id={`reason-${accountKey}`}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                placeholder="What happened, and why this is the right decision."
                className="w-full resize-y rounded-sm border border-line-strong bg-surface-raised px-3 py-2 text-xs leading-relaxed text-heading placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
              />
              <p className="text-2xs leading-relaxed text-muted">Mandatory. Kept in the audit ledger with your session-derived actor identity. Never include a password.</p>
            </div>

            {error ? <p role="alert" className="text-2xs text-danger-fg">{error}</p> : null}

            <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => { setAction(null); setError('') }} disabled={busy}>Back</Button>
              <Button type="submit" variant={action === 'archive' ? 'danger' : 'primary'} loading={busy} disabled={!canConfirm}>
                Confirm
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  )
}
