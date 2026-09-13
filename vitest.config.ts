import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const DOMAIN_COVERAGE_THRESHOLD = 90
const DOMAIN_BRANCH_COVERAGE_THRESHOLD = 85

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/core/**/*.ts'],
      exclude: ['**/*.d.ts'],
      thresholds: {
        statements: DOMAIN_COVERAGE_THRESHOLD,
        branches: DOMAIN_BRANCH_COVERAGE_THRESHOLD,
        functions: DOMAIN_COVERAGE_THRESHOLD,
        lines: DOMAIN_COVERAGE_THRESHOLD,
      },
    },
  },
  resolve: {
    alias: {
      '@tests': fileURLToPath(new URL('./tests', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // reason: `server-only` throws unless resolved under the `react-server` condition, which
      // only Next.js applies. Unit tests run server code in plain Node, so they get its empty entry.
      'server-only': fileURLToPath(new URL('./node_modules/server-only/empty.js', import.meta.url)),
    },
  },
})
