import { defineConfig, devices } from '@playwright/test'
import { TEST_DATABASE_URL } from './tests/support/test-database'

// reason: a dedicated port, because port 3000 is commonly taken by another local Next.js app and
// `reuseExistingServer` would then silently run the suite against the wrong application.
const E2E_PORT = 3100
const BASE_URL = `http://localhost:${E2E_PORT}`
const BUILD_AND_START_TIMEOUT_MS = 180_000

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `pnpm build && pnpm start --port ${E2E_PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: BUILD_AND_START_TIMEOUT_MS,
    // Explicit values win over .env.local, so the suite can never reach the shared database.
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      AUTH_SECRET: 'e2e-only-secret-never-used-outside-the-local-test-server',
      AUTH_TRUST_HOST: 'true',
      APP_URL: BASE_URL,
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
