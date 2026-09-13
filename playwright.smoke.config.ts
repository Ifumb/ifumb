import { defineConfig } from '@playwright/test'
import baseConfig from './playwright.config'

const smokeBaseUrl = process.env.SMOKE_BASE_URL
if (!smokeBaseUrl) {
  throw new Error('SMOKE_BASE_URL is not set: the smoke suite runs against a deployed environment.')
}

// Post-deployment smoke checks against a deployed URL: no local server, no test database.
export default defineConfig(baseConfig, {
  testDir: './tests/smoke',
  globalSetup: undefined,
  webServer: undefined,
  retries: 0,
  use: { baseURL: smokeBaseUrl },
})
