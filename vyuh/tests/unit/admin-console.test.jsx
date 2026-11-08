import { beforeEach, describe, expect, it, vi } from 'vitest'
import { within } from '@testing-library/react'
import { renderRoute, screen, waitFor } from './helpers.jsx'
import { authService } from '@/services/mock/auth.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { configureInstituteIds } from '@/mock-data/index.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

let session
beforeEach(async () => {
  localStorage.clear()
  useSessionStore.getState().clear()
  /* C1 setup change (Batch 3): Batch 2 ships year:null and student provisioning
     is correctly blocked until the institute supplies its token. This suite's
     CSV commit case now creates real, loginable student accounts, so the token
     is configured here as test fixture data — NOT as institute policy. No
     assertion was removed or weakened; the 720 / 26 / 753 counts are unchanged. */
  configureInstituteIds({ year: '99' })
  session = await authService.login({ email: 'academic.office@vidyutacademy.in', password: 'vyuh2026' })
})

describe('institution console', () => {
  it('opens on the institution overview with figures, calendar and alerts', async () => {
    await renderRoute('/admin', { session })
    expect(await screen.findByRole('heading', { level: 1, name: 'Institution overview' })).toBeTruthy()
    expect(await screen.findByTestId('admin-stats')).toBeTruthy()
    expect(within(screen.getByTestId('admin-stat-students')).getByText('720')).toBeTruthy()
    expect(within(screen.getByTestId('admin-stat-batches')).getByText('5')).toBeTruthy()
    expect(screen.getByTestId('trend-latest').textContent).toMatch(/89\.8%/)
    expect(screen.getByTestId('admin-calendar').children.length).toBeGreaterThan(3)
    expect(screen.getByTestId('admin-alerts').children.length).toBeGreaterThan(3)
  })

  it('filters the account ledger by role and reads the count back', async () => {
    const { user } = await renderRoute('/admin/users', { session })
    await waitFor(() => expect(screen.getAllByTestId('user-row').length).toBe(25))
    await user.selectOptions(screen.getByLabelText('Role'), 'faculty')
    await waitFor(() => expect(screen.getByTestId('users-count').textContent).toMatch(/26 accounts/))
    const rows = screen.getAllByTestId('user-row')
    expect(rows.length).toBe(25)
    expect(rows.every((row) => row.textContent?.includes('Faculty'))).toBe(true)
  })

  it('shows row-level CSV errors before commit, then commits the clean rows', async () => {
    const { user } = await renderRoute('/admin/users/import', { session })
    await user.click(await screen.findByRole('button', { name: /what actually arrives/ }))
    await user.click(screen.getByRole('button', { name: 'Map the columns' }))

    expect(await screen.findByLabelText(/Roll number \(required\)/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Check every row' }))

    await waitFor(() => expect(screen.getByTestId('import-summary').textContent).toMatch(/8 with errors/))
    expect(screen.getByTestId('import-errors-4').textContent).toMatch(/incomplete/i)
    expect(screen.getByTestId('import-errors-6').textContent).toMatch(/No batch is called/i)
    expect(screen.getByRole('button', { name: 'Continue to commit' }).disabled).toBe(true)

    // Fix one row in place: the truncated email on line 4.
    const emailField = screen.getByLabelText('Email row 4')
    await user.clear(emailField)
    await user.type(emailField, 'zoya.kar4004@vidyutacademy.in')
    await waitFor(() => expect(screen.getByTestId('import-summary').textContent).toMatch(/7 with errors/))

    await user.click(screen.getByRole('button', { name: /Skip 7 invalid rows/ }))
    await waitFor(() => expect(screen.getByTestId('import-summary').textContent).toMatch(/0 with errors/))
    await user.click(screen.getByRole('button', { name: 'Continue to commit' }))
    await user.click(screen.getByRole('button', { name: /Commit 4 accounts/ }))

    expect(await screen.findByText(/4 accounts created from office-walkin-roster-oct\.csv/)).toBeTruthy()
    await user.click(screen.getByTestId(/^import-result$/).querySelector('a'))
    await waitFor(() => expect(screen.getByTestId('users-count').textContent).toMatch(/753 accounts/))

    // The import is in the ledger.
    await user.click(screen.getAllByRole('link', { name: /Audit log/ })[0])
    await screen.findByRole('heading', { level: 1, name: 'Audit logs' })
    await waitFor(() => expect(screen.getAllByTestId('audit-row')[0].textContent).toMatch(/CSV import committed/))
  })

  it('states the impact before a policy change and records the change', async () => {
    const { user } = await renderRoute('/admin/policies', { session })
    await screen.findByTestId('policy-list')
    await user.click(screen.getAllByRole('button', { name: 'Change' })[0])

    const dialog = await screen.findByRole('dialog')
    const value = within(dialog).getByLabelText('New value')
    await user.clear(value)
    await user.type(value, '80')

    await waitFor(() =>
      expect(within(dialog).getByTestId('policy-impact').textContent).toMatch(/This affects 5 batches and 632 students\./),
    )
    expect(within(dialog).getByText(/Defaulter lists are recomputed/)).toBeTruthy()

    const apply = within(dialog).getByRole('button', { name: 'Apply policy' })
    await waitFor(() => expect(apply.disabled).toBe(false))
    await user.click(apply)

    await waitFor(() => expect(screen.getByTestId('policy-value-attendance-threshold').textContent).toMatch(/80/))

    await user.click(screen.getAllByRole('link', { name: /Audit log/ })[0])
    await screen.findByRole('heading', { level: 1, name: 'Audit logs' })
    await waitFor(() => expect(screen.getAllByTestId('audit-row')[0].textContent).toMatch(/Policy changed/))
  })

  it('will not return a paper without a note, and returns it with one', async () => {
    const { user } = await renderRoute('/admin/approvals', { session })
    const row = await screen.findByTestId('approval-row-exam-jee-main-11')
    await user.click(within(row).getByRole('button', { name: 'Reject' }))

    const dialog = await screen.findByRole('dialog')
    const confirm = within(dialog).getByRole('button', { name: 'Return the paper' })
    expect(confirm.disabled).toBe(true)
    await user.type(within(dialog).getByLabelText('Why is it being returned?'), 'Two sections exceed the syllabus weighting for this point in the term.')
    await waitFor(() => expect(confirm.disabled).toBe(false))
    await user.click(confirm)

    // The pending tab only shows what is still waiting, so the row leaves it.
    await waitFor(() => expect(screen.queryByTestId('approval-row-exam-jee-main-11')).toBeNull())
    await user.click(screen.getByRole('tab', { name: /All papers/ }))

    const decided = await screen.findByTestId('approval-row-exam-jee-main-11')
    expect(within(decided).getByText('Returned')).toBeTruthy()
    expect(decided.textContent).toMatch(/Two sections exceed the syllabus weighting/)
  })

  it('will not settle an integrity flag without a note', async () => {
    const { user } = await renderRoute('/admin/integrity', { session })
    await screen.findByTestId('integrity-report')
    const firstFlag = screen.getAllByText('Piyush Hota')[0].closest('[data-testid^="flag-"]')
    expect(firstFlag).toBeTruthy()

    await user.click(within(/** @type {HTMLElement} */ (firstFlag)).getByRole('button', { name: /Warn Piyush Hota/ }))
    const dialog = await screen.findByRole('dialog')
    const confirm = within(dialog).getByRole('button', { name: 'Issue the warning' })
    expect(confirm.disabled).toBe(true)

    await user.type(within(dialog).getByLabelText('What is the warning for?'), 'Six window switches in one sitting; first occurrence, guardian informed.')
    await waitFor(() => expect(confirm.disabled).toBe(false))
    await user.click(confirm)

    // The default filter hides decided flags.
    await waitFor(() => expect(screen.queryByText('Piyush Hota')).toBeNull())
    await user.selectOptions(screen.getByLabelText('Show'), 'all')
    const decidedFlag = await screen.findByTestId('flag-int-0601')
    expect(within(decidedFlag).getByTestId(/^flag-status-/).textContent).toMatch(/Warning issued/)
    expect(decidedFlag.textContent).toMatch(/Six window switches in one sitting/)
  })

  it('produces a report preview and downloads the same rows', async () => {
    const { user } = await renderRoute('/admin/reports', { session })
    await screen.findByRole('heading', { level: 1, name: 'Reports' })
    await user.click(screen.getByRole('button', { name: 'Generate report' }))

    await waitFor(() => expect(screen.getByTestId('report-summary').textContent).toMatch(/6 rows/))
    expect(screen.getByText('Aarogyam NEET 2026 — Morning')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Download CSV/ })).toBeTruthy()
  })

  it('assigns faculty to a batch and records it', async () => {
    const { user } = await renderRoute('/admin/batches/bat-prayas-m', { session })
    expect(await screen.findByRole('heading', { level: 1, name: 'Prayas JEE 2027 — Morning' })).toBeTruthy()
    await waitFor(() => expect(screen.getAllByTestId('member-row').length).toBe(25))

    await user.selectOptions(screen.getByLabelText('Add a faculty member'), 'fac-pooja')
    await waitFor(() => expect(screen.getByTestId('batch-faculty').textContent).toMatch(/Pooja Rath/))
    await user.click(screen.getByRole('button', { name: 'Save assignment' }))

    await waitFor(() => expect(screen.getByText('Faculty saved')).toBeTruthy())
    expect(screen.getByTestId('batch-faculty').textContent).toMatch(/Pooja Rath/)

    await user.click(screen.getAllByRole('link', { name: /Audit log/ })[0])
    await screen.findByRole('heading', { level: 1, name: 'Audit logs' })
    await waitFor(() => expect(screen.getAllByTestId('audit-row')[0].textContent).toMatch(/Faculty assignment changed/))
  })
})
