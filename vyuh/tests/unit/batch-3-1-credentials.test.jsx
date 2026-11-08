/**
 * BATCH 3.1 — focused remediation tests (WS2 / WS3 / WS5 / WS7 / WS8 / WS12).
 *
 * Credential lifecycle, credential-export-specific CSV sanitisation, phone
 * projection, object-URL lifecycle, service-boundary Admin authority, and
 * jsdom clipboard/accessibility checks. jsdom ONLY: no real browser, viewport,
 * console, OS clipboard, download, media, cross-tab or real-browser axe result
 * is claimed here.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { adminService } from '@/services/mock/admin.js'
import { authService } from '@/services/mock/auth.js'
import { escapeCredentialCell, buildCredentialCsv } from '@/features/admin/lib/credentialCsv.js'
import { CredentialsSheet } from '@/features/admin/components/CredentialsSheet.jsx'
import { CreateUserDialog } from '@/features/admin/components/CreateUserDialog.jsx'
import { AccountRowActions } from '@/features/admin/components/AccountRowActions.jsx'
import { ToastProvider } from '@/shared/ui/Toast.jsx'
import {
  CREDENTIAL_CSV_COLUMNS, CREDENTIAL_CSV_FILE_NAME, CREDENTIAL_SECURITY_NOTICE,
} from '@/contracts/admin.js'
import { parseCsv, csvFromColumns } from '@/shared/lib/adminMath.js'
import { queryKeys } from '@/app/providers/queryClient.js'
import {
  TRANSIENT_CREDENTIAL_MUTATION_KEY, clearTransientCredentialMutations,
  useTransientCredentialLifecycle, useCreateUser, useCommitImport, useReissueTemporaryPassword,
} from '@/features/admin/hooks/useAdminOps.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { configureInstituteIds, loadAccountsDb, IMPORT_FIELDS } from '@/mock-data/index.js'
import { renderRoute } from './helpers.jsx'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

const ADMIN_ID = 'adm-pratibha'
const source = (relative) => readFileSync(resolve(process.cwd(), relative), 'utf8')
const FIXTURE_ROW = {
  instituteId: 'VYU-S-99-0001', temporaryPassword: 'FIXTUREPASS123',
  role: 'student', name: 'Test Row', batchName: 'Batch',
}

function newClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

/** @param {React.ReactElement} node @param {QueryClient} [client] */
function mount(node, client = newClient()) {
  const view = render(
    <MotionConfig reducedMotion="user"><QueryClientProvider client={client}><ToastProvider>
      {node}
    </ToastProvider></QueryClientProvider></MotionConfig>,
  )
  return { ...view, client }
}

async function asAdmin() {
  const session = await authService.login({ email: 'academic.office@vidyutacademy.in', password: 'vyuh2026' })
  useSessionStore.getState().setSession(session)
  return session
}

async function createStudent(overrides = {}) {
  return adminService.createUser(ADMIN_ID, {
    role: 'student',
    name: 'Remediation Student',
    email: `rem.${Date.now()}${Math.random().toString(36).slice(2, 7)}@vidyutacademy.in`,
    phone: '9876501234',
    rollNumber: `REM-${Math.floor(1000 + Math.random() * 8999)}`,
    batchId: 'bat-prayas-m',
    ...overrides,
  })
}

beforeAll(() => {
  if (!URL.createObjectURL) Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: () => '' })
  if (!URL.revokeObjectURL) Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: () => {} })
})

