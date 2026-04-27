// =============================================================================
// E2E Test: Full Practice Flow
// =============================================================================
// Feature: toefl-helper-local
// Covers: Select mode → see prompt → type essay → submit → view feedback page
// Requirements: 6.1, 8.1, 10.1
// =============================================================================

import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Inject a mock LLM config into localStorage so the practice flow uses a
 * fake provider that never makes real network calls. We intercept the Ollama
 * endpoint with a route handler that returns a valid FeedbackResponse JSON.
 */
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

/**
 * A minimal valid FeedbackResponse that satisfies the feedbackSchema.
 */
const MOCK_FEEDBACK = {
  overall_score: 4,
  rubric_breakdown: {
    development: 4,
    organization: 4,
    language_use: 4,
    vocabulary: 4,
  },
  grammar_corrections: [
    {
      original: 'I goes to school',
      corrected: 'I go to school',
      explanation: 'Subject-verb agreement',
    },
  ],
  vocabulary_suggestions: [
    {
      original: 'good',
      suggested: 'excellent',
      reason: 'More precise and formal',
    },
  ],
  coherence_analysis: 'The essay is well-structured with clear transitions.',
  strengths: ['Clear main idea', 'Good use of examples'],
  improvements: ['Expand the conclusion', 'Vary sentence structure'],
  polished_version:
    'This is a polished version of the essay with improved grammar and vocabulary.',
}

/**
 * Mock the Ollama /api/generate endpoint so no real LLM is needed.
 */
async function mockOllamaEndpoint(page: Page) {
  await page.route('**/api/generate', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ response: JSON.stringify(MOCK_FEEDBACK) }),
    })
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Practice Flow', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockLlmConfig(page)
    await mockOllamaEndpoint(page)
  })

  test('landing page shows both mode selection cards', async ({ page }) => {
    await page.goto('/')

    // Requirement 4.1: two mode-selection cards on the landing page
    await expect(page.getByRole('heading', { name: /master your toefl writing/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /writing an email/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /academic discussion/i })).toBeVisible()

    // Requirement 4.4: guest-mode notice
    await expect(page.getByText(/no account needed/i)).toBeVisible()
  })

  test('selecting Email mode navigates to /practice/email', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /writing an email/i }).click()
    await expect(page).toHaveURL(/\/practice\/email/)
  })

  test('selecting Discussion mode navigates to /practice/discussion', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /academic discussion/i }).click()
    await expect(page).toHaveURL(/\/practice\/discussion/)
  })

  test('practice page shows prompt and writing editor (email mode)', async ({ page }) => {
    // Requirement 6.1: practice page renders prompt above writing editor
    await page.goto('/practice/email')

    // Prompt card should be visible
    await expect(page.getByText(/email task/i)).toBeVisible()

    // Writing editor textarea should be present with correct attributes
    const textarea = page.getByRole('textbox', { name: /essay editor/i })
    await expect(textarea).toBeVisible()
    await expect(textarea).toHaveAttribute('spellcheck', 'false')
    await expect(textarea).toHaveAttribute('autocomplete', 'off')

    // Timer should be visible and counting down from 07:00 (420s)
    await expect(page.getByLabel(/time remaining/i)).toBeVisible()

    // Submit button should be disabled when essay is empty (Requirement 6.8)
    const submitBtn = page.getByRole('button', { name: /submit essay for evaluation/i })
    await expect(submitBtn).toBeDisabled()
  })

  test('practice page shows prompt and writing editor (discussion mode)', async ({ page }) => {
    await page.goto('/practice/discussion')

    await expect(page.getByText(/academic discussion/i)).toBeVisible()

    const textarea = page.getByRole('textbox', { name: /essay editor/i })
    await expect(textarea).toBeVisible()

    // Timer should start at 10:00 (600s) for discussion mode
    await expect(page.getByLabel(/time remaining/i)).toContainText('10:')
  })

  test('submit button enables after typing essay', async ({ page }) => {
    await page.goto('/practice/email')

    const textarea = page.getByRole('textbox', { name: /essay editor/i })
    const submitBtn = page.getByRole('button', { name: /submit essay for evaluation/i })

    // Initially disabled
    await expect(submitBtn).toBeDisabled()

    // Type some text
    await textarea.fill('This is my practice essay for the TOEFL writing test.')

    // Now enabled
    await expect(submitBtn).toBeEnabled()
  })

  test('submit shows confirmation modal before proceeding', async ({ page }) => {
    // Requirement 6.9: confirmation modal before submission
    await page.goto('/practice/email')

    const textarea = page.getByRole('textbox', { name: /essay editor/i })
    await textarea.fill('This is my practice essay for the TOEFL writing test.')

    await page.getByRole('button', { name: /submit essay for evaluation/i }).click()

    // Confirmation modal should appear
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/submit your essay\?/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /keep writing/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^submit$/i })).toBeVisible()
  })

  test('cancelling confirmation modal returns to editor', async ({ page }) => {
    await page.goto('/practice/email')

    const textarea = page.getByRole('textbox', { name: /essay editor/i })
    await textarea.fill('This is my practice essay.')

    await page.getByRole('button', { name: /submit essay for evaluation/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Cancel
    await page.getByRole('button', { name: /keep writing/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Essay text should still be there
    await expect(textarea).toHaveValue('This is my practice essay.')
  })

  test('full practice flow: type essay → confirm submit → view feedback (guest)', async ({
    page,
  }) => {
    // Requirement 6.1, 8.1, 10.1
    await page.goto('/practice/email')

    const textarea = page.getByRole('textbox', { name: /essay editor/i })
    await textarea.fill(
      'Dear Professor, I am writing to request an extension on the assignment deadline. ' +
        'I have been dealing with a family emergency and was unable to complete the work on time. ' +
        'I would greatly appreciate your understanding and flexibility in this matter.',
    )

    // Submit
    await page.getByRole('button', { name: /submit essay for evaluation/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: /^submit$/i }).click()

    // Should navigate to feedback page (guest → /feedback/guest or /feedback/[id])
    await expect(page).toHaveURL(/\/feedback\//, { timeout: 30_000 })

    // Requirement 10.1: feedback page shows all sections
    await expect(page.getByRole('heading', { name: /your feedback/i })).toBeVisible()
  })

  test('word count updates in real time', async ({ page }) => {
    await page.goto('/practice/email')

    const textarea = page.getByRole('textbox', { name: /essay editor/i })

    // Type exactly 5 words
    await textarea.fill('one two three four five')
    await expect(page.getByLabel(/word count/i)).toContainText('5')

    // Add more words
    await textarea.fill('one two three four five six seven')
    await expect(page.getByLabel(/word count/i)).toContainText('7')
  })
})
