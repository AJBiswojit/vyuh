import { beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  ACCOUNTS_STORAGE_KEY, ACCOUNT_STATUSES, INSTITUTE_ID_FORMATS, credentialPolicy,
  initialAccountsDb, loadAccountsDb, saveAccountsDb, configureInstituteIds, instituteIdConfig,
  parseInstituteId, isInstituteId, highestExistingSuffix, issueInstituteId,
  listAccounts, accountByIdentifier, transitionAccountStatus, appendAccountAudit,
  generateTemporaryPassword, isPolicyTemporaryPassword,
} from '@/mock-data/accounts.js'
import { DEMO_PASSWORD, users } from '@/mock-data/index.js'
import { INSTITUTE_ID_PATTERNS } from '@/services/authSchemas.js'

const source = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')

beforeEach(() => { localStorage.clear() })

describe('Batch 2 account registry', () => {
  it('initialises with the four seeded demo fixtures and no secrets', () => {
    const db = initialAccountsDb()
    expect(Object.keys(db.accounts)).toHaveLength(Object.keys(users).length)
    expect(db.issuedInstituteIds).toEqual([])
    expect(db.audit).toEqual([])
    expect(instituteIdConfig().year).toBeNull()
    for (const record of Object.values(db.accounts)) {
      expect(record.status).toBe('active')
      expect(record.mustChangePassword).toBe(false)
      expect(record.instituteId).toBeNull()
      expect(record.source).toBe('demo_fixture')
    }
    const serialised = JSON.stringify(db)
    expect(serialised).not.toContain(DEMO_PASSWORD)
    expect(serialised).not.toMatch(/passwordHash|salt|temporaryPassword"/)
  })

  it('is an additive migration that never deletes existing storage keys', () => {
    localStorage.setItem('vyuh.mock.auth.v1', JSON.stringify({ accounts: {}, sentinel: 'kept' }))
    localStorage.setItem('vyuh.session', JSON.stringify({ version: 1, state: { session: null }, sentinel: 'kept' }))
    const db = loadAccountsDb()
    expect(JSON.parse(localStorage.getItem('vyuh.mock.auth.v1')).sentinel).toBe('kept')
    expect(JSON.parse(localStorage.getItem('vyuh.session')).sentinel).toBe('kept')
    expect(db.version).toBe(1)
    /* A corrupt registry degrades to the seeded fixtures rather than throwing. */
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, '{bad json')
    expect(Object.keys(loadAccountsDb().accounts)).toHaveLength(4)
  })

  it('uses the approved shapes: VYU-S-YY-NNNN, VYU-F-NNNN and VYU-A-NNN (3 digits)', () => {
    /* Drift guard: registry issuance and validation-layer patterns must agree
       without mock-data importing services (architecture boundary). */
    for (const role of ['student', 'faculty', 'admin']) {
      expect(INSTITUTE_ID_FORMATS[role].pattern.source).toBe(INSTITUTE_ID_PATTERNS[role].source)
    }
    expect(INSTITUTE_ID_FORMATS.admin.width).toBe(3)
    const faculty = issueInstituteId('faculty', initialAccountsDb())
    expect(faculty.ok).toBe(true)
    expect(faculty.instituteId).toBe('VYU-F-0043')
    const admin = issueInstituteId('admin', initialAccountsDb())
    expect(admin.ok).toBe(true)
    expect(admin.instituteId).toBe('VYU-A-002')
    expect(parseInstituteId(admin.instituteId)).toMatchObject({ role: 'admin', year: null, suffix: 2 })
    expect(isInstituteId('vyu-a-002')).toBe(true)
    expect(isInstituteId('VYU-A-0002')).toBe(false)
  })

  it('requires an institute-supplied student year token instead of deriving one from Date', () => {
    const db = initialAccountsDb()
    const missing = issueInstituteId('student', db)
    expect(missing.ok).toBe(false)
    expect(missing.code).toBe('institute_year_not_configured')
    expect(missing.db.issuedInstituteIds).toEqual([])
    expect(db.config.year).toBeNull()
    /* Test-only value: NOT institute policy. The product never invents a year. */
    configureInstituteIds({ year: '99' })
    const configured = issueInstituteId('student', loadAccountsDb())
    expect(configured.ok).toBe(true)
    expect(configured.instituteId).toBe('VYU-S-99-0232')
    expect(parseInstituteId(configured.instituteId)).toMatchObject({ role: 'student', year: '99', suffix: 232 })
    expect(source('src/mock-data/accounts.js')).not.toMatch(/new Date\(\).*getFullYear|Date\.now\(\).*year/i)
  })

  it('reconciles counters with existing fixtures and the permanent issued-ID ledger', () => {
    const db = initialAccountsDb()
    db.accounts['legacy'] = { key: 'legacy', instituteId: 'VYU-F-0999', role: 'faculty', status: 'active' }
    db.issuedInstituteIds = ['VYU-F-0100', 'VYU-F-0101']
    expect(highestExistingSuffix('faculty', db)).toBe(999)
    const next = issueInstituteId('faculty', db)
    expect(next.ok).toBe(true)
    expect(next.instituteId).toBe('VYU-F-1000')
    expect(next.db.counters.faculty).toBe(1000)
    expect(next.db.issuedInstituteIds).toContain('VYU-F-1000')
  })

  it('advances past previously issued IDs and never reuses them on suspend or archive', () => {
    const db = initialAccountsDb()
    db.issuedInstituteIds = ['VYU-F-0043', 'VYU-F-0044']
    saveAccountsDb(db)
    const allocated = issueInstituteId('faculty', loadAccountsDb())
    expect(allocated.ok).toBe(true)
    expect(allocated.instituteId).toBe('VYU-F-0045')
    let registry = saveAccountsDb(allocated.db)
    registry = saveAccountsDb({
      ...registry,
      accounts: { ...registry.accounts, [allocated.instituteId]: { key: allocated.instituteId, instituteId: allocated.instituteId, status: 'active', role: 'faculty' } },
    })
    const suspended = transitionAccountStatus(allocated.instituteId, 'suspended', registry)
    expect(suspended.ok).toBe(true)
    const archived = transitionAccountStatus(allocated.instituteId, 'archived', suspended.db)
    expect(archived.ok).toBe(true)
    expect(archived.db.issuedInstituteIds).toContain(allocated.instituteId)
    expect(accountByIdentifier(allocated.instituteId, archived.db).status).toBe('archived')
    const afterArchive = issueInstituteId('faculty', archived.db)
    expect(afterArchive.instituteId).toBe('VYU-F-0046')
    expect(afterArchive.db.counters.faculty).toBeGreaterThan(allocated.db.counters.faculty)
  })

  it('never decrements counters and hard-fails instead of wrapping an exhausted range', () => {
    const db = initialAccountsDb()
    db.issuedInstituteIds = ['VYU-A-999']
    db.accounts['last'] = { key: 'last', instituteId: 'VYU-A-999', status: 'active', role: 'admin' }
    const result = issueInstituteId('admin', db)
    expect(result.ok).toBe(false)
    expect(result.code).toBe('institute_id_range_exhausted')
    expect(result.db.issuedInstituteIds).toEqual(['VYU-A-999'])
    configureInstituteIds({ seeds: { faculty: 500 } })
    expect(instituteIdConfig().seeds.faculty).toBe(500)
    configureInstituteIds({ seeds: { faculty: 10 } })
    expect(loadAccountsDb().counters.faculty).toBe(500)
    expect(instituteIdConfig().seeds.faculty).toBe(10)
  })

  it('validates explicit account state transitions and rejects invalid ones', () => {
    const db = initialAccountsDb()
    saveAccountsDb(db)
    const key = 'ananya.sahoo@vidyutacademy.in'
    expect(ACCOUNT_STATUSES).toEqual(['active', 'invited', 'suspended', 'locked', 'archived'])
    expect(transitionAccountStatus(key, 'invited', db).ok).toBe(false)
    expect(transitionAccountStatus(key, 'unknown', db).ok).toBe(false)
    expect(transitionAccountStatus('nobody@example.com', 'suspended', db).code).toBe('account_not_found')
    const locked = transitionAccountStatus(key, 'locked', loadAccountsDb())
    expect(locked.ok).toBe(true)
    expect(transitionAccountStatus(key, 'active', locked.db).ok).toBe(true)
    const archived = transitionAccountStatus(key, 'archived', loadAccountsDb())
    expect(archived.ok).toBe(true)
    expect(transitionAccountStatus(key, 'active', archived.db).code).toBe('invalid_status_transition')
  })

  it('generates 12-character passwords from the approved alphabet with no confusing characters', () => {
    expect(credentialPolicy.length).toBe(12)
    expect(credentialPolicy.excludedCharacters).toEqual(['0', 'O', '1', 'I', 'l'])
    expect(credentialPolicy.alphabet).toBe('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789')
    expect(credentialPolicy.expiresByTime).toBe(false)
    const seen = new Set()
    for (let index = 0; index < 200; index += 1) {
      const value = generateTemporaryPassword()
      expect(isPolicyTemporaryPassword(value)).toBe(true)
      seen.add(value)
    }
    expect(seen.size).toBeGreaterThan(190)
    /* Injectable deterministic generator is TEST ONLY, never used by the product.
       Alternating letter/digit bytes keeps the candidate on-policy. */
    const deterministic = (buffer) => { for (let index = 0; index < buffer.length; index += 1) buffer[index] = index % 2 === 0 ? 7 : 55; return true }
    const stable = generateTemporaryPassword(deterministic)
    expect(stable).toBe(generateTemporaryPassword(deterministic))
    expect(isPolicyTemporaryPassword(stable)).toBe(true)
  })

  it('keeps normal account-list responses free of credentials and separate identifiers', () => {
    const db = initialAccountsDb()
    db.accounts['issued'] = {
      key: 'VYU-F-0043', id: 'VYU-F-0043', instituteId: 'VYU-F-0043', role: 'faculty',
      name: 'Test Faculty', email: 'issued@example.com', initials: 'TF', status: 'active',
      mustChangePassword: true, temporaryPasswordIssuedAt: '2026-11-08T00:00:00.000Z',
      acknowledgedPolicyVersion: null, credentialDelivery: 'pending', createdAt: '2026-11-08',
      statusChangedAt: null, source: 'institute_issued', rollNumber: 'VY-25-0187',
      instituteCode: 'VYUH2026', batchId: null, batchName: null,
      /* An accidental credential on the raw record must not survive projection. */
      passwordHash: 'should-not-leak', salt: 'should-not-leak',
    }
    const listed = listAccounts(db)
    const issued = listed.find((row) => row.instituteId === 'VYU-F-0043')
    expect(issued).toBeTruthy()
    expect(issued.passwordHash).toBeUndefined()
    expect(issued.salt).toBeUndefined()
    expect(issued.rollNumber).toBe('VY-25-0187')
    expect(issued.instituteCode).toBe('VYUH2026')
    expect(issued.instituteId).not.toBe(issued.rollNumber)
    expect(JSON.stringify(listed)).not.toContain('should-not-leak')
  })

  it('records credential-free audit metadata and requires a reason for recovery decisions', () => {
    const secret = 'TmP9xQ2vRb4a'
    const created = appendAccountAudit({
      actorId: 'adm-pratibha', target: 'VYU-F-0043', action: 'issue_temporary_password',
      reason: 'Identity verified at the academic office desk.', temporaryPassword: secret,
    })
    expect(created.ok).toBe(true)
    expect(Object.keys(created.entry).sort()).toEqual(['action', 'actorId', 'at', 'id', 'reason', 'target'])
    expect(appendAccountAudit({ actorId: 'x', target: 'y', action: 'z', reason: '' }).code).toBe('audit_reason_required')
    expect(JSON.stringify(loadAccountsDb().audit)).not.toContain(secret)
    expect(JSON.stringify(loadAccountsDb().audit)).not.toContain('temporaryPassword')
  })

  it('defines no password-retrieval API and no permanent plaintext field', () => {
    for (const path of [
      'src/services/mock/auth.js', 'src/services/types.js', 'src/services/AuthService.js',
      'src/mock-data/accounts.js', 'src/contracts/auth.js',
    ]) {
      /* Strip prose first: a comment stating that no API exists is not an API. */
      const code = source(path).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1')
      expect(code).not.toMatch(/revealPassword|getPlaintext|retrievePassword|plaintextPassword\s*:/)
    }
    expect(source('src/mock-data/accounts.js')).toMatch(/NOT a password KDF|not production-grade/i)
  })
})
