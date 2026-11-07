import { test, expect } from '@playwright/test'

const demoPassword = 'vyuh2026'
async function login(page, email, password = demoPassword) {
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible()
})

for (const [role, path, navigation] of [
  ['Student', '/student', 'Student workspace'],
  ['Faculty', '/faculty', 'Faculty workspace'],
  ['Academic office', '/admin', 'Academic office'],
]) {
  test(`demo ${role.toLowerCase()} reaches its own layout`, async ({ page }) => {
    await page.getByRole('button', { name: `Quick demo login as ${role}` }).click()
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(page.getByRole('navigation', { name: navigation })).toBeVisible()
    const session = await page.evaluate(() => JSON.parse(localStorage.getItem('vyuh.session')).state.session)
    expect(session.expiresAt - session.issuedAt).toBe(8 * 60 * 60 * 1000)
  })
}

test('deep link survives a login-page reload and returns after login', async ({ page }) => {
  await page.goto('/student/papers?filter=live#top')
  await expect(page).toHaveURL(/\/login$/)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible()
  await login(page, 'ananya.sahoo@vidyutacademy.in')
  await expect(page).toHaveURL(/\/student\/papers\?filter=live#top$/)
})

test('wrong password, locked account, and network error have distinct messages', async ({ page }) => {
  await login(page, 'ananya.sahoo@vidyutacademy.in', 'wrong-password')
  await expect(page.getByRole('alert')).toContainText('Wrong email or password')
  await page.getByLabel('Email address').fill('locked.student@vidyutacademy.in')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Account temporarily locked')
  await page.getByLabel('Email address').fill('offline@vidyutacademy.in')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Connection interrupted')
})

test('five failed attempts lock the account across reloads', async ({ page }) => {
  for (let i = 0; i < 5; i++) {
    await login(page, 'lock-e2e@example.com', 'wrong')
    await expect(page.getByRole('alert')).toContainText(i === 4 ? 'Account temporarily locked' : /attempt(s)? remain/)
  }
  await expect(page.getByRole('button', { name: 'Account temporarily locked' })).toBeDisabled()
  await page.reload()
  await login(page, 'lock-e2e@example.com', demoPassword)
  await expect(page.getByRole('alert')).toContainText('Account temporarily locked')
})

test('signup, consent, OTP paste, and student session', async ({ page }) => {
  await page.getByRole('link', { name: 'Create your account' }).click()
  await expect(page.getByRole('heading', { name: 'Make room for progress.' })).toBeVisible()
  await page.getByLabel('Full name').fill('Kiran Mishra')
  await page.getByLabel('Email address').fill(`kiran-${Date.now()}@example.com`)
  await page.getByLabel('Institute code').fill('VYUH2026')
  await page.getByLabel('Your batch').selectOption('bat-prayas-m')
  await page.getByLabel('Create a password', { exact: true }).fill('FocusedMind2026!')
  await page.getByRole('button', { name: 'Create account & verify email' }).click()
  await expect(page.getByText('Accept the Terms to create an account.')).toBeVisible()
  await page.getByLabel(/I accept the Terms/).check()
  await page.getByLabel(/I agree to the attendance/).check()
  await page.getByRole('button', { name: 'Create account & verify email' }).click()
  await expect(page.getByRole('heading', { name: 'A code. A fresh start.' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Resend in/ })).toBeDisabled()
  await page.getByRole('textbox', { name: 'Digit 1 of 6' }).click()
  // Use the demo inbox button for deterministic entry, then verify paste separately below.
  await page.getByRole('button', { name: 'Fill demo code 123456' }).click()
  await expect(page.getByRole('textbox', { name: 'Digit 6 of 6' })).toHaveValue('6')
  await page.getByRole('button', { name: 'Verify & continue' }).click()
  await expect(page).toHaveURL(/\/student$/)
  expect(await page.evaluate(() => localStorage.getItem('vyuh.session'))).not.toContain('FocusedMind2026!')
})

test('OTP auto-advance and paste support', async ({ page }) => {
  await page.goto('/signup')
  await page.getByLabel('Full name').fill('Paste Test')
  await page.getByLabel('Email address').fill(`paste-${Date.now()}@example.com`)
  await page.getByLabel('Institute code').fill('VYUH2026')
  await page.getByLabel('Your batch').selectOption('bat-prayas-m')
  await page.getByLabel('Create a password', { exact: true }).fill('FocusedMind2026!')
  await page.getByLabel(/I accept the Terms/).check()
  await page.getByLabel(/I agree to the attendance/).check()
  await page.getByRole('button', { name: 'Create account & verify email' }).click()
  const first = page.getByRole('textbox', { name: 'Digit 1 of 6' })
  await first.click()
  await page.keyboard.type('1')
  await expect(page.getByRole('textbox', { name: 'Digit 2 of 6' })).toBeFocused()
  await first.click()
  await first.evaluate((node) => {
    const data = new DataTransfer(); data.setData('text/plain', '123456')
    node.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }))
  })
  await expect(page.getByRole('textbox', { name: 'Digit 6 of 6' })).toHaveValue('6')
})

