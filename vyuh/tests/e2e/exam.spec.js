import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const axeSource = readFileSync(fileURLToPath(new URL('../../node_modules/axe-core/axe.min.js', import.meta.url)), 'utf8')
const EXAM = 'exam-neet-practice'

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

/** @param {import('@playwright/test').Page} page @param {{ count?: number, duration?: number }} [options] */
async function enterHall(page, options = {}) {
  await loginStudent(page)
  await page.evaluate(({ count, duration }) => {
    if (count) localStorage.setItem('vyuh.mock.examQuestionCount', String(count))
    if (duration) localStorage.setItem('vyuh.mock.examDurationSeconds', String(duration))
  }, options)
  await page.goto(`/student/exams/${EXAM}`)
  await page.getByRole('button', { name: 'Read instructions' }).click()
  await expect(page).toHaveURL(new RegExp(`/student/exams/${EXAM}/instructions$`))
  await page.getByRole('button', { name: 'Run checks' }).click()
  await expect(page.getByTestId('system-checks')).toBeVisible()
  await page.getByLabel('I accept the declaration').check()
  await page.getByRole('button', { name: 'Enter exam hall' }).click()
  await expect(page).toHaveURL(new RegExp(`/student/exams/${EXAM}/hall$`))
  await expect(page.getByTestId('exam-timer')).toBeVisible()
  await expect(page.getByTestId('question-number')).toHaveText('Question 1')
}

/** @param {import('@playwright/test').Page} page */
async function timerSeconds(page) {
  const label = await page.getByTestId('exam-timer').getAttribute('aria-label')
  const match = /(\d+) hours (\d+) minutes (\d+) seconds/.exec(label ?? '')
  if (!match) throw new Error(`timer label missing: ${label}`)
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
}

/** @param {import('@playwright/test').Page} page */
async function paletteSum(page) {
  return page.locator('[data-count]').evaluateAll((nodes) => nodes.reduce((sum, node) => sum + Number(node.textContent ?? 0), 0))
}

test('full 60-question journey completes and confirms', async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 1280, height: 900 })
  await enterHall(page, { count: 60 })
  await expect(page.getByTestId('exam-timer')).toHaveAttribute('data-timer-source', 'worker')
  for (let index = 0; index < 60; index += 1) {
    const numeric = page.getByLabel('Numerical answer')
    if (await numeric.count()) {
      await numeric.fill('1')
      await page.getByRole('button', { name: 'Save and next' }).click()
    } else {
      await page.keyboard.press('1')
      await page.keyboard.press('n')
    }
    if (index < 59) await expect(page.getByTestId('question-number')).toHaveText(`Question ${index + 2}`)
  }
  await expect(page.getByRole('dialog', { name: 'Submit sheet' })).toBeVisible()
  await expect(page.getByTestId('submit-total')).toHaveText('60')
  expect(await paletteSum(page)).toBe(60)
  await page.getByRole('button', { name: 'Submit final answers' }).click()
  await expect(page).toHaveURL(new RegExp(`/student/exams/${EXAM}/confirmation$`))
  await expect(page.getByRole('heading', { name: 'Submission confirmed' })).toBeVisible()
  await expect(page.getByText('Final answers submitted.')).toBeVisible()
  const receipt = page.getByLabel('Submission receipt')
  await expect(receipt.getByText('Answered', { exact: true })).toBeVisible()
  await expect(receipt.locator('li').first()).toContainText('60')
})

