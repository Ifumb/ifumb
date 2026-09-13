import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import jsxA11y from 'eslint-plugin-jsx-a11y'

const PARENT_IMPORT_MESSAGE =
  'Parent-relative imports are forbidden: use the "@/..." alias (see nextjs-conventions.md).'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // reason: eslint-config-next already registers the jsx-a11y plugin; re-registering it
  // through flatConfigs.strict would redefine the plugin, so only its rules are layered on top.
  { rules: jsxA11y.flatConfigs.strict.rules },
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['../*', '../**'], message: PARENT_IMPORT_MESSAGE }] },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
    'src/infrastructure/persistence/prisma/generated/**',
  ]),
])
