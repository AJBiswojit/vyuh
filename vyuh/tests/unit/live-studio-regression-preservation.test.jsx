import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute, screen, waitFor } from './helpers.jsx'
import { V2_ROUTE_MATRIX, V2_ROUTE_ALIASES } from '../../src/app/routes/v2RouteTable.js'
import { signInDemoFaculty, signInDemoStudent, signOut } from '../helpers/workspaceIdentity.js'
import { SESSION_STORAGE_KEY, sessionStateStorage } from '../../src/shared/lib/sessionPersistence.js'
import { resetSession, storageKeyFor } from '../../src/services/mock/liveSessionState.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

const ROOT = process.cwd()

/** The 19 protected file hashes recorded at the start of this implementation. */
const PROTECTED = {
  'src/mock-data/accounts.js': 'd02465726586a2156d62f3da1a1c578aaa7ef7aa1e590a3050fa3850654fc30b',
  'src/mock-data/users.js': '57d4fe11d657af8782f3dec76f9984f4814bbbb6717ca65a2a9894fca4e58541',
  'src/mock-data/institution.js': 'a7db65f74b0661842f366db64b91fa0aaf339951c7400380554c513670b763d6',
  'src/mock-data/batches.js': 'f788603cc42d92ef4fe150de0eec9c78729f9d7f8fffcf7d5ec7ee9eb9c7573d',
  'src/mock-data/batchesAdmin.js': '5c0169e32fea83003d2fdcad445d34370f8f9c4fd50ea9981724a178c67c4ef5',
  'src/app/routes/v2RouteTable.js': '98e9fee47099c919b3f72c4414f657798e5e1565358fb713da3279832855e257',
  'src/app/routes/v2Aliases.jsx': '01a0067b801070c25484d0ed24b81dd9eb2ae0aba748667eea801502eca97200',
  'src/app/routes/AppRoutes.jsx': '6d923c4c91d03a33c1777b42c0d671019a858b9e752d476d576deef29b7b11e2',
  'src/app/routes/guards.jsx': '4a25675f104e5dcf5d22e669c2a64989838566797085f4f86d9dbf63d4f1313a',
  'src/features/auth/pages/SetupAccountPage.jsx': 'b5ad26f7b1bcae14e61f623d43f3e56c197e61cab04c266efab79c81b5407a21',
  'src/app/layouts/AdminLayout.jsx': 'a826bbb23f2fe8d3f3f09a498d4e2f601f87582251912dc15652e97bd13c14dd',
  'src/services/api/schemas.js': 'a2537456f06a14148d58cf72c5ab86c464f2cbd44f6bf377a4687a2b38089c6d',
  'src/shared/lib/roles.js': 'ebbb7f8410c4361dec68f5d3530ebb94f910740507a5e6402dfe18a17ea8a7ea',
  'src/shared/lib/sessionPersistence.js': 'ad12aee4f8abc61ac01ced6f08e11657228a8e4d837fa9f97d995c0bdfe66800',
  'src/shared/store/sessionStore.js': '255a88781f75443c62e594293d02f54479c0f07cadcef2979ba716151bc6d317',
  'src/styles/tokens.css': '4bb2402587e147181709246dfacb87ffc94c7f1a8513719bd7d8e680c1875072',
  'scripts/check-architecture.mjs': '8834bc9f89cc1a560db871d97134867188ec9f378374c9f5c500a2786e1eaca6',
  'package.json': '286b2f0b98d3542813afe7b91ec280391f7d413e3d4492eda448d68f5fe8be69',
  'package-lock.json': 'cb8531dbf6900041047fed16a54155aedea660f963f698babe21133ef854fc4e',
}

function sha(path) {
  return createHash('sha256').update(readFileSync(resolve(ROOT, path))).digest('hex')
}

