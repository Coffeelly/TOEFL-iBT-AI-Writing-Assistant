// =============================================================================
// Playwright Configuration
// =============================================================================
// E2E test configuration for TOEFL Helper.
// Runs against the local Next.js dev server on port 3000.
// =============================================================================

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  // Run tests in files in parallel
  fullyParallel: false,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Single worker to avoid DB race conditions with SQLite
  workers: 1,
  // Reporter
  reporter: 'list',
  use: {
    // Base URL for all page.goto() calls
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    // Collect trace on first retry
    trace: 'on-first-retry',
    // Screenshot on failure
    screenshot: 'only-on-failure',
    // Reasonable action timeout
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Start the Next.js dev server before running tests if not already running.
  // Comment this out and run `npm run dev` manually if you prefer.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
