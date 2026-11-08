import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { apiServices } from '@/services'
import { adminService, setAccountWriteProbe } from '@/services/mock/admin.js'
import { authService } from '@/services/mock/auth.js'
import { studentService, dashboardService, assessmentService } from '@/services/mock/students.js'
import { facultyService } from '@/services/mock/faculty.js'
import {
  AUDIT_ACTIONS, auditSeed, configureInstituteIds, loadAccountsDb, parseInstituteId,
  ACCOUNTS_STORAGE_KEY,
} from '@/mock-data/index.js'
import {
  CREDENTIAL_CSV_COLUMNS, CREDENTIAL_CSV_FILE_NAME, CREDENTIAL_SECURITY_NOTICE,
} from '@/contracts/admin.js'
import { csvFromColumns } from '@/shared/lib/adminMath.js'
import { queryKeys } from '@/app/providers/queryClient.js'
import { V2_ROUTE_MATRIX } from '@/app/routes/v2RouteTable.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { ToastProvider } from '@/shared/ui/Toast.jsx'
import { CredentialsSheet } from '@/features/admin/components/CredentialsSheet.jsx'
import { renderRoute } from './helpers.jsx'
import { signInDemoStudent, signInDemoFaculty } from '../helpers/workspaceIdentity.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

const ADMIN_ID = 'adm-pratibha'
const STORE_KEYS = [
  ACCOUNTS_STORAGE_KEY,
  'vyuh.mock.auth.v1',
  'vyuh.mock.admin.v1',
  'vyuh.session',
]
const serialisedStores = () => STORE_KEYS.map((key) => localStorage.getItem(key) ?? '').join('\n')
const source = (relative) => readFileSync(resolve(process.cwd(), relative), 'utf8')

const ALL = { page: 1, pageSize: 100, role: 'all', batchId: 'all', status: 'all', search: '' }
const listUsers = () => adminService.listUsers(ADMIN_ID, ALL)
const configYear = (year) => configureInstituteIds({ year })

/** A real Admin session persisted so recordAudit can derive its actor. */
async function asAdmin() {
  const session = await authService.login({ email: 'academic.office@vidyutacademy.in', password: 'vyuh2026' })
  useSessionStore.getState().setSession(session)
  return session
}

async function createStudent(overrides = {}) {
  return adminService.createUser(ADMIN_ID, {
    role: 'student',
    name: 'Ananya Mohapatra',
    email: `office.student.${Date.now()}${Math.random().toString(36).slice(2, 7)}@vidyutacademy.in`,
    phone: '9876543210',
    rollNumber: `VY-26-${Math.floor(1000 + Math.random() * 8999)}`,
    batchId: 'bat-prayas-m',
    ...overrides,
  })
}

async function createFaculty(overrides = {}) {
  return adminService.createUser(ADMIN_ID, {
    role: 'faculty',
    name: 'Rituparna Das',
    email: `office.faculty.${Date.now()}${Math.random().toString(36).slice(2, 7)}@vidyutacademy.in`,
    ...overrides,
  })
}

beforeEach(async () => {
  localStorage.clear()
  useSessionStore.getState().clear()
  setAccountWriteProbe(null)
  /* '99' is TEST FIXTURE DATA, not institute policy. Batch 2 ships year:null. */
  configYear('99')
  await asAdmin()
})

afterEach(() => {
  setAccountWriteProbe(null)
})

/* ── WS1 — contracts, facade parity, audit vocabulary ───────────────────── */

