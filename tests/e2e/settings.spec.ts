// =============================================================================
// E2E Test: Settings Flow
// =============================================================================
// Feature: toefl-helper-local
// Covers: Toggle Ollama ↔ Gemini → settings persist across page reload
// Requirements: 7.4
// =============================================================================

import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uniqueEmail(): string {
  return `e2e-settings-${Date.now()}@example.com`
}

const TEST_PASSWORD = 'testpassword123'
const TEST_DISPLAY_NAME = 'Settings Tester'

async function registerUser(page: Page, email: string): Promise<void> {
  await page.goto('/register')
  await page.getByLabel(/display name/i).fill(TEST_DISPLAY_NAME)
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /create account/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Settings Flow', () => {
  test('settings page is accessible without authentication', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible()
  })

  test('settings page shows LLM configuration panel', async ({ page }) => {
    await page.goto('/settings')

    await expect(page.getByRole('heading', { name: /llm provider configuration/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /ollama/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /gemini/i })).toBeVisible()
  })

  test('Ollama is selected by default and shows endpoint input', async ({ page }) => {
    await page.goto('/settings')

    // Ollama endpoint input should be visible by default
    await expect(page.getByLabel(/ollama endpoint/i)).toBeVisible()
    await expect(page.getByLabel(/ollama endpoint/i)).toHaveValue('http://localhost:11434')

    // Test Connection button should be visible
    await expect(page.getByRole('button', { name: /test connection/i })).toBeVisible()
  })

  test('switching to Gemini shows API key input and hides Ollama fields', async ({ page }) => {
    await page.goto('/settings')

    // Switch to Gemini
    await page.getByRole('button', { name: /gemini/i }).click()

    // Gemini API key input should appear
    await expect(page.getByLabel(/gemini api key/i)).toBeVisible()
    await expect(page.getByLabel(/gemini api key/i)).toHaveAttribute('type', 'password')

    // Ollama endpoint should be hidden
    await expect(page.getByLabel(/ollama endpoint/i)).not.toBeVisible()

    // Test Connection button should be hidden (Gemini has no test button)
    await expect(page.getByRole('button', { name: /test connection/i })).not.toBeVisible()
  })

  test('switching back to Ollama from Gemini restores Ollama fields', async ({ page }) => {
    await page.goto('/settings')

    // Switch to Gemini
    await page.getByRole('button', { name: /gemini/i }).click()
    await expect(page.getByLabel(/gemini api key/i)).toBeVisible()

    // Switch back to Ollama
    await page.getByRole('button', { name: /ollama/i }).click()
    await expect(page.getByLabel(/ollama endpoint/i)).toBeVisible()
    await expect(page.getByLabel(/gemini api key/i)).not.toBeVisible()
  })

  test('LLM provider selection persists across page reload (Requirement 7.4)', async ({
    page,
  }) => {
    // Requirement 7.4: config persists to localStorage
    await page.goto('/settings')

    // Switch to Gemini
    await page.getByRole('button', { name: /gemini/i }).click()
    await expect(page.getByLabel(/gemini api key/i)).toBeVisible()

    // Reload the page
    await page.reload()

    // Gemini should still be selected after reload
    await expect(page.getByLabel(/gemini api key/i)).toBeVisible()
    await expect(page.getByLabel(/ollama endpoint/i)).not.toBeVisible()
  })

  test('Ollama endpoint value persists across page reload', async ({ page }) => {
    await page.goto('/settings')

    const customEndpoint = 'http://localhost:11435'
    const endpointInput = page.getByLabel(/ollama endpoint/i)

    await endpointInput.fill(customEndpoint)

    // Reload
    await page.reload()

    // Custom endpoint should be restored
    await expect(page.getByLabel(/ollama endpoint/i)).toHaveValue(customEndpoint)
  })

  test('Gemini API key persists across page reload', async ({ page }) => {
    await page.goto('/settings')

    // Switch to Gemini
    await page.getByRole('button', { name: /gemini/i }).click()

    const fakeApiKey = 'AIzaSyFakeTestKey12345'
    await page.getByLabel(/gemini api key/i).fill(fakeApiKey)

    // Reload
    await page.reload()

    // Key should be restored (masked but present)
    const keyInput = page.getByLabel(/gemini api key/i)
    await expect(keyInput).toHaveValue(fakeApiKey)
  })

  test('LLM config is stored in localStorage, not sent to API routes', async ({ page }) => {
    // Requirement 7.5: API key must never appear in requests to /api/*
    const apiRequests: string[] = []

    page.on('request', (request) => {
      const url = request.url()
      if (url.includes('/api/')) {
        const body = request.postData() ?? ''
        apiRequests.push(body)
      }
    })

    await page.goto('/settings')
    await page.getByRole('button', { name: /gemini/i }).click()

    const fakeApiKey = 'AIzaSyFakeTestKey99999'
    await page.getByLabel(/gemini api key/i).fill(fakeApiKey)

    // Verify the key is in localStorage
    const storedConfig = await page.evaluate((key) => localStorage.getItem(key), 'toefl-helper-llm-config')
    expect(storedConfig).toContain(fakeApiKey)

    // Verify the key never appeared in any /api/* request body
    for (const body of apiRequests) {
      expect(body).not.toContain(fakeApiKey)
    }
  })

  test('difficulty override selector shows all options', async ({ page }) => {
    await page.goto('/settings')

    await expect(page.getByRole('heading', { name: /difficulty preference/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^auto$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^beginner$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^intermediate$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^advanced$/i })).toBeVisible()
  })

  test('difficulty override persists across page reload', async ({ page }) => {
    await page.goto('/settings')

    // Select Intermediate
    await page.getByRole('button', { name: /^intermediate$/i }).click()

    // Reload
    await page.reload()

    // Intermediate should still be selected (highlighted)
    const intermediateBtn = page.getByRole('button', { name: /^intermediate$/i })
    await expect(intermediateBtn).toHaveClass(/brand/)
  })

  test('authenticated user sees profile settings section', async ({ page }) => {
    const email = uniqueEmail()
    await registerUser(page, email)

    await page.goto('/settings')

    // Profile settings section should be visible for authenticated users
    await expect(page.getByRole('heading', { name: /profile settings/i })).toBeVisible()
    await expect(page.getByLabel(/display name/i)).toBeVisible()
    await expect(page.getByLabel(/display name/i)).toHaveValue(TEST_DISPLAY_NAME)
  })

  test('unauthenticated user does not see profile settings section', async ({ page }) => {
    await page.goto('/settings')

    // Profile settings section should NOT be visible for guests
    await expect(page.getByRole('heading', { name: /profile settings/i })).not.toBeVisible()
  })

  test('full settings flow: toggle Ollama ↔ Gemini and verify persistence', async ({ page }) => {
    // Requirement 7.4: full toggle and persistence test
    await page.goto('/settings')

    // Start: Ollama (default)
    await expect(page.getByLabel(/ollama endpoint/i)).toBeVisible()

    // Switch to Gemini
    await page.getByRole('button', { name: /gemini/i }).click()
    await expect(page.getByLabel(/gemini api key/i)).toBeVisible()

    const apiKey = 'AIzaSyPersistenceTest12345'
    await page.getByLabel(/gemini api key/i).fill(apiKey)

    // Reload — Gemini + key should persist
    await page.reload()
    await expect(page.getByLabel(/gemini api key/i)).toBeVisible()
    await expect(page.getByLabel(/gemini api key/i)).toHaveValue(apiKey)

    // Switch back to Ollama
    await page.getByRole('button', { name: /ollama/i }).click()
    await expect(page.getByLabel(/ollama endpoint/i)).toBeVisible()

    // Reload — Ollama should persist
    await page.reload()
    await expect(page.getByLabel(/ollama endpoint/i)).toBeVisible()
    await expect(page.getByLabel(/gemini api key/i)).not.toBeVisible()
  })
})
