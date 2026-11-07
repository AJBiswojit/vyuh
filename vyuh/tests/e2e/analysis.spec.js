import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const axeSource = readFileSync(fileURLToPath(new URL('../../node_modules/axe-core/axe.min.js', import.meta.url)), 'utf8')
const EXAM = 'exam-neet-practice'
const RESULT = `/student/exams/${EXAM}/result`

async function expectAccessible(page) {
  await page.addScriptTag({ content: axeSource })
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })
    return result.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) }))
  })
  expect(violations).toEqual([])
}

async function loginStudent(page) {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Quick demo login as Student' }).click()
  await expect(page).toHaveURL(/\/student$/)
}

/** @param {import('@playwright/test').Page} page */
async function openResult(page) {
  await loginStudent(page)
  await page.goto(RESULT)
  await expect(page.getByTestId('result-summary')).toBeVisible()
  await expect(page.getByTestId('score-hero')).toHaveAttribute('aria-label', 'Score 156 out of 240')
}

/** @param {import('@playwright/test').Page} page @param {{ count?: number, duration?: number }} [options] */
async function enterHall(page, options = {}) {
  await loginStudent(page)
  await page.evaluate(({ count, duration }) => {
    if (count) localStorage.setItem('vyuh.mock.examQuestionCount', String(count))
    if (duration) localStorage.setItem('vyuh.mock.examDurationSeconds', String(duration))
  }, options)
  await page.goto(`/student/exams/${EXAM}`)
  await page.getByRole('button', { name: 'Read instructions' }).click()
  await page.getByRole('button', { name: 'Run checks' }).click()
  await expect(page.getByTestId('system-checks')).toBeVisible()
  await page.getByLabel('I accept the declaration').check()
  await page.getByRole('button', { name: 'Enter exam hall' }).click()
  await expect(page.getByTestId('exam-timer')).toBeVisible()
}

test('published result sheet filters, drawer focus and chart tables are accessible', async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 1280, height: 900 })
  await openResult(page)
  await page.waitForTimeout(2200)
  await expectAccessible(page)

  const filters = ['all', 'correct', 'wrong', 'skipped', 'confident', 'lucky']
  for (const filter of filters) {
    const chip = page.getByTestId(`filter-${filter}`)
    const count = Number(await chip.locator('[data-count]').textContent())
    await chip.click()
    await expect(page.locator('[data-testid^="question-row-"]')).toHaveCount(count)
  }
  await page.getByTestId('filter-all').click()
  const row = page.getByTestId('question-row-3')
  await row.focus()
  await page.keyboard.press('Enter')
  const drawer = page.getByRole('dialog', { name: 'Question 3 analysis' })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByText('Official explanation')).toBeVisible()
  await expectAccessible(page)
  await page.keyboard.press('Escape')
  await expect(drawer).not.toBeVisible()
  await expect(row).toBeFocused()

  for (const title of ['Time per question', 'Question visit replay', 'Why marks leaked', 'Section and topic heatmap', 'Historical score trend']) {
    const card = page.locator('section').filter({ has: page.getByRole('heading', { name: title, exact: true }) }).first()
    await card.getByRole('button', { name: 'View as table' }).click()
    await expect(card.locator('table')).toBeVisible()
    expect(await card.locator('tbody tr').count()).toBeGreaterThan(0)
  }
})

test('what-if removes negative marking and revision link returns to the sheet', async ({ page }) => {
  await openResult(page)
  await expect(page.getByTestId('what-if-score')).toContainText('156')
  await page.getByLabel('Remove negative marking').check()
  await expect(page.getByTestId('what-if-score')).toContainText('168')
  await page.getByLabel('Remove negative marking').uncheck()
  await expect(page.getByTestId('what-if-score')).toContainText('156')

  await page.getByTestId('question-row-1').click()
  await page.getByRole('link', { name: 'Revise this topic' }).click()
  await expect(page).toHaveURL(/\/student\/revision\/ch-rot/)
  await expect(page.getByRole('heading', { name: 'Rotational Motion', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: 'Back to result' }).click()
  await expect(page.getByTestId('result-summary')).toBeVisible()
})

test('unreleased results show a countdown and the plain-words rule', async ({ page }) => {
  await loginStudent(page)
  await page.evaluate(() => {
    localStorage.setItem('vyuh.mock.analysisLocked', 'true')
    localStorage.setItem('vyuh.mock.analysisReleaseInSeconds', '120')
  })
  await page.goto(RESULT)
  await expect(page.getByTestId('release-lock')).toBeVisible()
  await expect(page.getByTestId('release-countdown')).toHaveText(/0?1:\d{2}|02:00/)
  await expect(page.getByText('Results unlock after the paper window closes and the academic office publishes the verified answer key.')).toBeVisible()
  await expect(page.getByTestId('question-ledger')).not.toBeVisible()
})

test('a submitted attempt replaces the fixture and confirms the handoff', async ({ page }) => {
  test.setTimeout(90_000)
  await enterHall(page, { count: 6, duration: 120 })
  await page.keyboard.press('1')
  await page.keyboard.press('n')
  await expect(page.getByTestId('question-number')).toHaveText('Question 2')
  await page.getByRole('button', { name: 'Review and submit' }).click()
  await page.getByRole('button', { name: 'Submit final answers' }).click()
  await expect(page.getByRole('heading', { name: 'Submission confirmed' })).toBeVisible()
  await page.getByRole('button', { name: 'View result sheet' }).click()
  await expect(page).toHaveURL(new RegExp(`/student/exams/${EXAM}/result\\?attempt=`))
  await expect(page.getByText('Your submission')).toBeVisible()
  await expect(page.getByTestId('score-hero')).toHaveAttribute('aria-label', 'Score 4 out of 24')
  await expect(page.locator('[data-testid^="question-row-"]')).toHaveCount(6)
  await expect(page.getByTestId('filter-correct').locator('[data-count]')).toHaveText('1')
  await page.getByLabel('Remove negative marking').check()
  await expect(page.getByTestId('what-if-score')).toContainText('4')
})

test('dashboard, performance and exams link into the result sheet', async ({ page }) => {
  await loginStudent(page)
  await page.getByRole('link', { name: 'Result sheet' }).first().click()
  await expect(page.getByTestId('result-summary')).toBeVisible()
  await page.goto('/student/performance')
  await page.getByRole('link', { name: 'Open result sheet' }).click()
  await expect(page.getByTestId('result-summary')).toBeVisible()
  await page.goto('/student/exams?tab=live')
  await page.getByRole('button', { name: 'Result sheet' }).first().click()
  await expect(page.getByTestId('result-summary')).toBeVisible()
})
