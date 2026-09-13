import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    globalSetup: ['tests/integration/global-setup.ts'],
    pool: 'forks',
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@tests': fileURLToPath(new URL('./tests', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // reason: see vitest.config.ts — `server-only` throws outside the react-server condition.
      'server-only': fileURLToPath(new URL('./node_modules/server-only/empty.js', import.meta.url)),
    },
  },
})
