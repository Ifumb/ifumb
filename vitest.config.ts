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
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