describe('WS1 — additive contracts, facade parity and audit vocabulary', () => {
  it('mock and HTTP admin facades expose exactly the same method names (Q-3)', () => {
    expect(Object.keys(adminService).sort()).toEqual(Object.keys(apiServices.admin).sort())
  })

  it('every new HTTP admin method is an honest 501, never a pretend endpoint', async () => {
    const names = [
      'getInstituteIdConfig', 'configureInstituteIds', 'previewInstituteId', 'createUser',
      'markCredentialsShown', 'applyAccountOperation', 'editAccount',
      'moveStudentBatch', 'reissueTemporaryPassword',
    ]
    for (const name of names) {
      await expect(apiServices.admin[name]({})).rejects.toMatchObject({ code: 'admin_api_unavailable', status: 501 })
    }
  })

  it('adds all ten account actions while keeping all 15 seeded keys and 20 seeded entries (G-1, G-5)', () => {
    const added = [
      'user.create', 'user.import', 'user.suspend', 'user.reactivate', 'user.lock',
      'user.unlock', 'user.archive', 'user.edit', 'user.batch.move', 'user.credential.reissue',
    ]
    for (const key of added) {
      expect(AUDIT_ACTIONS[key]?.label).toBeTruthy()
      expect(AUDIT_ACTIONS[key]?.tone).toBeTruthy()
    }
    expect(AUDIT_ACTIONS['policy.update'].label).toBe('Policy changed')
    expect(AUDIT_ACTIONS['import.commit'].label).toBe('CSV import committed')
    expect(auditSeed).toHaveLength(20)
  })

  it('U-1 pins the exact credential CSV column order, filename and U-2 notice text', () => {
    expect(CREDENTIAL_CSV_COLUMNS.map((c) => c.key)).toEqual([
      'instituteId', 'temporaryPassword', 'role', 'name', 'batchName',
    ])
    expect(CREDENTIAL_CSV_COLUMNS.map((c) => c.label)).toEqual([
      'instituteId', 'temporaryPassword', 'role', 'name', 'batchName',
    ])
    expect(CREDENTIAL_CSV_FILE_NAME).toBe('vyuh-one-time-credentials.csv')
    expect(CREDENTIAL_SECURITY_NOTICE).toBe(
      'These credentials are shown only once. Share them securely with the intended user. The temporary password must be changed at first sign-in and cannot be retrieved later. Copying or downloading credentials may leave plaintext on this device or in its clipboard or Downloads folder. Close this sheet only after you have safely delivered the credentials.',
    )
  })

  it('never defines a credential query key (B-9) and keeps new read keys in the admin namespace (Q-1)', () => {
    const keySource = source('src/app/providers/queryClient.js')
    expect(keySource).not.toMatch(/credentials\(/)
    expect(keySource).not.toMatch(/'credentials'/)
    expect(queryKeys.admin.instituteIdConfig(ADMIN_ID).slice(0, 2)).toEqual(['admin', ADMIN_ID])
  })

  it('keeps all 33 v2 aliases and the /a/people redirect (A-09, N-1)', () => {
    expect(V2_ROUTE_MATRIX).toHaveLength(33)
    const aliasSource = source('src/app/routes/v2RouteTable.js') + source('src/app/routes/v2Aliases.jsx')
    expect(aliasSource).toMatch(/\/a\/people/)
  })

  it('contains no Password Requests tab/queue, no G5 consent and no Admin-created Admin path (E-3, §19.4)', () => {
    const files = [
      'src/features/admin/pages/AdminUsersPage.jsx',
      'src/features/admin/components/PeopleTabs.jsx',
      'src/features/admin/components/AccountRowActions.jsx',
      'src/features/admin/components/CreateUserDialog.jsx',
      'src/services/mock/admin.js',
    ].map(source).join('\n')
    expect(files).not.toMatch(/PasswordRequestsTab|passwordRequests|listPasswordRequests|resolvePasswordRequest/i)
    expect(files).not.toMatch(/FirstLoginPolicy|policyVersion|ConsentFields|termsConsent|attendanceConsent/i)
    expect(files).not.toMatch(/value="admin"|role: 'admin'.*create/)
  })

  it('retires the stale invitation / self-set-password copy (F-7, F-13, F-14)', () => {
    const ui = [
      'src/features/admin/pages/AdminUsersPage.jsx',
      'src/features/admin/pages/AdminImportPage.jsx',
      'src/mock-data/importCsv.js',
    ].map(source).join('\n')
    expect(ui).not.toMatch(/sets? (their|his|her) own password|arrives? invited|Each account arrives invited|The sign-in address/i)
    expect(ui).toMatch(/Institute ID/i)
    expect(source('src/mock-data/importCsv.js')).not.toMatch(/temporaryPassword|credential column/i)
  })
})

/* ── WS2 — registry bridge and Institute ID configuration ───────────────── */

describe('WS2 — merged roster and Admin-only year token', () => {
  it('reports an unconfigured institute year token as a blocked student state (F-3)', async () => {
    configYear(null)
    const view = await adminService.getInstituteIdConfig(ADMIN_ID)
    expect(view.year).toBeNull()
    expect(view.studentCreationAvailable).toBe(false)
    expect(view.facultyCreationAvailable).toBe(true)
  })

  it('accepts exactly two digits, rejects derived/invalid values, and never uses Date (F-3, R-2)', async () => {
    await expect(adminService.configureInstituteIds(ADMIN_ID, { year: '2026' })).rejects.toMatchObject({ code: 'year_token_invalid' })
    await expect(adminService.configureInstituteIds(ADMIN_ID, { year: 'ab' })).rejects.toMatchObject({ code: 'year_token_invalid' })
    const view = await adminService.configureInstituteIds(ADMIN_ID, { year: '26' })
    expect(view.year).toBe('26')
    expect(view.studentCreationAvailable).toBe(true)
    const configPanel = source('src/features/admin/components/InstituteIdConfigPanel.jsx')
    expect(configPanel).not.toMatch(/new Date|Date\.now|getFullYear/)
    expect(source('src/mock-data/accounts.js')).toMatch(/year: null/)
  })

  it('blocks student creation with year:null and burns no Institute ID (F-3, B-3)', async () => {
    configYear(null)
    const before = loadAccountsDb().issuedInstituteIds.length
    await expect(createStudent()).rejects.toMatchObject({ code: 'institute_year_not_configured' })
    expect(loadAccountsDb().issuedInstituteIds).toHaveLength(before)
    const faculty = await createFaculty()
    expect(faculty.account.instituteId).toMatch(/^VYU-F-\d{4}$/)
  })

  it('previewInstituteId is non-mutating (B-3)', async () => {
    const before = JSON.stringify(loadAccountsDb())
    const preview = await adminService.previewInstituteId(ADMIN_ID, { role: 'student' })
    expect(preview.ok).toBe(true)
    expect(preview.instituteId).toMatch(/^VYU-S-99-\d{4}$/)
    expect(JSON.stringify(loadAccountsDb())).toBe(before)
  })

  it('keeps the 749 seeded rows visible and exposes five status facets (F-1, F-6, A-4)', async () => {
    const page = await listUsers()
    expect(page.total).toBe(749)
    expect(page.counts.students).toBe(720)
    expect(page.counts.faculty).toBe(26)
    expect(page.counts.admins).toBe(3)
    expect(page.facets.statuses.map((facet) => facet.value)).toEqual([
      'active', 'invited', 'suspended', 'locked', 'archived',
    ])
    expect(page.facets.statuses.map((facet) => facet.label)).toEqual([
      'Active', 'Invited', 'Suspended', 'Locked', 'Archived',
    ])
  })

  it('a created account appears exactly once with additive fields and no credential (F-1, A-4, A-05)', async () => {
    const created = await createStudent()
    const page = await listUsers()
    const rows = page.items.filter((row) => row.instituteId === created.account.instituteId)
    expect(rows).toHaveLength(1)
    expect(page.total).toBe(750)
    expect(rows[0]).toMatchObject({
      id: created.account.instituteId,
      name: 'Ananya Mohapatra',
      status: 'active',
      source: 'institute_issued',
      mustChangePassword: true,
      credentialDelivery: 'pending',
      batchId: 'bat-prayas-m',
    })
    expect(rows[0].instituteId).not.toBe(rows[0].rollNumber)
    expect(parseInstituteId(rows[0].rollNumber)).toBeNull()
    /* `temporaryPasswordIssuedAt` is a Batch 2 metadata timestamp, not a value.
       Assert no credential VALUE or credential FIELD reaches the row. */
    for (const forbidden of ['temporaryPassword', 'passwordHash', 'salt', 'currentPassword']) {
      expect(Object.keys(rows[0])).not.toContain(forbidden)
    }
    expect(JSON.stringify(rows[0])).not.toContain(created.credentials[0].temporaryPassword)
  })

  it('derives audit actor from the signed-in Admin session (F-5, G-4)', async () => {
    const created = await createStudent()
    const audit = await adminService.listAudit(ADMIN_ID, { page: 1, pageSize: 10 })
    const entry = audit.items.find((item) => item.action === 'user.create')
    expect(entry?.actorId).toBe(useSessionStore.getState().user?.id)
    expect(entry?.actorName).toBeTruthy()
    expect(entry?.target).toContain(created.account.instituteId)
  })
})

/* ── WS5 — creation ─────────────────────────────────────────────────────── */

describe('WS5 — Admin-created student and faculty accounts', () => {
  it('creates a student with a real ID, one-time credential and mandatory first-login setup (B-1)', async () => {
    const result = await createStudent()
    expect(result.account.instituteId).toMatch(/^VYU-S-99-\d{4}$/)
    expect(result.credentials).toHaveLength(1)
    expect(result.credentials[0].temporaryPassword).toHaveLength(12)
    expect(result.credentials[0]).toMatchObject({
      instituteId: result.account.instituteId, role: 'student', name: 'Ananya Mohapatra',
    })
    expect(result.credentials[0].batchName).toBeTruthy()
    expect(result.auditId).toBeTruthy()
  })

  it('creates a faculty account without a batch and with no year token in its ID (B-1, A-03)', async () => {
    const result = await createFaculty()
    expect(result.account.instituteId).toMatch(/^VYU-F-\d{4}$/)
    expect(result.account.batchId).toBeNull()
    expect(result.credentials[0].role).toBe('faculty')
    expect(result.credentials[0].batchName).toBeNull()
  })

  it('rejects Admin-created Admin accounts and burns no ID (B-2, A-08)', async () => {
    const before = loadAccountsDb().issuedInstituteIds.length
    await expect(adminService.createUser(ADMIN_ID, { role: 'admin', name: 'Office Seat', email: 'office2@vidyutacademy.in' }))
      .rejects.toMatchObject({ code: 'role_invalid' })
    expect(loadAccountsDb().issuedInstituteIds).toHaveLength(before)
  })

  it('rejects duplicate emails across the registry, ledger and demo seats (B-5, F-4)', async () => {
    const first = await createStudent()
    await expect(createStudent({ email: first.account.email })).rejects.toMatchObject({ code: 'duplicate_email' })
    await expect(createStudent({ email: 'academic.office@vidyutacademy.in' })).rejects.toMatchObject({ code: 'duplicate_email' })
    await expect(createStudent({ email: 'not-an-email' })).rejects.toMatchObject({ code: 'email_invalid' })
  })

  it('rejects duplicate roll numbers but allows a null roll (B-4, B-5)', async () => {
    const first = await createStudent({ rollNumber: 'VY-26-7777' })
    await expect(createStudent({ rollNumber: first.account.rollNumber })).rejects.toMatchObject({ code: 'duplicate_roll_number' })
    const other = await createStudent({ rollNumber: '' })
    expect(other.account.rollNumber).toBeNull()
  })

  it('allocates distinct never-reused IDs across create and import (A-03, B-5)', async () => {
    const ids = []
    for (let index = 0; index < 5; index += 1) ids.push((await createFaculty()).account.instituteId)
    expect(new Set(ids).size).toBe(5)
    expect(loadAccountsDb().issuedInstituteIds.filter((id) => ids.includes(id))).toHaveLength(5)
  })

  it('a failed single create writes nothing at all (WS7 atomicity, RK-4)', async () => {
    const before = serialisedStores()
    const issuedBefore = loadAccountsDb().issuedInstituteIds.length
    setAccountWriteProbe((phase) => { if (phase === 'provisioned') throw new Error('Injected post-provisioning failure') })
    await expect(createStudent()).rejects.toThrow('Injected post-provisioning failure')
    expect(serialisedStores()).toBe(before)
    expect(loadAccountsDb().issuedInstituteIds).toHaveLength(issuedBefore)
  })

  it('an issued student resolves its batch in every active Admin batch, including bat-neet-13 (B-6, H-4)', async () => {
    const result = await createStudent({ batchId: 'bat-neet-13' })
    const session = await authService.login({ email: result.account.instituteId, password: result.credentials[0].temporaryPassword })
    useSessionStore.getState().setSession(session)
    const student = await studentService.getById(session.user.id)
    expect(student.batchId).toBe('bat-neet-13')
    expect(student.batchName).toBe('Aarogyam NEET 2027 — Afternoon')
    expect(student.rollNumber).toBe(result.account.rollNumber)
    const profile = await studentService.getProfile(session.user.id)
    expect(profile.batch.id).toBe('bat-neet-13')
  })
})

/* ── WS4 — one-time credentials ─────────────────────────────────────────── */

describe('WS4 — one-time credentials, no plaintext exposure', () => {
  it('never persists the generated password to any store, session, audit or cache (G3, C-2)', async () => {
    const result = await createStudent()
    const secret = result.credentials[0].temporaryPassword
    expect(secret).toHaveLength(12)
    expect(serialisedStores()).not.toContain(secret)
    const audit = await adminService.listAudit(ADMIN_ID, { page: 1, pageSize: 10 })
    expect(JSON.stringify(audit.items)).not.toContain(secret)
    expect(JSON.stringify(loadAccountsDb())).not.toContain(secret)
  })

  it('marks credentialDelivery as shown without storing a value (F-10, C-3)', async () => {
    const created = await createStudent()
    const response = await adminService.markCredentialsShown(ADMIN_ID, { accountKeys: [created.account.instituteId] })
    expect(response.updated).toBe(1)
    const record = loadAccountsDb().accounts[created.account.instituteId]
    expect(record.credentialDelivery).toBe('shown')
    expect(JSON.stringify(record)).not.toContain(created.credentials[0].temporaryPassword)
    expect(await adminService.markCredentialsShown(ADMIN_ID, { accountKeys: [created.account.instituteId] })).toEqual({ updated: 0 })
  })

  it('U-1 CSV is produced client-side from transient rows with the exact header (C-1, U-1)', async () => {
    const created = await createStudent()
    const rows = created.credentials
    const csv = csvFromColumns(CREDENTIAL_CSV_COLUMNS, rows)
    expect(csv.split('\n')[0]).toBe('instituteId,temporaryPassword,role,name,batchName')
    expect(csv.split('\n')).toHaveLength(2)
    expect(csv).toContain(created.account.instituteId)
    expect(source('src/features/admin/components/CredentialsSheet.jsx')).toContain('CREDENTIAL_CSV_FILE_NAME')
  })

  it('renders exactly two tabs, an exact U-2 notice and labelled per-value Copy buttons', async () => {
    const { user: actor } = await renderRoute('/admin/users', { session: useSessionStore.getState().session })
    const tabs = await screen.findAllByRole('tab')
    expect(tabs).toHaveLength(2)
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Students', 'Faculty'])
    expect(screen.queryByText(/Password requests/i)).toBeNull()
    await actor.click(tabs[1])
    await waitFor(() => expect(screen.getByTestId('users-count').textContent).toMatch(/26 accounts/))

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    const onClose = vi.fn()
    const fixtureRow = { instituteId: 'VYU-S-99-0001', temporaryPassword: 'FIXTUREONLY00', role: 'student', name: 'Test Row', batchName: 'Batch' }
    render(
      <MotionConfig reducedMotion="user"><QueryClientProvider client={queryClient}><ToastProvider>
        <CredentialsSheet rows={[fixtureRow]} onClose={onClose} />
      </ToastProvider></QueryClientProvider></MotionConfig>,
    )
    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(screen.getByText(CREDENTIAL_SECURITY_NOTICE)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy Institute ID for Test Row' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy temporary password for Test Row' })).toBeTruthy()
    expect(screen.getByText(/cannot clear your clipboard or erase that file/)).toBeTruthy()
    expect(screen.getAllByTestId('credential-row')).toHaveLength(1)
  })

  it('every credential-producing flow drops its mutation data on close (U-1, G3)', () => {
    expect(source('src/features/admin/components/CreateUserDialog.jsx')).toMatch(/onCreated\(result\.credentials\)[\s\S]{0,220}create\.reset\(\)/)
    expect(source('src/features/admin/pages/AdminImportPage.jsx')).toMatch(/setCredentials\(\[\]\)[\s\S]{0,160}commit\.reset\(\)/)
    expect(source('src/features/admin/components/AccountRowActions.jsx')).toMatch(/reissue\.reset\(\)/)
    expect(source('src/features/admin/pages/AdminImportPage.jsx')).toContain('credentials: undefined')
  })

  it('does not compile a password-retrieval API or a plaintext query key (A-05, §19.4)', () => {
    const combined = [
      'src/services/mock/admin.js', 'src/services/mock/auth.js', 'src/services/types.js',
      'src/app/providers/queryClient.js', 'src/features/admin/hooks/useAdminOps.js',
    ].map(source).join('\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    expect(combined).not.toMatch(/revealPassword|getPlaintext|retrievePassword|passwordPlaintext/i)
    expect(combined).not.toMatch(/setQueryData\([^\n]*credential/i)
  })
})

/* ── WS6/WS7 — lifecycle, recovery, lockout ─────────────────────────────── */

describe('WS6/WS7 — lifecycle, mandatory reasons, out-of-band recovery', () => {
  it('rejects an empty reason for every sensitive operation, service-side (E-4, D-1)', async () => {
    const created = await createStudent()
    const key = { accountKey: created.account.instituteId }
    for (const operation of ['suspend', 'reactivate', 'lock', 'unlock', 'archive']) {
      await expect(adminService.applyAccountOperation(ADMIN_ID, operation, { ...key, reason: '' }))
        .rejects.toMatchObject({ code: 'reason_required' })
    }
    await expect(adminService.editAccount(ADMIN_ID, { ...key, reason: '', name: 'X' })).rejects.toMatchObject({ code: 'reason_required' })
    await expect(adminService.moveStudentBatch(ADMIN_ID, { ...key, reason: '', batchId: 'bat-neet-13' })).rejects.toMatchObject({ code: 'reason_required' })
    await expect(adminService.reissueTemporaryPassword(ADMIN_ID, { ...key, reason: '' })).rejects.toMatchObject({ code: 'reason_required' })
  })

  it('suspend blocks sign-in, reactivate restores it, archive is terminal (D-1, D-3)', async () => {
    const created = await createStudent()
    const key = { accountKey: created.account.instituteId, reason: 'Identity verified by the office.' }
    const secret = created.credentials[0].temporaryPassword
    await adminService.applyAccountOperation(ADMIN_ID, 'suspend', key)
    await expect(authService.login({ email: created.account.instituteId, password: secret }))
      .rejects.toMatchObject({ code: 'account_suspended' })
    await adminService.applyAccountOperation(ADMIN_ID, 'reactivate', key)
    await expect(authService.login({ email: created.account.instituteId, password: secret })).resolves.toBeTruthy()

    await adminService.applyAccountOperation(ADMIN_ID, 'archive', { ...key, acknowledged: true })
    await expect(authService.login({ email: created.account.instituteId, password: secret }))
      .rejects.toMatchObject({ code: 'account_archived' })
    await expect(adminService.applyAccountOperation(ADMIN_ID, 'reactivate', key))
      .rejects.toMatchObject({ code: 'account_archived' })
    expect(loadAccountsDb().accounts[created.account.instituteId]).toBeTruthy()
  })

  it('archive requires an explicit irreversible acknowledgement (U-4, D-3)', async () => {
    const created = await createStudent()
    await expect(adminService.applyAccountOperation(ADMIN_ID, 'archive', {
      accountKey: created.account.instituteId, reason: 'Left the institute.',
    })).rejects.toMatchObject({ code: 'archive_confirmation_required' })
  })

  it('lock/unlock use the additive status transitions and reject illegal ones (D-3)', async () => {
    const created = await createStudent()
    const key = { accountKey: created.account.instituteId, reason: 'Security review.' }
    await expect(adminService.applyAccountOperation(ADMIN_ID, 'reactivate', key))
      .rejects.toMatchObject({ code: 'status_transition_invalid' })
    const locked = await adminService.applyAccountOperation(ADMIN_ID, 'lock', key)
    expect(locked.account.status).toBe('locked')
    const unlocked = await adminService.applyAccountOperation(ADMIN_ID, 'unlock', key)
    expect(unlocked.account.status).toBe('active')
  })

  it('edit changes only editable fields and enforces uniqueness (U-4, B-5)', async () => {
    const created = await createStudent()
    const other = await createStudent()
    const key = created.account.instituteId
    await expect(adminService.editAccount(ADMIN_ID, {
      accountKey: key, reason: 'Office correction.', email: other.account.email,
    })).rejects.toMatchObject({ code: 'duplicate_email' })
    const edited = await adminService.editAccount(ADMIN_ID, {
      accountKey: key, reason: 'Office correction.',
      name: 'Ananya M', email: 'ananya.edited@vidyutacademy.in', phone: '9000000000', rollNumber: 'VY-26-9000',
      instituteId: 'FORGED-ID', source: 'demo_fixture', role: 'admin',
    })
    expect(edited.account).toMatchObject({ instituteId: key, source: 'institute_issued', role: 'student', name: 'Ananya M' })
    const record = loadAccountsDb().accounts[key]
    expect(record.email).toBe('ananya.edited@vidyutacademy.in')
    expect(record.rollNumber).toBe('VY-26-9000')
    expect(record.phone).toBe('9000000000')
    /* U-4 phone is visible in the canonical People row. The protected Batch 2
       SAFE_ACCOUNT_FIELDS projection is deliberately NOT rewritten; the row is
       built from the registry directly, so phone is editable and persisted. */
    const row = (await listUsers()).items.find((item) => item.instituteId === key)
    expect(row.phone).toBe('9000000000')
  })

  it('never offers an illegal status transition such as suspended → locked (D-3)', async () => {
    const created = await createStudent()
    const key = { accountKey: created.account.instituteId, reason: 'Security review.' }
    await adminService.applyAccountOperation(ADMIN_ID, 'suspend', key)
    await expect(adminService.applyAccountOperation(ADMIN_ID, 'lock', key))
      .rejects.toMatchObject({ code: 'status_transition_invalid' })
    expect(source('src/features/admin/components/AccountRowActions.jsx')).toMatch(/row\.status === 'active' \? \[\{ id: 'lock'/)
  })

  it('a dedicated batch move preserves history and writes one audit entry (U-4, B-12)', async () => {
    const created = await createStudent()
    const moved = await adminService.moveStudentBatch(ADMIN_ID, {
      accountKey: created.account.instituteId, reason: 'Timetable change.', batchId: 'bat-neet-13',
    })
    expect(moved.account.batchId).toBe('bat-neet-13')
    expect(moved.account.instituteId).toBe(created.account.instituteId)
    const audit = await adminService.listAudit(ADMIN_ID, { page: 1, pageSize: 10 })
    expect(audit.items.filter((item) => item.action === 'user.batch.move')).toHaveLength(1)
  })

  it('re-issue invalidates the old credential, forces setup again and preserves lockout (E-1, D-2, R-8)', async () => {
    const created = await createFaculty()
    const key = created.account.instituteId
    const oldSecret = created.credentials[0].temporaryPassword
    /* Produce a real failed-attempt lockout first. */
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await authService.login({ email: key, password: 'WrongPass000' }).catch(() => {})
    }
    const reissued = await adminService.reissueTemporaryPassword(ADMIN_ID, { accountKey: key, reason: 'Lost credential; identity verified.' })
    expect(reissued.credentials[0].temporaryPassword).not.toBe(oldSecret)
    expect(reissued.account.mustChangePassword).toBe(true)
    await expect(authService.login({ email: key, password: oldSecret })).rejects.toBeTruthy()
    /* Lockout survives recovery: the new correct credential is still blocked. */
    await expect(authService.login({ email: key, password: reissued.credentials[0].temporaryPassword }))
      .rejects.toMatchObject({ code: 'account_locked' })
    expect(serialisedStores()).not.toContain(reissued.credentials[0].temporaryPassword)
  })

  it('only the explicit Admin unlock clears the failed-attempt lockout (D-2, R-8)', async () => {
    const created = await createFaculty()
    const key = created.account.instituteId
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await authService.login({ email: key, password: 'WrongPass000' }).catch(() => {})
    }
    await adminService.applyAccountOperation(ADMIN_ID, 'unlock', { accountKey: key, reason: 'Identity verified; unlock requested.' })
    const authDb = JSON.parse(localStorage.getItem('vyuh.mock.auth.v1') ?? '{}')
    expect(authDb.attempts?.[key]).toBeUndefined()
    await expect(authService.login({ email: key, password: created.credentials[0].temporaryPassword })).resolves.toBeTruthy()
  })

  it('first-login setup still works end-to-end for an issued account (D-6, F-2)', async () => {
    const created = await createStudent()
    const session = await authService.login({ email: created.account.instituteId, password: created.credentials[0].temporaryPassword })
    useSessionStore.getState().setSession(session)
    const changed = await authService.changePasswordWithSetup({ newPassword: 'CorrectHorse42', confirmPassword: 'CorrectHorse42' })
    expect(changed.mustChangePassword).toBe(false)
    await expect(authService.login({ email: created.account.instituteId, password: created.credentials[0].temporaryPassword }))
      .rejects.toMatchObject({ code: 'invalid_credentials' })
    expect(loadAccountsDb().accounts[created.account.instituteId].credentialDelivery).toBe('delivered')
  })
})

/* ── WS8 — CSV import bridge and atomicity ──────────────────────────────── */

describe('WS8 — import-to-account bridge', () => {
  const csv = [
    'Roll number,Full name,Email,Phone,Role,Batch,Joined on',
    'VY-26-9001,Test Student One,import.one@vidyutacademy.in,9876543210,student,Prayas JEE 2027 — Morning,2026-10-01',
    'VY-26-9002,Test Faculty Two,import.two@vidyutacademy.in,,faculty,,2026-10-02',
  ].join('\n')
  const mapping = {
    rollNumber: 'Roll number', name: 'Full name', email: 'Email', phone: 'Phone',
    role: 'Role', batch: 'Batch', joinedAt: 'Joined on',
  }
  const input = () => ({ csv, mapping, fixes: {}, skipped: [], fileName: 'batch3-import.csv' })

  it('commits each ready row into a real loginable account with one transient credential (F-2, F-12)', async () => {
    const result = await adminService.commitImport(ADMIN_ID, input())
    expect(result.created).toBe(2)
    expect(result.credentials).toHaveLength(2)
    expect(result.names).toEqual(['Test Student One', 'Test Faculty Two'])
    expect(result.auditId).toBeTruthy()
    const page = await listUsers()
    expect(page.total).toBe(751)
    expect(page.items.filter((row) => row.status === 'invited' && row.id.startsWith('stu-imp-'))).toHaveLength(0)
    for (const credential of result.credentials) {
      const session = await authService.login({ email: credential.instituteId, password: credential.temporaryPassword })
      expect(session.user.mustChangePassword).toBe(true)
    }
  })

  it('rolls every ledger back on a mid-batch failure and burns no ID (F-8, F-16, RK-4)', async () => {
    const before = serialisedStores()
    const issuedBefore = loadAccountsDb().issuedInstituteIds.length
    setAccountWriteProbe((phase) => { if (phase === 'provision-2') throw new Error('Injected mid-batch failure') })
    await expect(adminService.commitImport(ADMIN_ID, input())).rejects.toThrow('Injected mid-batch failure')
    expect(serialisedStores()).toBe(before)
    expect(loadAccountsDb().issuedInstituteIds).toHaveLength(issuedBefore)
  })

  it('rejects a duplicate email already present in the canonical registry (F-12, B-5)', async () => {
    const created = await createStudent()
    const duplicate = csv.replace('import.one@vidyutacademy.in', created.account.email)
    const preview = await adminService.previewImport(ADMIN_ID, { ...input(), csv: duplicate })
    expect(preview.rows[0].status).toBe('invalid')
    expect(JSON.stringify(preview.rows[0].errors)).toMatch(/already has an account/i)
  })

  it('blocks student rows when the institute year token is unconfigured (F-3, B-3)', async () => {
    configYear(null)
    await expect(adminService.commitImport(ADMIN_ID, input()))
      .rejects.toMatchObject({ code: 'institute_year_not_configured' })
  })

  it('writes exactly one visible audit entry with a reason and no credential (G-2, G-3)', async () => {
    const before = await adminService.listAudit(ADMIN_ID, { page: 1, pageSize: 10 })
    const result = await adminService.commitImport(ADMIN_ID, input())
    const after = await adminService.listAudit(ADMIN_ID, { page: 1, pageSize: 10 })
    expect(after.total - before.total).toBe(1)
    const entry = after.items.find((item) => item.action === 'user.import')
    expect(entry?.note).toBeTruthy()
    expect(entry?.meta?.reason).toBeTruthy()
    for (const credential of result.credentials) {
      expect(JSON.stringify(after.items)).not.toContain(credential.temporaryPassword)
    }
    expect(loadAccountsDb().audit).toHaveLength(0)
  })
})

/* ── WS10 — audit integration ───────────────────────────────────────────── */

describe('WS10 — audit integration', () => {
  it('records one visible entry per mutation with a human label (G-1, G-2)', async () => {
    const created = await createStudent()
    const key = { accountKey: created.account.instituteId, reason: 'Office action.' }
    await adminService.applyAccountOperation(ADMIN_ID, 'suspend', key)
    await adminService.applyAccountOperation(ADMIN_ID, 'reactivate', key)
    await adminService.applyAccountOperation(ADMIN_ID, 'lock', key)
    await adminService.applyAccountOperation(ADMIN_ID, 'unlock', key)
    await adminService.editAccount(ADMIN_ID, { ...key, name: 'Ananya M' })
    await adminService.moveStudentBatch(ADMIN_ID, { ...key, batchId: 'bat-neet-13' })
    await adminService.reissueTemporaryPassword(ADMIN_ID, key)
    await adminService.applyAccountOperation(ADMIN_ID, 'archive', { ...key, acknowledged: true })
    const after = await adminService.listAudit(ADMIN_ID, { page: 1, pageSize: 50 })
    const actions = after.items.map((item) => item.action)
    for (const action of [
      'user.create', 'user.suspend', 'user.reactivate', 'user.lock', 'user.unlock',
      'user.edit', 'user.batch.move', 'user.credential.reissue', 'user.archive',
    ]) {
      expect(actions).toContain(action)
      expect(AUDIT_ACTIONS[action].label).toBeTruthy()
    }
    /* Seeded history also contains a `user.invite` entry; count only the new
       entries written by this test (ids aud-2xxx), never weaken the assertion. */
    const fresh = after.items.filter((item) => Number(item.id.slice(4)) >= 2000)
    expect(fresh).toHaveLength(9)
    expect(fresh.filter((item) => item.action.startsWith('user.'))).toHaveLength(9)
    expect(auditSeed).toHaveLength(20)
  })

  it('no credential ever reaches an audit entry (G-3, A-05)', async () => {
    const created = await createStudent()
    const secret = created.credentials[0].temporaryPassword
    await adminService.reissueTemporaryPassword(ADMIN_ID, { accountKey: created.account.instituteId, reason: 'Lost credential.' })
    const audit = await adminService.listAudit(ADMIN_ID, { page: 1, pageSize: 50 })
    expect(JSON.stringify(audit.items)).not.toContain(secret)
    expect(JSON.stringify(audit.items)).not.toMatch(/temporaryPassword/i)
  })
})

/* ── WS9 — honest downstream workspaces (U-3) ───────────────────────────── */

describe('WS9 — U-3 honest empty workspaces and derived counts', () => {
  it('a new faculty sees their own name and NO demo academic data (H-2, U-3)', async () => {
    const created = await createFaculty({ name: 'New Teacher' })
    const id = created.account.instituteId
    /* BATCH 3.2: an issued identity is valid ONLY with a valid matching
       issued session. The Admin session used to create it is not authorization
       for that faculty's workspace. */
    const facultySession = await authService.login({ email: id, password: created.credentials[0].temporaryPassword })
    useSessionStore.getState().setSession(facultySession)
    const dash = await facultyService.getDashboard(id)
    expect(dash.facultyName).toBe('New Teacher')
    expect(Object.values(dash.stats).every((value) => value === 0)).toBe(true)
    expect(dash.todayClasses).toHaveLength(0)
    expect(dash.pendingDoubts).toHaveLength(0)
    expect(dash.approvals).toHaveLength(0)
    expect((await facultyService.listBankQuestions(id, {})).items).toHaveLength(0)
    expect(await facultyService.listExams(id)).toHaveLength(0)
    expect(await facultyService.listClasses(id)).toHaveLength(0)
    expect(await facultyService.listRecordings(id)).toHaveLength(0)
    expect(await facultyService.listDoubts(id, {})).toHaveLength(0)
    expect((await facultyService.getAttendanceReport(id, {})).rows).toHaveLength(0)
  })

  it('the demo faculty seat keeps all of its fixtures unchanged (U-3, H-2)', async () => {
    /* BATCH 3.2: demo fixtures require the matching demo faculty session. */
    await signInDemoFaculty()
    const dash = await facultyService.getDashboard('fac-snehasish')
    expect(dash.stats.bankQuestions).toBeGreaterThan(0)
    expect((await facultyService.listBankQuestions('fac-snehasish', {})).items.length).toBeGreaterThan(0)
    expect((await facultyService.listExams('fac-snehasish')).length).toBeGreaterThan(0)
  })

  it('a new student sees no demo exams, reports, notifications or academic history (H-5, U-3)', async () => {
    const created = await createStudent()
    const session = await authService.login({ email: created.account.instituteId, password: created.credentials[0].temporaryPassword })
    useSessionStore.getState().setSession(session)
    const id = session.user.id
    expect(await assessmentService.listExams(id)).toHaveLength(0)
    expect(await assessmentService.listAttempts(id)).toHaveLength(0)
    expect(await assessmentService.getLatestReport(id)).toBeNull()
    expect(await studentService.listNotifications(id)).toHaveLength(0)
    expect(await studentService.listDoubts(id)).toHaveLength(0)
    const home = await dashboardService.getStudentHome(id)
    expect(home.announcements).toHaveLength(0)
    expect(home.studyLog).toHaveLength(0)
    expect(home.schedule).toHaveLength(0)
    expect(home.liveNow).toHaveLength(0)
    expect(home.nextTest).toBeNull()
    expect(home.recentAttempts).toHaveLength(0)
    expect(home.student.name).toBe(created.account.name)
  })

  it('the demo student keeps its fixtures unchanged (U-3, H-5)', async () => {
    /* BATCH 3.2: demo fixtures require the matching demo student session. */
    await signInDemoStudent()
    expect((await assessmentService.listExams('stu-ananya')).length).toBeGreaterThan(0)
    expect((await dashboardService.getStudentHome('stu-ananya')).announcements.length).toBeGreaterThan(0)
  })

  it('derives faculty roster, batch counts and dashboard counts from the merged ledger (H-3, H-6, D-4)', async () => {
    const created = await createFaculty({ name: 'Assignable Teacher' })
    const before = await adminService.listAdminBatches()
    await adminService.saveBatchFaculty(ADMIN_ID, 'bat-prayas-m', [...new Set([...(before.find((b) => b.id === 'bat-prayas-m')?.facultyIds ?? []), created.account.instituteId])])
    const batch = await adminService.getAdminBatch(ADMIN_ID, 'bat-prayas-m')
    expect(JSON.stringify(batch)).toContain('Assignable Teacher')

    const createdStudent = await createStudent({ batchId: 'bat-prayas-m' })
    const after = await adminService.listAdminBatches()
    const target = after.find((item) => item.id === 'bat-prayas-m')
    expect(target.studentCount).toBe(149)
    expect((await adminService.getAdminBatch(ADMIN_ID, 'bat-prayas-m')).members.some((member) => member.name === createdStudent.account.name)).toBe(true)
    const dashboard = await adminService.getDashboard(ADMIN_ID)
    expect(dashboard.stats.find((stat) => stat.key === 'students').value).toBe(721)
  })
})