beforeEach(async () => {
  localStorage.clear()
  useSessionStore.getState().clear()
  configureInstituteIds({ year: '99' })
  await asAdmin()
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true, writable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

/* ── WS3 — credential-export-specific CSV sanitisation ──────────────────── */

describe('WS3 — CSV escaping / formula neutralisation (R-2)', () => {
  it('preserves the exact U-1 column order and filename', () => {
    expect(CREDENTIAL_CSV_COLUMNS.map((column) => column.key)).toEqual([
      'instituteId', 'temporaryPassword', 'role', 'name', 'batchName',
    ])
    expect(CREDENTIAL_CSV_FILE_NAME).toBe('vyuh-one-time-credentials.csv')
    expect(buildCredentialCsv([FIXTURE_ROW]).split('\n')[0]).toBe('instituteId,temporaryPassword,role,name,batchName')
    expect(source('src/features/admin/components/CredentialsSheet.jsx')).toContain('CREDENTIAL_CSV_FILE_NAME')
  })

  it('neutralises every spreadsheet formula prefix (=, +, -, @, |, whitespace)', () => {
    for (const value of ['=1+1', '+SUM(A1)', '-1+2', '@SUM(1)', '|DDE("cmd")', '  =2+2', '\t=cmd']) {
      const cell = escapeCredentialCell(value)
      expect(cell.startsWith('"\'') || cell.startsWith("'")).toBe(true)
      expect(cell).toContain(value.replace(/"/g, '""'))
      expect(cell).not.toMatch(/^"?[=+\-@|]/)
    }
  })

  it('escapes commas, quotes, LF, CRLF, CR and Unicode without losing the value', () => {
    expect(escapeCredentialCell('Acme, Inc')).toBe('"Acme, Inc"')
    expect(escapeCredentialCell('a"b')).toBe('"a""b"')
    expect(escapeCredentialCell('line1\nline2')).toBe('"line1\nline2"')
    expect(escapeCredentialCell('line1\r\nline2')).toBe('"line1\r\nline2"')
    expect(escapeCredentialCell('line1\rline2')).toBe('"line1\rline2"')
    expect(escapeCredentialCell('Ω 中文, "quoted"')).toBe('"Ω 中文, ""quoted"""')
  })

  it('quoted embedded newlines round-trip to ONE CSV record', () => {
    const csv = buildCredentialCsv([{ ...FIXTURE_ROW, name: 'Line one\nLine two', batchName: 'A, B' }])
    const parsed = parseCsv(csv)
    expect(parsed.headers).toEqual(['instituteId', 'temporaryPassword', 'role', 'name', 'batchName'])
    expect(parsed.rows).toHaveLength(1)
    expect(parsed.rows[0].cells).toHaveLength(5)
    expect(parsed.rows[0].cells[3]).toBe('Line one\nLine two')
    expect(parsed.rows[0].cells[4]).toBe('A, B')
  })

  it('never corrupts a generated password or other app-generated cells', () => {
    const generated = 'FixtureQ7mP2vR9xK4t'
    expect(escapeCredentialCell(generated, true)).toBe(generated)
    expect(escapeCredentialCell('-leading', true)).toBe('-leading')
    expect(escapeCredentialCell('=formula', true)).toBe('=formula')
    const csv = buildCredentialCsv([{ ...FIXTURE_ROW, temporaryPassword: generated }])
    expect(csv.split('\n')[1]).toBe(`VYU-S-99-0001,${generated},student,Test Row,Batch`)
  })

  it('keeps the shared csvFromColumns untouched and the import validation intact', () => {
    /* The shared helper is deliberately NOT modified (clarification ruling 2). */
    expect(csvFromColumns(CREDENTIAL_CSV_COLUMNS, [FIXTURE_ROW]).split('\n')[0]).toBe('instituteId,temporaryPassword,role,name,batchName')
    expect(source('src/features/admin/components/CredentialsSheet.jsx')).not.toContain("import { csvFromColumns }")
    expect(source('src/features/admin/components/CredentialsSheet.jsx')).not.toContain('csvFromColumns(CREDENTIAL_CSV_COLUMNS')
    expect(source('src/features/admin/components/CredentialsSheet.jsx')).toContain('buildCredentialCsv(rows)')
    expect(source('src/features/admin/lib/credentialCsv.js')).toContain('FORMULA_PREFIX')
    expect(source('src/shared/lib/adminMath.js')).toContain('return /[",\\n]/.test(text)')
    expect(IMPORT_FIELDS.map((field) => field.key).join(',')).not.toContain('password')
    expect(source('src/services/mock/admin.js')).toContain('validateImport(')
    expect(CREDENTIAL_CSV_COLUMNS.map((column) => column.label).join(',')).not.toMatch(/template/i)
  })

  it('does not add a credential column to the uploaded import template', () => {
    expect(IMPORT_FIELDS.some((field) => /password|credential/i.test(field.key))).toBe(false)
    expect(IMPORT_FIELDS).toHaveLength(7)
  })
})

/* ── WS2 — credential mutation lifecycle on close / unmount ─────────────── */

describe('WS2 — credential lifecycle (R-1)', () => {
  it('all three credential-producing flows reset their mutations on unmount', () => {
    const files = [
      'src/features/admin/components/CreateUserDialog.jsx',
      'src/features/admin/pages/AdminImportPage.jsx',
      'src/features/admin/components/AccountRowActions.jsx',
    ]
    for (const file of files) {
      const text = source(file)
      expect(text).toMatch(/useEffect\(\(\) => \(\) =>/)
      expect(text).toContain('.reset()')
    }
    expect(source('src/features/admin/components/CreateUserDialog.jsx')).toContain('createRef.current.reset()')
    expect(source('src/features/admin/pages/AdminImportPage.jsx')).toContain('commitRef.current.reset()')
    expect(source('src/features/admin/components/AccountRowActions.jsx')).toContain('current.reissue.reset()')
    expect(source('src/features/admin/hooks/useAdminOps.js')).toContain('clearTransientCredentialMutations')
    expect(source('src/features/admin/hooks/useAdminOps.js')).toContain('cache.remove(mutation)')
  })

  it('create → close → unmount leaves no credential in storage, cache, URL or audit', async () => {
    const client = newClient()
    const rows = /** @type {any[]} */ ([])
    const actor = userEvent.setup()
    const { unmount } = mount(
      <CreateUserDialog open onClose={() => {}} defaultRole="faculty" onCreated={(next) => rows.push(...next)} />,
      client,
    )
    await actor.type(screen.getByLabelText('Full name'), 'Lifecycle Faculty')
    await actor.type(screen.getByLabelText('Email'), `lifecycle.${Date.now()}@vidyutacademy.in`)
    await actor.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() => expect(rows).toHaveLength(1))
    const secret = rows[0].temporaryPassword
    expect(secret).toBeTruthy()
    /* On success the originating mutation is reset immediately (U-1 / G3). */
    const cacheSnapshot = () => JSON.stringify(client.getMutationCache().getAll().map((m) => m.state.data))
    expect(cacheSnapshot()).not.toContain(secret)
    unmount()
    expect(cacheSnapshot()).not.toContain(secret)
    expect(JSON.stringify({ ...localStorage })).not.toContain(secret)
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(secret)
    expect(window.location.href).not.toContain(secret)
    const audit = await adminService.listAudit(ADMIN_ID, { page: 1, pageSize: 20 })
    expect(JSON.stringify(audit.items)).not.toContain(secret)
    expect(JSON.stringify(loadAccountsDb())).not.toContain(secret)
    expect(JSON.stringify(queryKeys)).not.toMatch(/admin.*credentials/i)
  })

  it('there is no admin.credentials query key', () => {
    const text = source('src/app/providers/queryClient.js')
    expect(text).not.toContain("'credentials'")
    expect(text).not.toContain('"credentials"')
    expect(JSON.stringify(queryKeys)).not.toContain('credentials')
  })
})

/* ── WS5 / D-2 — consistent phone projection ───────────────────────────── */

describe('WS5 — account operations return a consistent phone (D-2)', () => {
  it('suspend / reactivate / lock / unlock / archive all keep the canonical phone', async () => {
    const created = await createStudent()
    const key = created.account.instituteId
    const phone = '9876501234'
    expect(created.account.phone).toBe(phone)
    const reason = 'Identity verified; lifecycle regression check.'
    const expected = [phone, phone, phone, phone, phone]
    const seen = []
    for (const [operation, extra] of [
      ['suspend', {}], ['reactivate', {}], ['lock', {}], ['unlock', {}], ['archive', { acknowledged: true }],
    ]) {
      const result = await adminService.applyAccountOperation(ADMIN_ID, operation, { accountKey: key, reason, ...extra })
      seen.push(result.account.phone)
    }
    expect(seen).toEqual(expected)
    expect(loadAccountsDb().accounts[key].phone).toBe(phone)
  })

  it('edit and batch move also keep the phone, and SAFE_ACCOUNT_FIELDS is unchanged', async () => {
    const created = await createStudent()
    const key = created.account.instituteId
    const edited = await adminService.editAccount(ADMIN_ID, { accountKey: key, reason: 'Corrected name.', name: 'Renamed Student' })
    expect(edited.account.phone).toBe('9876501234')
    const moved = await adminService.moveStudentBatch(ADMIN_ID, { accountKey: key, reason: 'Batch correction.', batchId: 'bat-neet-13' })
    expect(moved.account.phone).toBe('9876501234')
    /* accounts.js is a protected file: it must NOT be broadened. */
    const accounts = source('src/mock-data/accounts.js')
    expect(accounts).toMatch(/const SAFE_ACCOUNT_FIELDS = Object\.freeze\(\[/)
    expect(accounts.slice(accounts.indexOf('const SAFE_ACCOUNT_FIELDS'), accounts.indexOf('])', accounts.indexOf('const SAFE_ACCOUNT_FIELDS')))).not.toContain("'phone'")
    expect(source('src/services/mock/admin.js')).toContain('const current = accountByIdentifier(record.key, loadAccountsDb()) ?? record')
  })
})

/* ── WS7 — object-URL lifecycle ────────────────────────────────────────── */

describe('WS7 — download lifecycle (R-3)', () => {
  it('creates one object URL, invokes a named download, and schedules (not blocks) cleanup', async () => {
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:batch31')
    const revokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    let clicked
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { clicked = this })
    mount(<CredentialsSheet rows={[FIXTURE_ROW]} onClose={() => {}} />)
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: /Download CSV/ }))
    expect(createUrl).toHaveBeenCalledTimes(1)
    expect(createUrl.mock.calls[0][0]).toBeInstanceOf(Blob)
    expect(clicked.download).toBe(CREDENTIAL_CSV_FILE_NAME)
    expect(clicked.href).toContain('blob:batch31')
    /* R-3: no synchronous revoke immediately after link.click(). */
    expect(revokeUrl).not.toHaveBeenCalled()
    await waitFor(() => expect(revokeUrl).toHaveBeenCalledWith('blob:batch31'))
    expect(revokeUrl).toHaveBeenCalledTimes(1)
  })

  it('unmount is a backstop: a pending URL is revoked even before the timer fires', () => {
    vi.useFakeTimers()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:unmount')
    const revokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { unmount } = mount(<CredentialsSheet rows={[FIXTURE_ROW]} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /Download CSV/ }))
    expect(revokeUrl).not.toHaveBeenCalled()
    unmount()
    expect(revokeUrl).toHaveBeenCalledWith('blob:unmount')
    /* Only our 0ms cleanup is due in the next tick; no excessive delay. */
    vi.advanceTimersByTime(1)
    expect(revokeUrl).toHaveBeenCalledTimes(1)
  })

  it('preserves the exact columns, filename, explicit download and one-time notice', () => {
    const sheet = source('src/features/admin/components/CredentialsSheet.jsx')
    expect(source('src/features/admin/lib/credentialCsv.js')).toContain('CREDENTIAL_CSV_COLUMNS')
    expect(sheet).toContain('buildCredentialCsv(rows)')
    expect(sheet).toContain('CREDENTIAL_CSV_FILE_NAME')
    expect(sheet).toContain('CREDENTIAL_SECURITY_NOTICE')
    expect(sheet).toContain('I have delivered these credentials')
    expect(CREDENTIAL_SECURITY_NOTICE).toContain('cannot be retrieved later')
  })
})

/* ── WS8 — Admin authority at the service boundary ─────────────────────── */

describe('WS8 — privileged account-management mutations require an Admin session', () => {
  const call = () => adminService.createUser(ADMIN_ID, {
    role: 'faculty', name: 'Boundary Probe', email: `probe.${Date.now()}@vidyutacademy.in`,
  })

  it('accepts a valid Admin session and keeps session-derived attribution', async () => {
    const result = await call()
    expect(result.account.instituteId).toMatch(/^VYU-F-/)
    const audit = await adminService.listAudit(ADMIN_ID, { page: 1, pageSize: 5 })
    expect(audit.items[0].actorId).toBeTruthy()
  })

  it('rejects faculty, student, missing and invalid sessions with forbidden', async () => {
    const faculty = await authService.login({ email: 'snehasish@vidyutacademy.in', password: 'vyuh2026' })
    useSessionStore.getState().setSession(faculty)
    await expect(call()).rejects.toMatchObject({ code: 'forbidden' })

    const student = await authService.login({ email: 'ananya.sahoo@vidyutacademy.in', password: 'vyuh2026' })
    useSessionStore.getState().setSession(student)
    await expect(call()).rejects.toMatchObject({ code: 'forbidden' })

    useSessionStore.getState().clear()
    await expect(call()).rejects.toMatchObject({ code: 'forbidden' })

    localStorage.setItem('vyuh.session', 'not-a-valid-session-envelope')
    await expect(call()).rejects.toMatchObject({ code: 'forbidden' })
    localStorage.removeItem('vyuh.session')
  })

  it('rejects every privileged mutation, not just createUser', async () => {
    useSessionStore.getState().clear()
    const probes = [
      () => adminService.configureInstituteIds(ADMIN_ID, { year: '26' }),
      () => adminService.commitImport(ADMIN_ID, { csv: '', mapping: {} }),
      () => adminService.markCredentialsShown(ADMIN_ID, { accountKeys: [] }),
      () => adminService.applyAccountOperation(ADMIN_ID, 'suspend', { accountKey: 'VYU-S-99-0001', reason: 'x' }),
      () => adminService.editAccount(ADMIN_ID, { accountKey: 'VYU-S-99-0001', reason: 'x', name: 'X' }),
      () => adminService.moveStudentBatch(ADMIN_ID, { accountKey: 'VYU-S-99-0001', reason: 'x', batchId: 'bat-prayas-m' }),
      () => adminService.reissueTemporaryPassword(ADMIN_ID, { accountKey: 'VYU-S-99-0001', reason: 'x' }),
    ]
    for (const probe of probes) await expect(probe()).rejects.toMatchObject({ code: 'forbidden' })
    expect(source('src/services/mock/admin.js')).toContain('function requireAdminActor()')
  })

  it('does not add a role check to reads or unrelated console mutations', () => {
    const text = source('src/services/mock/admin.js')
    expect(text).toContain('function adminActor()')
    expect(text.match(/requireAdminActor\(\)/g)).toHaveLength(9)
  })
})

/* ── WS12 — jsdom clipboard stub and accessibility checks ───────────────── */

describe('WS12 — clipboard stub and jsdom accessibility (no real-browser axe)', () => {
  it('writes nothing on mount and only the explicitly requested ID / password', async () => {
    const writeText = /** @type {ReturnType<typeof vi.fn>} */ (navigator.clipboard.writeText)
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const client = newClient()
    mount(<CredentialsSheet rows={[FIXTURE_ROW]} onClose={() => {}} />, client)
    await screen.findByRole('dialog')
    expect(writeText).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Copy Institute ID for Test Row' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(FIXTURE_ROW.instituteId))
    fireEvent.click(screen.getByRole('button', { name: 'Copy temporary password for Test Row' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(FIXTURE_ROW.temporaryPassword))
    expect(writeText).toHaveBeenCalledTimes(2)
    expect(log.mock.calls.flat().join(' ')).not.toContain(FIXTURE_ROW.temporaryPassword)
    expect(JSON.stringify(client.getMutationCache().getAll().map((m) => m.state.data))).not.toContain(FIXTURE_ROW.temporaryPassword)
    expect(JSON.stringify({ ...localStorage })).not.toContain(FIXTURE_ROW.temporaryPassword)
  })

  it('closing the sheet clears the transient Copied marker', async () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <MotionConfig reducedMotion="user"><QueryClientProvider client={newClient()}><ToastProvider>
        <CredentialsSheet rows={[FIXTURE_ROW]} onClose={onClose} />
      </ToastProvider></QueryClientProvider></MotionConfig>,
    )
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Copy Institute ID for Test Row' }))
    await waitFor(() => expect(screen.getByTestId('copied-marker')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'I have delivered these credentials' }))
    expect(onClose).toHaveBeenCalled()
    rerender(
      <MotionConfig reducedMotion="user"><QueryClientProvider client={newClient()}><ToastProvider>
        <CredentialsSheet rows={[]} onClose={onClose} />
      </ToastProvider></QueryClientProvider></MotionConfig>,
    )
    await waitFor(() => expect(screen.queryByTestId('copied-marker')).toBeNull())
  })

  it('CreateUserDialog exposes a named dialog with labelled controls', async () => {
    mount(<CreateUserDialog open onClose={() => {}} defaultRole="student" onCreated={() => {}} />)
    const dialog = await screen.findByRole('dialog', { name: /Create an account/i })
    expect(dialog).toBeTruthy()
    expect(screen.getByLabelText('Full name')).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Phone (optional)')).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Student' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Faculty' })).toBeTruthy()
    expect(screen.getByTestId('create-user-dialog').querySelector('button[type="submit"]')).toBeTruthy()
  })

  it('CredentialsSheet exposes a named dialog, a captioned table and labelled copy buttons', async () => {
    mount(<CredentialsSheet rows={[FIXTURE_ROW]} onClose={() => {}} />)
    expect(await screen.findByRole('dialog', { name: /One-time sign-in credentials/i })).toBeTruthy()
    expect(screen.getByRole('table', { name: /One-time credentials for newly created accounts/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy Institute ID for Test Row' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy temporary password for Test Row' })).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toBe(CREDENTIAL_SECURITY_NOTICE)
    expect(screen.getByRole('button', { name: /Download CSV/ })).toBeTruthy()
    expect(screen.getAllByRole('columnheader')).toHaveLength(5)
  })

  it('AccountRowActions confirmation has an accessible name and a labelled reason', async () => {
    const created = await createStudent()
    const row = created.account
    const actor = userEvent.setup()
    const batches = await adminService.listAdminBatches()
    mount(<AccountRowActions row={row} batches={batches} onCredentials={() => {}} />)
    await actor.click(screen.getByRole('button', { name: 'Manage' }))
    await actor.click(screen.getByRole('button', { name: /Suspend account/ }))
    expect(await screen.findByRole('dialog', { name: /Suspend account/i })).toBeTruthy()
    expect(screen.getByLabelText('Reason for the record')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeTruthy()
    expect(screen.getByTestId('account-action-form')).toBeTruthy()
  })

  it('page-header actions are disabled while the create dialog is open (keyboard preserved)', async () => {
    const session = useSessionStore.getState().session
    const { user: actor } = await renderRoute('/admin/users', { session })
    const open = await screen.findByRole('button', { name: 'Create account' })
    await actor.click(open)
    await waitFor(() => expect(screen.getByTestId('create-user-dialog')).toBeTruthy())
    const buttons = screen.getAllByRole('button', { name: 'Create account' })
    expect(buttons[0].hasAttribute('disabled')).toBe(true)
    /* Keyboard navigation still reaches the dialog's form controls. */
    expect(screen.getByLabelText('Full name').tabIndex).toBeGreaterThanOrEqual(0)
  })
})


/* ── B3.2 / F-05 — runtime credential-cache verification (R-1 closure) ─────
 * B3.1 proved `mutation.reset()` + `MutationCache.remove()` only with source
 * scans and a single `useCreateUser` runtime case (final acceptance review
 * F-05). This block executes ALL THREE credential mutations through the real
 * hooks against a real QueryClient, for ALL FOUR removal paths, adds a
 * `reset()`-only negative control, and covers pending-mutation completion after
 * unmount / navigation (user safeguard 2). jsdom ONLY.
 * ------------------------------------------------------------------------- */

/** @param {{ hook: Function, input: any, client: any, onResult: Function }} props */
function CredentialCacheChild({ hook, input, client, onResult }) {
  const mutation = hook()
  const clear = useTransientCredentialLifecycle()
  const navigate = useNavigate()
  return (
    <div data-testid="credential-cache-harness">
      <button type="button" onClick={() => mutation.mutate(input, { onSuccess: onResult })}>Start credential mutation</button>
      <button type="button" onClick={() => mutation.reset()}>Reset only</button>
      <button type="button" onClick={() => { mutation.reset(); clear() }}>Close credentials</button>
      <button type="button" onClick={() => navigate('/away')}>Navigate away</button>
      <button type="button" onClick={() => { useSessionStore.getState().clear(); client.clear() }}>Sign out</button>
    </div>
  )
}

/** A parent OUTSIDE the routed child keeps `retained` state, so any late
 *  success callback after navigation could reintroduce plaintext there. */
function IdentityCacheHarness({ hook, input, client, onResult, retain = false }) {
  const [retained, setRetained] = useState(null)
  const handle = (result) => {
    if (retain) setRetained(result)
    onResult(result)
  }
  return (
    <MemoryRouter initialEntries={['/admin/users']}>
      <Routes>
        <Route path="/admin/users" element={<CredentialCacheChild hook={hook} input={input} client={client} onResult={handle} />} />
        <Route path="/away" element={<div data-testid="away">Away</div>} />
      </Routes>
      <output data-testid="retained">{retained ? JSON.stringify(retained) : 'empty'}</output>
    </MemoryRouter>
  )
}

describe('B3.2 / F-05 — runtime credential-cache verification (all flows, all removal paths)', () => {
  const IMPORT_CSV = [
    'Roll number,Full name,Email,Phone,Role,Batch,Joined on',
    'VY-26-9101,Cache Student One,cache.one@vidyutacademy.in,9876543210,student,Prayas JEE 2027 — Morning,2026-10-01',
    'VY-26-9102,Cache Faculty Two,cache.two@vidyutacademy.in,,faculty,,2026-10-02',
  ].join('\n')
  const IMPORT_MAPPING = {
    rollNumber: 'Roll number', name: 'Full name', email: 'Email', phone: 'Phone',
    role: 'Role', batch: 'Batch', joinedAt: 'Joined on',
  }
  let reissueKey = ''
  beforeEach(async () => {
    reissueKey = (await createStudent()).account.instituteId
  })

  const flows = [
    {
      name: 'useCreateUser', hook: useCreateUser,
      input: () => ({ role: 'faculty', name: 'Cache Faculty', email: `b32cache.${Date.now()}${Math.random().toString(36).slice(2, 6)}@vidyutacademy.in` }),
    },
    {
      name: 'useCommitImport', hook: useCommitImport,
      input: () => ({ csv: IMPORT_CSV, mapping: IMPORT_MAPPING, fixes: {}, skipped: [], fileName: 'b32-cache.csv' }),
    },
    {
      name: 'useReissueTemporaryPassword', hook: useReissueTemporaryPassword,
      input: () => ({ accountKey: reissueKey, reason: 'Lost credential.' }),
    },
  ]
  const paths = [
    { label: 'explicit close', run: () => fireEvent.click(screen.getByRole('button', { name: 'Close credentials' })) },
    { label: 'unmount', run: (view) => view.unmount() },
    { label: 'navigation', run: () => fireEvent.click(screen.getByRole('button', { name: 'Navigate away' })) },
    { label: 'sign-out', run: () => fireEvent.click(screen.getByRole('button', { name: 'Sign out' })) },
  ]

  /** @param {any} client @param {string} secret */
  async function assertNoPlaintext(client, secret) {
    const cache = client.getMutationCache()
    const mutations = cache.getAll()
    expect(cache.findAll({ mutationKey: TRANSIENT_CREDENTIAL_MUTATION_KEY, exact: false })).toEqual([])
    expect(JSON.stringify(mutations.map((m) => ({ data: m.state.data, variables: m.state.variables, error: m.state.error })))).not.toContain(secret)
    expect(JSON.stringify(client.getQueryCache().getAll().map((q) => ({ key: q.queryKey, data: q.state.data })))).not.toContain(secret)
    expect(JSON.stringify({ ...localStorage })).not.toContain(secret)
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(secret)
    expect(window.location.href).not.toContain(secret)
    expect(JSON.stringify(loadAccountsDb())).not.toContain(secret)
    const audit = await adminService.listAudit(ADMIN_ID, { page: 1, pageSize: 50 })
    expect(JSON.stringify(audit.items)).not.toContain(secret)
    expect(document.body.textContent).not.toContain(secret)
  }

  for (const flow of flows) {
    for (const path of paths) {
      it(`${flow.name} / ${path.label}: no plaintext in mutation cache, query cache, storage, URL, audit, accounts DB or DOM`, async () => {
        const client = newClient()
        const results = []
        const log = vi.spyOn(console, 'log').mockImplementation(() => {})
        const view = mount(
          <IdentityCacheHarness hook={flow.hook} input={flow.input()} client={client} onResult={(result) => results.push(result)} />,
          client,
        )
        fireEvent.click(screen.getByRole('button', { name: 'Start credential mutation' }))
        await waitFor(() => expect(results).toHaveLength(1))
        const secret = results[0].credentials[0].temporaryPassword
        expect(secret).toBeTruthy()
        /* POSITIVE CONTROL: the credential really is in the MutationCache
           before removal, so the assertions below are meaningful. */
        const mutationCacheData = () => JSON.stringify(client.getMutationCache().getAll().map((m) => m.state.data))
        expect(mutationCacheData()).toContain(secret)

        await path.run(view, client)

        expect(mutationCacheData()).not.toContain(secret)
        await assertNoPlaintext(client, secret)
        expect(log.mock.calls.flat().join(' ')).not.toContain(secret)
      })
    }
  }

  it('negative control: mutation.reset() alone retains the credential; MutationCache.remove() is required', async () => {
    const client = newClient()
    const results = []
    mount(
      <IdentityCacheHarness hook={useCreateUser} input={flows[0].input()} client={client} onResult={(result) => results.push(result)} />,
      client,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Start credential mutation' }))
    await waitFor(() => expect(results).toHaveLength(1))
    const secret = results[0].credentials[0].temporaryPassword
    const cacheData = () => JSON.stringify(client.getMutationCache().getAll().map((m) => m.state.data))
    expect(cacheData()).toContain(secret)
    fireEvent.click(screen.getByRole('button', { name: 'Reset only' }))
    await waitFor(() => expect(client.getMutationCache().getAll()).toHaveLength(1))
    expect(cacheData()).toContain(secret)
    /* The real lifecycle hook uses remove(), not reset(). */
    clearTransientCredentialMutations(client)
    expect(client.getMutationCache().getAll()).toHaveLength(0)
    await assertNoPlaintext(client, secret)
    expect(source('src/features/admin/hooks/useAdminOps.js')).toContain('cache.remove(mutation)')
  })

  /* Safeguard 2: pending-mutation completion AFTER unmount/navigation. A
     synthetic sentinel stands in for a generated password so no real secret is
     embedded in the diff; the real service method is deferred with a spy. */
  const latePayload = (secret) => ({
    account: { instituteId: 'VYU-F-99-9999', name: 'Late Callback' },
    credentials: [{ instituteId: 'VYU-F-99-9999', temporaryPassword: secret, role: 'faculty', name: 'Late Callback', batchName: '' }],
  })

  async function deferredCreate() {
    let resolve
    const promise = new Promise((done) => { resolve = done })
    vi.spyOn(adminService, 'createUser').mockImplementation(() => promise)
    return { resolve, promise }
  }

  it('positive control: a pending credential mutation that completes WHILE mounted does deliver its result', async () => {
    /* Proves the deferred spy and per-call onSuccess wiring are real, so the
       two late-callback tests below are meaningful negative controls. */
    const SENTINEL = 'b32-late-positive-control'
    const { resolve, promise } = await deferredCreate()
    const client = newClient()
    const onResult = vi.fn()
    mount(
      <IdentityCacheHarness hook={useCreateUser} input={flows[0].input()} client={client} onResult={onResult} retain />,
      client,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Start credential mutation' }))
    await waitFor(() => expect(client.getMutationCache().getAll()).toHaveLength(1))
    resolve(latePayload(SENTINEL))
    await waitFor(() => expect(onResult).toHaveBeenCalledTimes(1))
    expect(onResult.mock.calls[0][0].credentials[0].temporaryPassword).toBe(SENTINEL)
    expect(screen.getByTestId('retained').textContent).toContain(SENTINEL)
    await promise
  })

  it('Safeguard 2: pending completion after UNMOUNT cannot reintroduce plaintext or re-add a cache entry', async () => {
    const SENTINEL = 'b32-late-unmount-sentinel'
    const { resolve, promise } = await deferredCreate()
    const client = newClient()
    const onResult = vi.fn()
    const events = []
    client.getMutationCache().subscribe((event) => events.push(event.type))
    const view = mount(
      <IdentityCacheHarness hook={useCreateUser} input={flows[0].input()} client={client} onResult={onResult} />,
      client,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Start credential mutation' }))
    await waitFor(() => expect(client.getMutationCache().getAll()).toHaveLength(1))
    expect(client.getMutationCache().getAll()[0].state.status).toBe('pending')
    view.unmount()
    expect(client.getMutationCache().getAll()).toHaveLength(0)
    events.length = 0

    resolve(latePayload(SENTINEL))
    await act(async () => { await promise; for (let index = 0; index < 8; index += 1) await Promise.resolve() })

    expect(onResult).not.toHaveBeenCalled()
    expect(events).not.toContain('added')
    expect(client.getMutationCache().getAll()).toHaveLength(0)
    await assertNoPlaintext(client, SENTINEL)
  })

  it('Safeguard 2: pending completion after NAVIGATION cannot put plaintext into retained state', async () => {
    const SENTINEL = 'b32-late-navigation-sentinel'
    const { resolve, promise } = await deferredCreate()
    const client = newClient()
    const onResult = vi.fn()
    const events = []
    client.getMutationCache().subscribe((event) => events.push(event.type))
    mount(
      <IdentityCacheHarness hook={useCreateUser} input={flows[0].input()} client={client} onResult={onResult} retain />,
      client,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Start credential mutation' }))
    await waitFor(() => expect(client.getMutationCache().getAll()).toHaveLength(1))
    expect(client.getMutationCache().getAll()[0].state.status).toBe('pending')
    fireEvent.click(screen.getByRole('button', { name: 'Navigate away' }))
    await waitFor(() => expect(screen.getByTestId('away')).toBeTruthy())
    expect(client.getMutationCache().getAll()).toHaveLength(0)
    events.length = 0

    resolve(latePayload(SENTINEL))
    await act(async () => { await promise; for (let index = 0; index < 8; index += 1) await Promise.resolve() })

    expect(onResult).not.toHaveBeenCalled()
    expect(events).not.toContain('added')
    expect(screen.getByTestId('retained').textContent).toBe('empty')
    expect(client.getMutationCache().getAll()).toHaveLength(0)
    await assertNoPlaintext(client, SENTINEL)
  })
})