describe('VYUH LIVE STUDIO — preservation regression', () => {
  beforeEach(() => {
    signOut()
    sessionStateStorage.removeItem(SESSION_STORAGE_KEY)
    localStorage.removeItem(SESSION_STORAGE_KEY)
    resetSession('ses-rot-b')
    localStorage.removeItem(storageKeyFor('ses-rot-b'))
  })

  it('keeps all 19 protected files byte-identical', () => {
    for (const [path, expected] of Object.entries(PROTECTED)) {
      expect(sha(path), path).toBe(expected)
    }
  })

  it('keeps all 33 V2 aliases across 3 namespaces (11/12/10)', () => {
    expect(V2_ROUTE_MATRIX).toHaveLength(33)
    expect(Object.keys(V2_ROUTE_ALIASES)).toHaveLength(3)
    expect(V2_ROUTE_ALIASES.student).toHaveLength(11)
    expect(V2_ROUTE_ALIASES.faculty).toHaveLength(12)
    expect(V2_ROUTE_ALIASES.admin).toHaveLength(10)
  })

  it('keeps the 11 historical VYUH reports and adds no new report', () => {
    const reports = readdirSync(ROOT).filter((name) => /^VYUH_.*\.md$/.test(name))
    expect(reports).toHaveLength(11)
    expect(reports.some((name) => name.includes('LIVE_STUDIO'))).toBe(false)
  })

  it('does not modify the identity gate, auth bootstrap, theme provider or app shell', () => {
    const untouched = {
      'src/services/mock/ownWorkspace.js': '5352aec0f6f7484d023120d5cc9c0e7859636288ec473055028bf4f80a390613',
      'src/features/auth/hooks/useSession.js': 'aaa0992d2f6c324a0e406a057f259030eff1469838d0ff8c4ab11ee47df73aeb',
      'src/app/providers/ThemeProvider.jsx': '664823a70d2e37644d1e718662dca91d7c0e78ac953d62c2cd891e807ed13f0f',
      'src/app/providers/AppProviders.jsx': '5846e581a35992fe056418f1520605a397fd689385b499af34e975b246f4c657',
      'src/main.jsx': 'fe04006959e8c5fa9e2ccd9e80a18ff96f6a95fac7e01e4b2f9c227c8b9a2b42',
      'src/index.css': '79d35c4879d9ae28defecc8b89207b9b35591156628a6b00a19712b9bbcc37d2',
    }
    for (const [path, expected] of Object.entries(untouched)) {
      expect(sha(path), path).toBe(expected)
    }
    for (const path of ['package.json', 'package-lock.json', 'src/styles/tokens.css']) {
      expect(sha(path), path).toBe(PROTECTED[path])
    }
  })

  it('still renders every existing Faculty live-class capability, with advanced tools behind More options', async () => {
    const session = await signInDemoFaculty()
    const { user } = await renderRoute('/faculty/classes/ses-rot-b/host', { session })
    await waitFor(() => expect(screen.getByTestId('faculty-live-studio')).toBeTruthy())
    // One obvious action to begin teaching, in plain language.
    expect(screen.getByRole('button', { name: 'Start class' })).toBeTruthy()
    // Level 1 quick actions for presentation and the whiteboard.
    expect(screen.getByRole('button', { name: /Share presentation/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Open whiteboard/ })).toBeTruthy()
    expect(screen.getAllByText(/Live|Faculty Live Studio/).length).toBeGreaterThan(0)
    // Level 2 — Teaching tools: the class roster is one click away.
    await user.click(screen.getByRole('tab', { name: /Students/ }))
    expect(screen.getByText('Presence')).toBeTruthy()
    expect(screen.getByText('In the room')).toBeTruthy()
    // Level 3 — More options: attendance, attention, moderation and records.
    await user.click(screen.getByRole('button', { name: /More options/ }))
    expect(await screen.findByRole('dialog', { name: 'More options' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Attendance' })).toBeTruthy()
    expect(screen.getByText('Chat', { selector: 'h3' })).toBeTruthy()
    expect(screen.getByText('Waiting on you')).toBeTruthy()
  })

  it('still renders every existing Student live-class capability', async () => {
    const session = await signInDemoStudent()
    await renderRoute('/student/live/ses-rot-b', { session })
    await waitFor(() => expect(screen.getByTestId('live-presence')).toBeTruthy())
    expect(screen.getByRole('log', { name: 'Class chat' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /Questions/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mic off' })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Leave class' }).length).toBeGreaterThan(0)
    await waitFor(() => expect(screen.getByTestId('student-classroom')).toBeTruthy())
    expect(screen.getByTestId('teaching-stage')).toBeTruthy()
  })

  it('reports an honest unavailable Studio state for a non-canonical id', async () => {
    const session = await signInDemoFaculty()
    await renderRoute('/faculty/classes/cls-optics-2/host', { session })
    await waitFor(() => expect(screen.getByText('Live Studio is not available for this session')).toBeTruthy())
    expect(screen.getByRole('button', { name: 'Start class' })).toBeTruthy()
  })
})