test('refresh mid-exam restores question, answers, statuses and timer', async ({ page }) => {
  await enterHall(page, { count: 12 })
  await page.keyboard.press('1')
  await page.keyboard.press('n')
  await expect(page.getByTestId('question-number')).toHaveText('Question 2')
  await page.keyboard.press('2')
  await page.getByRole('button', { name: 'Unsure', exact: true }).click()
  const before = await timerSeconds(page)
  await page.reload()
  await expect(page.getByTestId('question-number')).toHaveText('Question 2')
  await expect(page.getByRole('radio', { name: /B/ })).toBeChecked()
  await expect(page.getByRole('button', { name: 'Unsure', exact: true })).toHaveAttribute('aria-pressed', 'true')
  expect(await timerSeconds(page)).toBeLessThanOrEqual(before)
  expect(await paletteSum(page)).toBe(12)
  await expect(page.getByRole('button', { name: 'Question 1, Answered' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Question 2, Answered' })).toHaveAttribute('aria-current', 'true')
})

test('keyboard shortcuts work and pause while typing in the calculator', async ({ page }) => {
  await enterHall(page, { count: 6 })
  await page.keyboard.press('2')
  await expect(page.getByRole('radio', { name: /B/ })).toBeChecked()
  await page.keyboard.press('m')
  await expect(page.getByTestId('question-number')).toHaveText('Question 2')
  await expect(page.getByRole('button', { name: 'Question 1, Answered and marked for review' })).toBeVisible()
  await page.keyboard.press('p')
  await expect(page.getByTestId('question-number')).toHaveText('Question 1')
  await page.keyboard.press('c')
  await expect(page.getByRole('radio', { name: /A/ })).not.toBeChecked()
  await page.keyboard.press('1')
  await page.keyboard.press('n')
  await expect(page.getByTestId('question-number')).toHaveText('Question 2')
  await page.keyboard.press('?')
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Calculator', exact: true }).click()
  const input = page.getByLabel('Calculator expression')
  await input.fill('2*3')
  await input.press('n')
  await expect(input).toHaveValue('2*3n')
  await expect(page.getByTestId('question-number')).toHaveText('Question 2')
  await input.fill('2*3')
  await page.getByRole('button', { name: '=', exact: true }).click()
  await expect(page.locator('output')).toHaveText('6')
  await page.getByRole('button', { name: 'Close Calculator' }).click()
})

test('timer stays accurate when backgrounded and auto-submits at zero', async ({ page }) => {
  test.setTimeout(45_000)
  await enterHall(page, { count: 6, duration: 30 })
  const before = await timerSeconds(page)
  const other = await page.context().newPage()
  await other.goto('about:blank')
  await page.waitForTimeout(3_000)
  await page.bringToFront()
  const after = await timerSeconds(page)
  expect(before - after).toBeGreaterThanOrEqual(2)
  expect(before - after).toBeLessThanOrEqual(6)
  await expect(page).toHaveURL(new RegExp(`/student/exams/${EXAM}/confirmation$`), { timeout: 35_000 })
  await expect(page.getByText('Auto-submitted when the timer reached zero.')).toBeVisible()
  await other.close()
})

test('offline saves queue and sync on reconnect', async ({ page }) => {
  await enterHall(page, { count: 6 })
  await page.context().setOffline(true)
  await expect(page.getByTestId('offline-banner')).toBeVisible()
  await page.keyboard.press('1')
  await expect(page.getByTestId('sync-state')).toHaveText('Sync queued')
  await page.context().setOffline(false)
  await expect(page.getByTestId('sync-state')).toHaveText('All changes synced', { timeout: 12_000 })
  await expect(page.getByRole('radio', { name: /A/ })).toBeChecked()
})

test('integrity events, movable tools and submit cancel work', async ({ page }) => {
  await enterHall(page, { count: 6 })
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
  })
  await expect(page.getByTestId('tab-switches')).toHaveText('1')
  const copyBlocked = await page.evaluate(() => {
    const event = new ClipboardEvent('copy', { bubbles: true, cancelable: true })
    document.dispatchEvent(event)
    return event.defaultPrevented
  })
  expect(copyBlocked).toBe(true)
  const menuBlocked = await page.evaluate(() => {
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    document.dispatchEvent(event)
    return event.defaultPrevented
  })
  expect(menuBlocked).toBe(true)
  await page.getByRole('button', { name: 'Rough sheet', exact: true }).click()
  const panel = page.getByRole('region', { name: 'Rough sheet' })
  await expect(panel).toBeVisible()
  const handle = panel.locator('[data-tool-drag]')
  const box = await handle.boundingBox()
  await page.mouse.move(box.x + 40, box.y + 10)
  await page.mouse.down()
  await page.mouse.move(box.x + 120, box.y + 60, { steps: 5 })
  await page.mouse.up()
  await expect(panel).toBeVisible()
  await page.getByRole('button', { name: 'Close Rough sheet' }).click()
  await page.getByRole('button', { name: 'Contrast', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Contrast', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: /Dark mode|Light mode/ }).click()
  await page.getByRole('button', { name: 'Review and submit' }).click()
  await expect(page.getByRole('dialog', { name: 'Submit sheet' })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel and return' }).click()
  await expect(page.getByTestId('question-number')).toBeVisible()
  const events = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('vyuh.exam.flow.v1') ?? '{}')
    const attempt = Object.values(raw.state?.attempts ?? {})[0]
    return attempt?.integrityEvents?.map((event) => event.type) ?? []
  })
  expect(events).toContain('tab_switch')
  expect(events).toContain('copy_blocked')
  expect(events).toContain('context_menu_blocked')
})

test('hall fits 1280 and 768, phones show notice, keypad keys are 56px', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await enterHall(page, { count: 6 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.setViewportSize({ width: 768, height: 1024 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Question 4, Not visited' }).click()
  const key = page.getByRole('button', { name: 'Keypad 7' })
  const box = await key.boundingBox()
  expect(box.width).toBeGreaterThanOrEqual(56)
  expect(box.height).toBeGreaterThanOrEqual(56)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('note')).toContainText('Best on a larger screen')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('exam hall passes automated accessibility checks', async ({ page }) => {
  await enterHall(page, { count: 6 })
  await expectAccessible(page)
})
