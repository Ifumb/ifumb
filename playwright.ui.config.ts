import { defineConfig } from '@playwright/test'
import base from './playwright.config'

// reason: boucle visuelle rapide ; E2E_USE_BUILD compare les captures d’un build déjà validé.
const servers = Array.isArray(base.webServer) ? base.webServer : [base.webServer!]
const previewCommand = process.env.E2E_USE_BUILD === '1' ? 'pnpm start' : 'pnpm dev'

export default defineConfig({
  ...base,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  webServer: servers.map((server) => ({
    ...server,
    command: server.command.replace('pnpm build && pnpm start', previewCommand),
  })),
})
