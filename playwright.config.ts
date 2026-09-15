import { defineConfig, devices } from '@playwright/test'
import { TEST_DATABASE_URL } from './tests/support/test-database'

// reason: an uncommon port (override with E2E_PORT) and no server reuse. Another local Next.js app
// was started on the previous dedicated port, and reusing "whatever answers" ran the whole suite
// against it; now a taken port makes Playwright fail loudly instead.
const DEFAULT_E2E_PORT = 3923
const E2E_PORT = Number(process.env.E2E_PORT ?? DEFAULT_E2E_PORT)
const BASE_URL = `http://localhost:${E2E_PORT}`
const BUILD_AND_START_TIMEOUT_MS = 180_000
const FAKE_STORAGE_PORT = E2E_PORT + 1
const FAKE_STORAGE_URL = `http://127.0.0.1:${FAKE_STORAGE_PORT}`

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
  webServer: [
    {
      // Member photos go to a local stand-in for Supabase Storage, never to a real bucket.
      command: 'node tests/e2e/support/fake-photo-storage.mjs',
      url: `${FAKE_STORAGE_URL}/health`,
      reuseExistingServer: false,
      env: { FAKE_STORAGE_PORT: String(FAKE_STORAGE_PORT) },
    },
    {
      command: `pnpm build && pnpm start --port ${E2E_PORT}`,
      url: BASE_URL,
      reuseExistingServer: false,
      timeout: BUILD_AND_START_TIMEOUT_MS,
      // Explicit values win over .env.local, so the suite can never reach the shared database.
      env: {
        DATABASE_URL: TEST_DATABASE_URL,
        AUTH_SECRET: 'e2e-only-secret-never-used-outside-the-local-test-server',
        AUTH_TRUST_HOST: 'true',
        APP_URL: BASE_URL,
        // The test database is disposable: the suite exercises every business write.
        BUSINESS_WRITES_ENABLED: 'true',
        SUPABASE_URL: FAKE_STORAGE_URL,
        SUPABASE_SERVICE_ROLE_KEY: 'e2e-only-fake-service-role-key',
      },
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
