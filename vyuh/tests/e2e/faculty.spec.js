import { test, expect } from '@playwright/test'

const demoPassword = 'vyuh2026'

async function loginAsFaculty(page) {
  await page.getByLabel('Email address').fill('snehasish@vidyutacademy.in')
  await page.getByLabel('Password', { exact: true }).fill(demoPassword)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/faculty$/)
  await expect(page.getByRole('navigation', { name: 'Faculty workspace' })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await loginAsFaculty(page)
})

test('every faculty destination renders its own screen', async ({ page }) => {
  const destinations = [
    ['Question bank', /\/faculty\/bank$/, 'Question bank'],
    ['Exams', /\/faculty\/exams$/, 'Exams'],
    ['Item analysis', /\/faculty\/analysis/, 'Cohort & item analysis'],
    ['Classes', /\/faculty\/classes$/, 'Class scheduler'],
    ['Recordings', /\/faculty\/recordings$/, 'Recordings'],
    ['Attendance', /\/faculty\/attendance$/, 'Attendance reports'],
    ['Doubts', /\/faculty\/doubts$/, 'Doubt inbox'],
  ]
  for (const [nav, url, heading] of destinations) {
    await page.getByRole('navigation', { name: 'Faculty workspace' }).getByRole('link', { name: nav, exact: true }).first().click()
    await expect(page).toHaveURL(url)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  }
})

test('a written question reaches the bank and a paper palette', async ({ page }) => {
  await page.goto('/faculty/bank/new')
  await page.getByLabel('Question', { exact: true }).fill('A uniform disc of mass $M$ rotates about its centre. Its moment of inertia is')
  await page.getByLabel('Option A').fill('$\\frac{1}{2}MR^2$')
  await page.getByLabel('Option B').fill('$MR^2$')
  await page.getByLabel('Option C').fill('$\\frac{2}{5}MR^2$')
  await page.getByLabel('Option D').fill('$\\frac{3}{2}MR^2$')
  await page.getByLabel('A correct').check()
  await page.getByLabel('Explanation').fill('A disc concentrates its mass nearer the axis than a ring, so the factor is one half.')
  await page.getByRole('button', { name: 'Save to bank' }).click()

  await expect(page).toHaveURL(/\/faculty\/bank$/)
  const row = page.getByTestId(/bank-row-/).filter({ hasText: 'uniform disc of mass' }).first()
  await expect(row).toBeVisible()
  const rowId = (await row.getAttribute('data-testid'))?.replace('bank-row-', '')

  await row.click()
  await page.getByRole('button', { name: 'Add to exam' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add this question to a paper' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Add to paper' }).click()
  await expect(page.getByText('Added to the paper')).toBeVisible()

  await page.goto('/faculty/exams/exam-neet-mock-08')
  const palette = page.getByTestId('palette-preview')
  await expect(palette.locator(`[data-question-id="${rowId}"]`)).toBeVisible()
})

test('the monitor wall changes as mock events arrive', async ({ page }) => {
  await page.goto('/faculty/exams/exam-neet-mock-07/monitor')
  await expect(page.getByTestId('monitor-counts')).toBeVisible()
  const answers = page.getByTestId('monitor-answers')
  const before = Number(await answers.textContent())
  await expect
    .poll(async () => Number(await answers.textContent()), { timeout: 15_000 })
    .toBeGreaterThan(before)
  await expect(page.getByTestId('monitor-feed')).toBeVisible()
})

test('marking an item faulty recalculates the scores students see', async ({ page }) => {
  await page.goto('/faculty/analysis?exam=exam-neet-practice')
  const ledger = page.getByTestId('item-ledger')
  await expect(ledger).toBeVisible()
  await ledger.getByRole('button', { name: /Faulty/ }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Mark this question faulty?' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Mark as faulty' }).click()
  await expect(page.getByText('1 item voided')).toBeVisible()
  await expect(page.getByTestId('score-policy')).toContainText('candidates move')

  // The candidate's own sheet reads the same register: 156 becomes 157.
  await page.evaluate(() => localStorage.removeItem('vyuh.session'))
  await page.goto('/login')
  await page.getByLabel('Email address').fill('ananya.sahoo@vidyutacademy.in')
  await page.getByLabel('Password', { exact: true }).fill(demoPassword)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.goto('/student/exams/exam-neet-practice/result')
  await expect(page.getByTestId('score-hero')).toHaveAttribute('aria-label', 'Score 157 out of 240')
})

test('destructive actions ask first', async ({ page }) => {
  await page.goto('/faculty/classes')
  await page.getByRole('button', { name: 'Cancel' }).first().click()
  await expect(page.getByRole('dialog', { name: 'Cancel this session?' })).toBeVisible()
  await page.getByRole('button', { name: 'Keep it' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await page.goto('/faculty/bank')
  await page.getByRole('button', { name: 'Delete' }).first().click()
  await expect(page.getByRole('dialog', { name: 'Delete this question?' })).toBeVisible()
  await page.getByRole('button', { name: 'Keep it' }).click()
})

test('the attendance export downloads the rows on screen', async ({ page }) => {
  await page.goto('/faculty/attendance')
  await expect(page.getByTestId('attendance-table')).toBeVisible()
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export CSV' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^attendance-.*\.csv$/)
})
