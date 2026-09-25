import { defineConfig } from '@playwright/test'
import baseConfig from './playwright.config'

const smokeBaseUrl = process.env.SMOKE_BASE_URL
if (!smokeBaseUrl) {
  throw new Error('SMOKE_BASE_URL is not set: the smoke suite runs against a deployed environment.')
}

// reason: `defineConfig`'s merge keeps a base value when the override sets the same key to
// `undefined` (it means "no override", not "clear this") — so `webServer`/`globalSetup` must be
// left out of the object entirely here, not merely set to `undefined`, or a local server ends up
// built and started for nothing while the tests correctly run against `smokeBaseUrl` regardless.
const baseWithoutLocalServer = { ...baseConfig }
delete baseWithoutLocalServer.webServer
delete baseWithoutLocalServer.globalSetup

// Post-deployment smoke checks against a deployed URL: no local server, no test database.
export default defineConfig(baseWithoutLocalServer, {
  testDir: './tests/smoke',
  retries: 0,
  use: { baseURL: smokeBaseUrl },
})
