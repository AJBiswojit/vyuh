import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const axeSource = readFileSync(fileURLToPath(new URL('../../node_modules/axe-core/axe.min.js', import.meta.url)), 'utf8')

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
  await expect(page.getByRole('heading', { level: 1, name: /Ananya/ })).toBeVisible()
}

const paths = ['/student', '/student/exams', '/student/live', '/student/recordings', '/student/performance', '/student/doubts', '/student/attendance', '/student/study-rooms', '/student/profile']

test('desktop sidebar collapses and every nav item routes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await loginStudent(page)
  await page.getByRole('button', { name: 'Collapse sidebar' }).click()
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible()
  await page.getByRole('button', { name: 'Expand sidebar' }).click()
  const nav = page.getByRole('navigation', { name: 'Student workspace' })
  for (const [label, path] of [['Exams','/student/exams'],['Live classes','/student/live'],['Recordings','/student/recordings'],['Performance','/student/performance'],['Doubts','/student/doubts'],['Attendance','/student/attendance'],['Study rooms','/student/study-rooms'],['Profile','/student/profile'],['Dashboard','/student']]) {
    await nav.getByRole('link', { name: label, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`))
    await expect(page.locator('main h1')).toBeVisible()
  }
})

test('tablet uses a navigation drawer', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1024 })
  await loginStudent(page)
  await expect(page.getByRole('navigation', { name: 'Student workspace' })).toBeHidden()
  await page.getByRole('button', { name: 'Open navigation drawer' }).click()
  const drawer = await page.getByRole('dialog', { name: 'Student workspace' })
  await drawer.getByRole('link', { name: 'Performance' }).click()
  await expect(page).toHaveURL(/\/student\/performance$/)
  await expect(page.getByRole('heading', { name: 'Performance', level: 1 })).toBeVisible()
})

test('mobile bottom navigation and More sheet route without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await loginStudent(page)
  const ledger = page.locator('ol[aria-label="Recent attempts"]')
  await expect(ledger).toBeVisible()
  await expect(ledger.locator('li')).toHaveCount(5)
  await expect(ledger.getByText('Percentile').first()).toBeVisible()
  const ledgerBox = await ledger.boundingBox()
  expect(ledgerBox.x + ledgerBox.width).toBeLessThanOrEqual(390)
  const bottom = page.getByRole('navigation', { name: 'Student primary' })
  await expect(bottom).toBeVisible()
  await bottom.getByRole('link', { name: 'Exams' }).click()
  await expect(page).toHaveURL(/\/student\/exams$/)
  await bottom.getByRole('button', { name: 'More' }).click()
  await page.getByRole('dialog', { name: 'More' }).getByRole('link', { name: 'Attendance' }).click()
  await expect(page).toHaveURL(/\/student\/attendance$/)
  for (const path of paths) {
    await page.goto(path)
    await expect(page.locator('main h1')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
})

test('command palette searches pages and exams by keyboard', async ({ page }) => {
  await loginStudent(page)
  await page.keyboard.press('Control+K')
  const input = page.getByRole('combobox', { name: 'Search pages and exams' })
  await expect(input).toBeFocused()
  await input.fill('Mock 09')
  await expect(page.getByRole('option', { name: /Full Syllabus Mock 09/ })).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/student\/exams\?exam=exam-mock-09/)
  await expect(page.getByRole('heading', { name: 'Exams', level: 1 })).toBeVisible()
  await expect(page.getByText('Exam hall', { exact: true })).toBeVisible()
  await page.keyboard.press('Control+K')
  await page.getByRole('combobox', { name: 'Search pages and exams' }).fill('Performance')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/student\/performance$/)
})

test('empty attempts show dashboard and performance empty states', async ({ page }) => {
  await page.goto('/login')
  await page.evaluate(() => localStorage.setItem('vyuh.mock.studentScenario', 'empty-attempts'))
  await page.getByRole('button', { name: 'Quick demo login as Student' }).click()
  await expect(page.getByText('No past attempts yet')).toBeVisible()
  await page.goto('/student/performance')
  await expect(page.getByText('No past attempts yet')).toBeVisible()
})

test('dashboard countdown ticks every second', async ({ page }) => {
  await loginStudent(page)
  const timer = page.getByRole('timer')
  const before = await timer.textContent()
  await page.waitForTimeout(1200)
  await expect(timer).not.toHaveText(before ?? '')
  await expect(page.getByRole('heading', { level: 1, name: /Ananya/ })).toBeVisible()
})

test('notifications and profile menus work', async ({ page }) => {
  await loginStudent(page)
  await page.getByRole('button', { name: /Notifications/ }).click()
  await expect(page.getByRole('dialog', { name: 'Notifications' })).toBeVisible()
  await page.getByRole('button', { name: 'Mark all read' }).click()
  await expect(page.getByRole('button', { name: 'Mark all read' })).toBeDisabled()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /^Profile menu/ }).click()
  await page.getByRole('link', { name: 'Profile and preferences' }).click()
  await expect(page).toHaveURL(/\/student\/profile$/)
})

test('exams tabs show ledger rows and pattern chips', async ({ page }) => {
  await loginStudent(page)
  await page.goto('/student/exams')
  await page.getByRole('tab', { name: /Live/ }).click()
  await expect(page.getByText('Rotational Motion — chapter test')).toBeVisible()
  await page.getByRole('tab', { name: /Past/ }).click()
  await expect(page.getByText('Full Syllabus Mock 08 — JEE Main pattern')).toBeVisible()
  await expect(page.getByRole('list', { name: 'Exam pattern' }).first()).toBeVisible()
})

test('performance renders score and subject trends', async ({ page }) => {
  await loginStudent(page)
  await page.goto('/student/performance')
  await expect(page.getByRole('heading', { name: 'Across attempts' })).toBeVisible()
  await expect(page.locator('.recharts-surface').first()).toBeVisible()
  await expect(page.getByText('Movement by subject')).toBeVisible()
})

test('profile saves notification and data preferences', async ({ page }) => {
  await loginStudent(page)
  await page.goto('/student/profile')
  await page.getByLabel('Product updates').check()
  await page.getByLabel('Guardian summary').check()
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByText('Preferences saved')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Product updates')).toBeChecked()
  await expect(page.getByLabel('Guardian summary')).toBeChecked()
})

test('desktop dashboard and command palette pass automated accessibility checks', async ({ page }) => {
  await loginStudent(page)
  await expectAccessible(page)
  await page.keyboard.press('Control+K')
  await expect(page.getByRole('option').first()).toBeVisible()
  await expectAccessible(page)
})

test('tablet drawer passes automated accessibility checks', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1024 })
  await loginStudent(page)
  await page.getByRole('button', { name: 'Open navigation drawer' }).click()
  await expect(page.getByRole('dialog', { name: 'Student workspace' })).toBeVisible()
  await expectAccessible(page)
})

test('mobile More sheet passes automated accessibility checks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await loginStudent(page)
  await page.getByRole('button', { name: 'More', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'More' })).toBeVisible()
  await expectAccessible(page)
})