test('expired OTP shows its own message', async ({ page }) => {
  await page.goto('/signup')
  await page.getByLabel('Full name').fill('Expired OTP')
  await page.getByLabel('Email address').fill(`expired-${Date.now()}@example.com`)
  await page.getByLabel('Institute code').fill('VYUH2026')
  await page.getByLabel('Your batch').selectOption('bat-prayas-m')
  await page.getByLabel('Create a password', { exact: true }).fill('FocusedMind2026!')
  await page.getByLabel(/I accept the Terms/).check()
  await page.getByLabel(/I agree to the attendance/).check()
  await page.getByRole('button', { name: 'Create account & verify email' }).click()
  await page.getByRole('button', { name: 'Try expired code (000000)' }).click()
  await page.getByRole('button', { name: 'Verify & continue' }).click()
  await expect(page.getByRole('alert')).toContainText('Verification code expired')
})

test('forgot password mock inbox and reset', async ({ page }) => {
  await page.getByRole('link', { name: 'Forgot password?' }).click()
  await page.getByLabel('Account email').fill('ananya.sahoo@vidyutacademy.in')
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await page.getByRole('link', { name: /Open your demo reset link/ }).click()
  await page.getByLabel('New password', { exact: true }).fill('NewFocused2026!')
  await page.getByLabel('Confirm new password', { exact: true }).fill('NewFocused2026!')
  await page.getByRole('button', { name: 'Set new password' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible()
  await expect(page.getByText('Password updated')).toBeVisible()
  await login(page, 'ananya.sahoo@vidyutacademy.in', 'NewFocused2026!')
  await expect(page).toHaveURL(/\/student$/)
})

test('faculty invitation reaches faculty layout', async ({ page }) => {
  await page.goto('/join/VYUH-FACULTY-2026')
  await page.getByLabel('Create your password', { exact: true }).fill('FacultyFocus2026!')
  await page.getByLabel('Confirm password', { exact: true }).fill('FacultyFocus2026!')
  await page.getByRole('button', { name: 'Accept invite & join' }).click()
  await expect(page).toHaveURL(/\/faculty$/)
  await expect(page.getByRole('navigation', { name: 'Faculty workspace' })).toBeVisible()
})

test('mismatched role shows access denied with own workspace link', async ({ page }) => {
  await page.getByRole('button', { name: 'Quick demo login as Student' }).click()
  await expect(page).toHaveURL(/\/student$/)
  await page.goto('/faculty')
  await expect(page).toHaveURL(/\/access-denied$/)
  await expect(page.getByRole('heading', { name: /A different seat/ })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Student workspace' })).toBeVisible()
  await page.getByRole('link', { name: /Go to your student workspace/ }).click()
  await expect(page).toHaveURL(/\/student$/)
})

test('logout clears localStorage and returns to landing', async ({ page }) => {
  await page.getByRole('button', { name: 'Quick demo login as Faculty' }).click()
  await expect(page).toHaveURL(/\/faculty$/)
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('vyuh.session'))).toBeNull()
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login$/)
})

test('mobile auth pages have no horizontal overflow and keyboard login works', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of ['/login', '/signup', '/forgot-password', '/reset-password', '/join/VYUH-FACULTY-2026']) {
    await page.goto(path)
    await expect(page.locator('main h1')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
  await page.goto('/login')
  await page.getByLabel('Email address').focus()
  await page.keyboard.type('snehasish@vidyutacademy.in')
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Password', { exact: true })).toBeFocused()
  await page.keyboard.type(demoPassword)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/faculty$/)
})
