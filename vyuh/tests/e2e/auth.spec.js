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

/* C1 rewrite: public self-registration no longer exists. */
test('public signup is retired and creates no student session', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Create your account' })).toHaveCount(0)
  await page.goto('/signup')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('Accounts are issued by your academic office')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create account & verify email' })).toHaveCount(0)
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('vyuh.session') ?? '{}').state?.session ?? null)
  expect(state).toBeNull()
  expect(await page.evaluate(() => localStorage.getItem('vyuh.mock.accounts.v1') ?? '')).not.toContain('VYU-S')
})

/* C1 rewrite: OTP auto-advance/paste coverage is retired with documentation —
   no challenge can be created from a public form in Batch 2. */
test('the OTP verification route cannot complete a retired signup', async ({ page }) => {
  await page.goto('/verify-otp?challenge=demo-signup')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('Accounts are issued by your academic office')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Digit 1 of 6' })).toHaveCount(0)
  const challenges = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('vyuh.mock.auth.v1') ?? '{}').challenges ?? {}))
  expect(challenges).toEqual([])
})

/* C1 rewrite: the expired-OTP/resend case is retired with documentation; there
   is no reachable OTP UI. C1's no-plaintext assertion now lives in the
   first-login unit flow (tests/unit/first-login.test.jsx). */
test('no OTP challenge or plaintext credential survives the retired routes', async ({ page }) => {
  await page.goto('/signup')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('button', { name: 'Try expired code (000000)' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Resend in/ })).toHaveCount(0)
  for (const key of ['vyuh.mock.auth.v1', 'vyuh.mock.accounts.v1', 'vyuh.session']) {
    expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey) ?? '', key)).not.toContain('FocusedMind2026!')
  }
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

/* C1 rewrite: invitations cannot self-activate an account. */
test('the invitation route cannot activate an account or reach the faculty layout', async ({ page }) => {
  await page.goto('/join/VYUH-FACULTY-2026')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('Accounts are issued by your academic office')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Accept invite & join' })).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Faculty workspace' })).toHaveCount(0)
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('vyuh.session') ?? '{}').state?.session ?? null)
  expect(state).toBeNull()
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
  for (const path of ['/login', '/forgot-password', '/reset-password', '/signup', '/join/VYUH-FACULTY-2026']) {
    await page.goto(path)
    /* Retired routes now land on /login; they still must not overflow. */
    await expect(page.locator('main h1')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
  /* Batch 2 deliberately has no Admin People UI, so the first-login page is
     reached in E2E with an injected gated session (metadata only — never a
     credential). The real credential-issuance journey belongs to Batch 3. */
  await page.evaluate(() => {
    const now = Date.now()
    const session = {
      token: 'e2e-gated-session', issuedAt: now, expiresAt: now + 8 * 60 * 60 * 1000,
      expiresInSeconds: 8 * 60 * 60, mustChangePassword: true,
      user: {
        id: 'usr-ananya', name: 'Ananya Sahoo', email: 'ananya.sahoo@vidyutacademy.in',
        role: 'student', initials: 'AS', joinedAt: '2026-01-01', mustChangePassword: true,
      },
    }
    localStorage.setItem('vyuh.session', JSON.stringify({ version: 1, state: { session } }))
  })
  await page.goto('/setup-account')
  await expect(page.getByRole('heading', { name: 'Choose your own password.' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.evaluate(() => localStorage.removeItem('vyuh.session'))
  await page.goto('/login')
  await page.getByLabel('Email address').focus()
  await page.keyboard.type('snehasish@vidyutacademy.in')
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Password', { exact: true })).toBeFocused()
  await page.keyboard.type(demoPassword)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/faculty$/)
})
