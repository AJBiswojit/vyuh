/**
 * BATCH 3.1 (WS4 / D-3) — PROSPECTIVE E2E SPEC, NOT EXECUTED IN THIS ENVIRONMENT.
 *
 * Chromium is not installed in this sandbox and no browser install is attempted
 * (see the Batch 3.1 remediation report, "Browser verification"). These cases
 * are collected by `npx playwright test --list` only; NO browser, viewport,
 * console, clipboard, download, axe or media result is claimed.
 *
 * D-3 fix: the created-student journey now performs a PROPER SIGN-OUT of the
 * Admin session before the student signs in. Batch 3's version simply did
 * `page.goto('/login')`, which left the Admin session in `vyuh.session`; the
 * guards would reject the student, so the case could never represent the
 * approved U-3 / G2 journey. No guard is weakened and no session is injected.
 *
 * No real generated password appears in this file. Temporary passwords are read
 * from the one-time sheet at runtime into a local variable and never logged.
 */
import { test, expect } from '@playwright/test'

const demoPassword = 'vyuh2026'
/* A NEW password chosen by the student during forced setup. This is a test
   fixture, not an institute-generated temporary credential. */
const chosenPassword = 'e2e-new-password-2026'

async function loginAsAdmin(page) {
  await page.goto('/login')
  await page.getByLabel('Email address').fill('academic.office@vidyutacademy.in')
  await page.getByLabel('Password', { exact: true }).fill(demoPassword)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/admin$/)
}

/** A real sign-out through the Admin shell, not a bare `page.goto('/login')`. */
async function signOut(page) {
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('vyuh.session'))).toBeNull()
}

async function configureYearToken(page) {
  await page.goto('/admin/users')
  const field = page.getByLabel('Institute-supplied year token')
  await field.fill('26')
  await page.getByRole('button', { name: 'Save token' }).click()
  await expect(page.getByText(/Year token 26 is active/)).toBeVisible()
}

/** @param {string} role */
async function openCreateDialog(page, role) {
  await page.goto('/admin/users')
  await page.getByRole('button', { name: 'Create account' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('radio', { name: role, exact: true }).check()
  return dialog
}

test('People shows exactly Students and Faculty tabs and no password-request queue', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/admin/users')
  const tabs = page.getByRole('tab')
  await expect(tabs).toHaveCount(2)
  await expect(tabs.nth(0)).toHaveText(/Students/)
  await expect(tabs.nth(1)).toHaveText(/Faculty/)
  await expect(page.getByText(/Password requests/i)).toHaveCount(0)
})

test('creating a faculty account shows one-time credentials once and never again', async ({ page }) => {
  await loginAsAdmin(page)
  const dialog = await openCreateDialog(page, 'Faculty')
  await dialog.getByLabel('Full name').fill('E2E Faculty')
  await dialog.getByLabel('Email').fill('e2e.faculty@vidyutacademy.in')
  await dialog.getByRole('button', { name: 'Create account' }).click()

  const sheet = page.getByRole('dialog')
  await expect(sheet.getByText(/shown once and cannot be retrieved later/)).toBeVisible()
  await expect(sheet.getByRole('button', { name: /Download CSV/ })).toBeVisible()
  const download = page.waitForEvent('download')
  await sheet.getByRole('button', { name: /Download CSV/ }).click()
  expect((await download).suggestedFilename()).toBe('vyuh-one-time-credentials.csv')

  await sheet.getByRole('button', { name: 'I have delivered these credentials' }).click()
  await expect(page.getByText(/shown once and cannot be retrieved later/)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /View credentials|Retrieve password/i })).toHaveCount(0)
})

test('create → view/copy/download → close → Admin sign-out → student first-login setup → own workspace', async ({ page }) => {
  /* 1. Admin creates ONE student. */
  await loginAsAdmin(page)
  await configureYearToken(page)
  const dialog = await openCreateDialog(page, 'Student')
  await dialog.getByLabel('Full name').fill('E2E Student')
  await dialog.getByLabel('Email').fill('e2e.student@vidyutacademy.in')
  await dialog.getByLabel('Batch', { exact: true }).selectOption({ value: 'bat-prayas-m' })
  await dialog.getByRole('button', { name: 'Create account' }).click()

  /* 2. Safely view the transient credentials and deliver them. */
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByText(/shown once and cannot be retrieved later/)).toBeVisible()
  const instituteId = (await sheet.getByTestId('credential-row').locator('code').first().textContent())?.trim() ?? ''
  const temporaryPassword = (await sheet.getByTestId('credential-row').locator('code').nth(1).textContent())?.trim() ?? ''
  expect(instituteId).toMatch(/^VYU-S-26-\d{4}$/)
  expect(temporaryPassword).toHaveLength(12)
  await sheet.getByRole('button', { name: `Copy Institute ID for E2E Student` }).click()
  await sheet.getByRole('button', { name: `Copy temporary password for E2E Student` }).click()
  const download = page.waitForEvent('download')
  await sheet.getByRole('button', { name: /Download CSV/ }).click()
  expect((await download).suggestedFilename()).toBe('vyuh-one-time-credentials.csv')

  /* 3. Close the sheet: the values are no longer retrievable in the app. */
  await sheet.getByRole('button', { name: 'I have delivered these credentials' }).click()
  await expect(page.getByRole('button', { name: /View credentials|Retrieve password/i })).toHaveCount(0)

  /* 4. PROPER SIGN-OUT (D-3). No injected session, no guard bypass. */
  await signOut(page)

  /* 5. Student signs in with the Institute ID and the temporary password. */
  await page.goto('/login')
  await page.getByLabel('Email address').fill(instituteId)
  await page.getByLabel('Password', { exact: true }).fill(temporaryPassword)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/setup-account$/)

  /* 6. Forced temporary-password change, with the approved strength policy. */
  await expect(page.getByRole('heading', { name: 'Choose your own password.' })).toBeVisible()
  await page.getByLabel('New password').fill(chosenPassword)
  await page.getByLabel('Confirm new password').fill(chosenPassword)
  await page.getByRole('button', { name: /Save password & continue/ }).click()

  /* 7. The correct student workspace opens with HONEST empty data (U-3). */
  await expect(page).toHaveURL(/\/student$/)
  await expect(page.getByRole('heading', { name: /E2E Student/i })).toBeVisible()
  await expect(page.getByText(/Ananya Sahoo/i)).toHaveCount(0)
  await page.goto('/student/live')
  await expect(page.getByText(/No classes in this mode/i)).toBeVisible()
  await page.goto('/student/attendance')
  await expect(page.getByText(/No attendance records/i)).toBeVisible()
})

test('an audited lifecycle action appears in the audit ledger', async ({ page }) => {
  await loginAsAdmin(page)
  const dialog = await openCreateDialog(page, 'Faculty')
  await dialog.getByLabel('Full name').fill('E2E Lifecycle')
  await dialog.getByLabel('Email').fill('e2e.lifecycle@vidyutacademy.in')
  await dialog.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('button', { name: 'I have delivered these credentials' }).click()

  await page.getByRole('button', { name: 'Manage' }).last().click()
  await page.getByRole('button', { name: /Suspend account/ }).click()
  await page.getByLabel('Reason for the record').fill('Identity verified; temporary leave.')
  await page.getByRole('button', { name: 'Confirm' }).click()

  await page.goto('/admin/audit')
  await expect(page.getByText(/Account suspended/).first()).toBeVisible()
})
