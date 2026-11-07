import { test, expect } from '@playwright/test'

const demoPassword = 'vyuh2026'

async function loginAsAdmin(page) {
  await page.getByLabel('Email address').fill('academic.office@vidyutacademy.in')
  await page.getByLabel('Password', { exact: true }).fill(demoPassword)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('navigation', { name: 'Academic office' })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await loginAsAdmin(page)
})

test('every console destination renders its own screen', async ({ page }) => {
  const rail = page.getByRole('navigation', { name: 'Academic office' })
  const destinations = [
    ['Overview', /\/admin$/, 'Institution overview'],
    ['Users', /\/admin\/users$/, 'User management'],
    ['Batches', /\/admin\/batches$/, 'Batches and courses'],
    ['Approvals', /\/admin\/approvals$/, 'Exam approval queue'],
    ['Policies', /\/admin\/policies$/, 'Policies'],
    ['Integrity', /\/admin\/integrity$/, 'Integrity reports'],
    ['Reports', /\/admin\/reports$/, 'Reports'],
    ['Moderation', /\/admin\/moderation$/, 'Content moderation'],
    ['Audit log', /\/admin\/audit$/, 'Audit logs'],
    ['Settings', /\/admin\/settings$/, 'Branding and settings'],
  ]
  for (const [nav, url, heading] of destinations) {
    await rail.getByRole('link', { name: nav, exact: true }).first().click()
    await expect(page).toHaveURL(url)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  }
})

test('the import wizard shows every bad row before it writes anything', async ({ page }) => {
  await page.goto('/admin/users/import')

  // The deliberately broken sample: renamed headers, blank name, truncated email,
  // duplicate roll, unknown batch, a date that does not exist, and a bad role.
  await page.getByRole('button', { name: /Sample · what actually arrives/ }).click()
  await expect(page.getByText(/data rows/)).toBeVisible()

  await page.getByRole('button', { name: 'Map the columns' }).click()
  await expect(page.getByLabel('Full name (required)')).toBeVisible()
  await page.getByRole('button', { name: 'Check every row' }).click()

  await expect(page.getByTestId('import-summary')).toBeVisible()
  await expect(page.getByText(/cannot be committed yet/)).toBeVisible()
  // Row-level errors are attached to the row that produced them.
  await expect(page.getByTestId('import-errors-3')).toBeVisible()
  await expect(page.getByTestId('import-errors-5')).toBeVisible()

  // Nothing can move on while a row is still invalid.
  await expect(page.getByRole('button', { name: 'Continue to commit' })).toBeDisabled()
  await page.getByRole('button', { name: /^Skip \d+ invalid rows?$/ }).click()

  const commit = page.getByRole('button', { name: /^Commit \d+ accounts?$/ })
  await expect(commit).toBeEnabled()
  await commit.click()

  await expect(page.getByTestId('import-result')).toBeVisible()
  await expect(page.getByText(/\d+ accounts? created from office-walkin-roster-oct\.csv/)).toBeVisible()

  // The commit lands in the ledger with its row counts.
  await page.goto('/admin/audit')
  await expect(page.getByTestId('audit-row').first()).toContainText(/CSV import committed/)
})

test('a policy change states its impact, then appears in the audit ledger', async ({ page }) => {
  await page.goto('/admin/policies')
  const section = page.getByRole('heading', { level: 2, name: 'Attendance threshold' }).locator('xpath=ancestor::section[1]')
  await section.getByRole('button', { name: 'Change' }).click()

  const dialog = page.getByRole('dialog', { name: 'Change attendance threshold?' })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('New value').fill('80')

  const impact = page.getByTestId('policy-impact')
  await expect(impact).toContainText(/This affects \d+ batches and \d+ students\./)

  await dialog.getByRole('button', { name: 'Apply policy' }).click()
  await expect(page.getByTestId('policy-value-attendance-threshold')).toHaveText(/80/)

  await page.goto('/admin/audit')
  await page.getByLabel('Action').selectOption('policy.update')
  await expect(page.getByTestId('audit-row').first()).toContainText(/Attendance threshold/)
  await expect(page.getByTestId('audit-row').first()).toContainText(/80/)
})

test('an integrity decision cannot be saved without a note', async ({ page }) => {
  await page.goto('/admin/integrity')

  const flag = page.getByTestId('flag-int-0601')
  await flag.getByRole('button', { name: /^Warn / }).click()

  const dialog = page.getByRole('dialog')
  const save = dialog.getByRole('button', { name: 'Issue the warning' })
  await expect(save).toBeDisabled()

  await dialog.getByRole('textbox').fill('Six window switches in one sitting, after two written reminders.')
  await expect(save).toBeEnabled()
  await save.click()

  // The default filter only shows what still needs a decision.
  await page.getByLabel('Show').selectOption('all')
  await expect(page.getByTestId('flag-int-0601')).toBeVisible()
  await expect(page.getByTestId('flag-status-int-0601')).toContainText('Warning issued')

  await page.goto('/admin/audit')
  await expect(page.getByTestId('audit-row').first()).toContainText(/Warning issued/)
})

test('user search narrows the roster and clearing restores it', async ({ page }) => {
  await page.goto('/admin/users')
  await expect(page.getByText(/\d+ accounts match/)).toBeVisible()

  await page.getByLabel('Search accounts').fill('Snehasish')
  await expect(page.getByText('Snehasish Mohapatra').first()).toBeVisible()
  await expect(page.getByText('1 accounts match')).toBeVisible()

  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByLabel('Search accounts')).toHaveValue('')
})

test('a batch opens on its members, subjects and faculty', async ({ page }) => {
  await page.goto('/admin/batches')
  await page.getByTestId('batch-row-bat-prayas-m').click()

  await expect(page).toHaveURL(/\/admin\/batches\/bat-prayas-m$/)
  await expect(page.getByTestId('member-count')).toContainText('149')
  await expect(page.getByTestId('member-row').first()).toBeVisible()
  await expect(page.getByTestId('batch-subjects')).toBeVisible()
  await expect(page.getByTestId('batch-faculty')).toBeVisible()
})
