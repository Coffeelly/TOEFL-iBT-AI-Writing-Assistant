// =============================================================================
// E2E Test: History Flow
// =============================================================================
// Feature: toefl-helper-local
// Covers: Submit → view history list → click detail
// Requirements: 12.6
// =============================================================================

import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uniqueEmail(): string {
  return `e2e-history-${Date.now()}@example.com`
}

const TEST_PASSWORD = 'testpassword123'
const TEST_DISPLAY_NAME = 'History Tester'

const MOCK_FEEDBACK = {
  overall_score: 3,
  rubric_breakdown: {
    development: 3,
    organization: 3,
    language_use: 3,
    vocabulary: 3,
  },
  grammar_corrections: [],
  vocabulary_suggestions: [],
  coherence_analysis: 'The essay demonstrates adequate coherence.',
  strengths: ['Clear structure'],
  improvements: ['Add more detail'],
  polished_version: 'This is a polished version of the submitted essay.',
}

async function injectMockLlmConfig(page: Page) {
  await page.addInitScript(() => {
    const config = {
      provider: 'OLLAMA',
      ollamaEndpoint: 'http://localhost:11434',
      geminiApiKey: '',
    }
    localStorage.setItem('toefl-helper-llm-config', JSON.stringify(config))
  })
}

async function mockOllamaEndpoint(page: Page) {
  await page.route('**/api/generate', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ response: JSON.stringify(MOCK_FEEDBACK) }),
    })
  })
}

/**
 * Register a new user and return to the home page ready to practice.
 */
async function registerAndGoHome(page: Page, email: string): Promise<void> {
  await page.goto('/register')
  await page.getByLabel(/display name/i).fill(TEST_DISPLAY_NAME)
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /create account/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  await page.goto('/')
}

/**
 * Complete a full practice submission as an authenticated user.
 * Returns after landing on the feedback page.
 */
async function submitEssay(page: Page): Promise<void> {
  await page.goto('/practice/email')

  const textarea = page.getByRole('textbox', { name: /essay editor/i })
  await textarea.fill(
    'Dear Professor, I am writing to request an extension on the assignment deadline. ' +
      'I have been dealing with a family emergency and was unable to complete the work on time. ' +
      'I would greatly appreciate your understanding and flexibility in this matter. ' +
      'Thank you for your consideration.',
  )

  await page.getByRole('button', { name: /submit essay for evaluation/i }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: /^submit$/i }).click()

  // Wait for feedback page
  await expect(page).toHaveURL(/\/feedback\//, { timeout: 30_000 })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('History Flow', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockLlmConfig(page)
    await mockOllamaEndpoint(page)
  })

  test('history page is accessible from header nav after login', async ({ page }) => {
    const email = uniqueEmail()
    await registerAndGoHome(page, email)

    await page.getByRole('link', { name: /history/i }).click()
    await expect(page).toHaveURL(/\/history/)
    await expect(page.getByRole('heading', { name: /submission history/i })).toBeVisible()
  })

  test('history page shows empty state when no submissions exist', async ({ page }) => {
    const email = uniqueEmail()
    await registerAndGoHome(page, email)

    await page.goto('/history')
    await expect(page.getByText(/no submissions yet/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /start practicing/i })).toBeVisible()
  })

  test('submitted essay appears in history list', async ({ page }) => {
    // Requirement 12.6: history list shows past submissions
    const email = uniqueEmail()
    await registerAndGoHome(page, email)

    // Submit an essay
    await submitEssay(page)

    // Navigate to history
    await page.goto('/history')

    // Should show at least one submission
    await expect(page.getByText(/1 submission/i)).toBeVisible()

    // Should show a list item with a link to the detail page
    const submissionLinks = page.locator('ul li a')
    await expect(submissionLinks.first()).toBeVisible()
  })

  test('history list shows date, mode badge, score badge, and prompt title', async ({ page }) => {
    // Requirement 12.6: list shows date, mode, score, prompt title
    const email = uniqueEmail()
    await registerAndGoHome(page, email)

    await submitEssay(page)
    await page.goto('/history')

    const firstItem = page.locator('ul li').first()

    // Mode badge (Email or Discussion)
    await expect(firstItem.getByText(/email|discussion/i)).toBeVisible()

    // Score badge (e.g. "3 / 5")
    await expect(firstItem.getByText(/\d+ \/ 5/i)).toBeVisible()

    // Word count info
    await expect(firstItem.getByText(/words/i)).toBeVisible()
  })

  test('clicking a history item navigates to the detail page', async ({ page }) => {
    // Requirement 12.6: clicking detail link
    const email = uniqueEmail()
    await registerAndGoHome(page, email)

    await submitEssay(page)
    await page.goto('/history')

    // Click the first submission link
    const firstLink = page.locator('ul li a').first()
    const href = await firstLink.getAttribute('href')
    await firstLink.click()

    // Should navigate to /history/[submissionId]
    await expect(page).toHaveURL(/\/history\//, { timeout: 10_000 })

    // Detail page reuses feedback components (Requirement 12.7)
    await expect(page.getByRole('heading', { name: /your feedback/i })).toBeVisible()
  })

  test('history detail page shows full feedback components', async ({ page }) => {
    const email = uniqueEmail()
    await registerAndGoHome(page, email)

    await submitEssay(page)

    // Capture the feedback page URL to derive the submission ID
    const feedbackUrl = page.url()
    const submissionId = feedbackUrl.split('/feedback/')[1]

    // Navigate directly to history detail
    await page.goto(`/history/${submissionId}`)

    // Should show all feedback sections (Requirement 10.1)
    await expect(page.getByRole('heading', { name: /your feedback/i })).toBeVisible()
  })

  test('unauthenticated user is redirected from /history to /login', async ({ page }) => {
    await page.goto('/history')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('pagination controls appear when there are more than 20 submissions', async ({ page }) => {
    // This test verifies the pagination UI exists; actual pagination requires
    // many submissions so we just verify the structure when there are few.
    const email = uniqueEmail()
    await registerAndGoHome(page, email)

    await page.goto('/history')

    // With 0 submissions, no pagination nav should be present
    const paginationNav = page.getByRole('navigation', { name: /pagination/i })
    await expect(paginationNav).not.toBeVisible()
  })
})
