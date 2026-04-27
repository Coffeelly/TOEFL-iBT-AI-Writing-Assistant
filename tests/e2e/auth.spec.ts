// =============================================================================
// E2E Test: Auth Flow
// =============================================================================
// Feature: toefl-helper-local
// Covers: Register → login → dashboard → logout
// Requirements: 3.1, 3.4, 12.1
// =============================================================================

import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a unique email to avoid conflicts between test runs. */
function uniqueEmail(): string {
  return `e2e-test-${Date.now()}@example.com`
}

const TEST_PASSWORD = 'testpassword123'
const TEST_DISPLAY_NAME = 'E2E Tester'

/**
 * Register a new user via the UI and return the email used.
 */
async function registerUser(
  page: Page,
  email: string,
  password = TEST_PASSWORD,
  displayName = TEST_DISPLAY_NAME,
): Promise<void> {
  await page.goto('/register')
  await page.getByLabel(/display name/i).fill(displayName)
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /create account/i }).click()
}

/**
 * Log in via the UI.
 */
async function loginUser(page: Page, email: string, password = TEST_PASSWORD): Promise<void> {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Auth Flow', () => {
  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register')

    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible()
    await expect(page.getByLabel(/display name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()

    // Link to login page
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()

    // Link to register page
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible()
  })

  test('successful registration redirects to dashboard', async ({ page }) => {
    // Requirement 3.1: register with valid credentials
    const email = uniqueEmail()
    await registerUser(page, email)

    // Should redirect to /dashboard after successful registration
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

    // Requirement 12.1: dashboard is accessible to authenticated users
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test('registration shows error for duplicate email', async ({ page }) => {
    // Requirement 3.2: 409 on duplicate email
    const email = uniqueEmail()

    // Register once
    await registerUser(page, email)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

    // Try to register again with the same email
    await page.goto('/register')
    await page.getByLabel(/display name/i).fill('Another User')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /create account/i }).click()

    // Should show duplicate email error
    await expect(page.getByText(/already registered/i)).toBeVisible()
    // Should stay on register page
    await expect(page).toHaveURL(/\/register/)
  })

  test('registration shows validation error for short password', async ({ page }) => {
    // Requirement 3.3: 400 on invalid password
    await page.goto('/register')
    await page.getByLabel(/display name/i).fill('Test User')
    await page.getByLabel(/email/i).fill(uniqueEmail())
    await page.getByLabel(/password/i).fill('short') // < 8 chars
    await page.getByRole('button', { name: /create account/i }).click()

    // Should show a validation error
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/register/)
  })

  test('successful login redirects to dashboard', async ({ page }) => {
    // Requirement 3.4: login with valid credentials
    const email = uniqueEmail()

    // Register first
    await registerUser(page, email)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

    // Log out
    await page.getByRole('button', { name: /log out/i }).click()
    await expect(page).toHaveURL('/')

    // Log back in
    await loginUser(page, email)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test('login shows error for wrong password', async ({ page }) => {
    // Requirement 3.5: 401 on wrong credentials
    const email = uniqueEmail()
    await registerUser(page, email)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

    // Log out
    await page.getByRole('button', { name: /log out/i }).click()

    // Try to log in with wrong password
    await loginUser(page, email, 'wrongpassword')

    // Should show error
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('authenticated user sees display name and nav links in header', async ({ page }) => {
    const email = uniqueEmail()
    await registerUser(page, email)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

    // Header should show display name and nav links
    await expect(page.getByText(TEST_DISPLAY_NAME)).toBeVisible()
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /history/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /log out/i })).toBeVisible()
  })

  test('logout clears auth state and redirects to home', async ({ page }) => {
    const email = uniqueEmail()
    await registerUser(page, email)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

    // Log out
    await page.getByRole('button', { name: /log out/i }).click()

    // Should redirect to home
    await expect(page).toHaveURL('/')

    // Header should show login/register links (not display name)
    await expect(page.getByRole('link', { name: /log in/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible()
    await expect(page.getByText(TEST_DISPLAY_NAME)).not.toBeVisible()
  })

  test('unauthenticated access to /dashboard redirects to /login', async ({ page }) => {
    // Requirement 3.8: protected routes redirect to /login
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('unauthenticated access to /history redirects to /login', async ({ page }) => {
    await page.goto('/history')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('unauthenticated access to /settings still renders the page (settings is public)', async ({
    page,
  }) => {
    // Settings page is accessible to guests for LLM config
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible()
  })

  test('full auth flow: register → dashboard → logout → login → dashboard', async ({ page }) => {
    // Requirement 3.1, 3.4, 12.1
    const email = uniqueEmail()

    // Step 1: Register
    await registerUser(page, email)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()

    // Step 2: Logout
    await page.getByRole('button', { name: /log out/i }).click()
    await expect(page).toHaveURL('/')

    // Step 3: Login
    await loginUser(page, email)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByText(TEST_DISPLAY_NAME)).toBeVisible()
  })
})
