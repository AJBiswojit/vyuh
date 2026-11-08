import { useEffect, useRef, useState } from 'react'
import { AlertCircle, UserPlus } from 'lucide-react'
import { Button, Dialog, Input, Radio, Select, useToast } from '@/shared/ui'
import { useAdminBatches } from '../hooks/useAdmin.js'
import { useCreateUser, useInstituteIdConfig, useInstituteIdPreview, useTransientCredentialLifecycle } from '../hooks/useAdminOps.js'

const EMPTY = { name: '', email: '', phone: '', rollNumber: '', batchId: '' }

/**
 * BATCH 3 (WS5) — create ONE student or faculty account.
 *
 * Admin-created Admin accounts are explicitly out of scope. The dialog shows a
 * non-mutating preview of the next Institute ID, blocks student creation while
 * the institute year token is unconfigured, and returns the transient
 * credential rows to the parent for the one-time sheet. Immutable fields
 * (Institute ID, source, role) are never offered for input.
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {'student'|'faculty'} props.defaultRole
 * @param {(rows: import('@/contracts/admin.js').CredentialSheetRow[]) => void} props.onCreated
 */
export function CreateUserDialog({ open, onClose, defaultRole, onCreated }) {
  const toast = useToast()
  const create = useCreateUser()
  const clearCredentials = useTransientCredentialLifecycle()
  const config = useInstituteIdConfig()
  const batches = useAdminBatches()
  const [role, setRole] = useState(defaultRole)
  const [form, setForm] = useState(EMPTY)
  const preview = useInstituteIdPreview(role, open)
  const [error, setError] = useState('')
  /* BATCH 3.1 (WS2 / R-1): a navigation away from this page unmounts the
     dialog even when the credentials sheet is still open. Reset the mutation
     on unmount so no plaintext stays in the TanStack MutationCache. */
  const createRef = useRef(create)
  createRef.current = create
  useEffect(() => () => createRef.current.reset(), [])

  useEffect(() => {
    if (!open) return
    setRole(defaultRole)
    setForm(EMPTY)
    setError('')
    create.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultRole])

  const activeBatches = (batches.data ?? []).filter((batch) => batch.status === 'active')
  const batchOptions = [
    { value: '', label: 'Choose a batch' },
    ...activeBatches.map((batch) => ({ value: batch.id, label: batch.name })),
  ]
  const blocked = role === 'student' && config.data && !config.data.studentCreationAvailable
  const set = (/** @type {string} */ key, /** @type {string} */ value) => setForm((current) => ({ ...current, [key]: value }))
  const ready = form.name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())
    && (role === 'faculty' || Boolean(form.batchId)) && !blocked

  /** Any close (Cancel, Escape, scrim or success) drops mutation data. */
  const close = () => {
    create.reset()
    clearCredentials()
    onClose()
  }

  const submit = (event) => {
    event.preventDefault()
    if (!ready || create.isPending) return
    setError('')
    create.mutate(
      {
        role,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        rollNumber: form.rollNumber.trim() || undefined,
        batchId: role === 'student' ? form.batchId : undefined,
      },
      {
        onSuccess: (result) => {
          toast.success('Account created', `${result.account.name} · ${result.account.instituteId}`)
          /* Hand the rows to the one-time sheet, then drop the mutation's own
             copy. No credential survives in the mutation cache (U-1 / G3). */
          onCreated(result.credentials)
          create.reset()
          clearCredentials()
          onClose()
        },
        onError: (/** @type {Error} */ failure) => {
          setError(failure.message)
          toast.error('Account not created', failure.message)
        },
      },
    )
  }

  return (
    <Dialog open={open} onClose={close} title="Create an account" description="One student or faculty member at a time. Credentials are shown once, immediately after creation.">
      <form onSubmit={submit} className="flex flex-col gap-4" data-testid="create-user-dialog">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-[560] tracking-tight text-heading">Role</legend>
          <Radio name="create-role" value="student" checked={role === 'student'} onChange={() => setRole('student')} label="Student" />
          <Radio name="create-role" value="faculty" checked={role === 'faculty'} onChange={() => setRole('faculty')} label="Faculty" />
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Full name" value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="e.g. Ananya Mohapatra" required />
          <Input label="Email" type="email" value={form.email} onChange={(event) => set('email', event.target.value)} placeholder="name@institute.edu" required />
          <Input label="Phone (optional)" value={form.phone} onChange={(event) => set('phone', event.target.value)} placeholder="Ten digits" />
          <Input label="Roll number (optional)" value={form.rollNumber} onChange={(event) => set('rollNumber', event.target.value)} placeholder="Institute roll number" />
        </div>

        {role === 'student' ? (
          <Select label="Batch" value={form.batchId} options={batchOptions} onChange={(event) => set('batchId', event.target.value)} hint="Active batches only. A dedicated batch move preserves history." />
        ) : null}

        <div className="rounded-sm border border-line bg-surface-sunken p-3">
          <p className="rule-label">Next Institute ID</p>
          <p className="mt-1 font-mono text-xs text-heading" role="status">
            {preview.data?.ok ? preview.data.instituteId : preview.data?.message ?? 'Checking the registry…'}
          </p>
          <p className="mt-1 text-2xs leading-relaxed text-muted">
            Institute ID, role and account source are assigned by the registry and cannot be edited or reused.
          </p>
        </div>

        {blocked ? (
          <p role="alert" className="flex gap-2 text-2xs leading-relaxed text-danger-fg">
            <AlertCircle className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            Student creation is blocked until the institute supplies its two-digit year token in Institute ID settings.
          </p>
        ) : null}
        {error ? <p role="alert" className="text-2xs text-danger-fg">{error}</p> : null}

        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={close} disabled={create.isPending}>Cancel</Button>
          <Button type="submit" variant="primary" icon={<UserPlus strokeWidth={1.5} />} loading={create.isPending} disabled={!ready}>
            Create account
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
