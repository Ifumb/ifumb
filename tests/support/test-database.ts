import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { Client } from 'pg'

/**
 * The disposable Postgres of docker-compose.test.yml. Tests never read DATABASE_URL or DIRECT_URL
 * from the environment: those point to the database shared with the legacy application.
 */
export const TEST_DATABASE_URL = 'postgresql://ifumb_test:ifumb_test@localhost:55432/ifumb_test'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])
const require = createRequire(import.meta.url)

function assertLocalDatabase(url: string): void {
  const { hostname } = new URL(url)
  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(`Refusing to run test migrations against a non-local database (${hostname}).`)
  }
}

/** Starts the test container if needed and applies the copied legacy migrations to it. */
export function prepareTestDatabase(): void {
  assertLocalDatabase(TEST_DATABASE_URL)
  execFileSync('docker', ['compose', '-f', 'docker-compose.test.yml', 'up', '-d', '--wait'], {
    stdio: 'inherit',
  })
  execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: { ...process.env, DIRECT_URL: TEST_DATABASE_URL, PRISMA_HIDE_UPDATE_MESSAGE: '1' },
  })
}

/** Empties the account table (and, by cascade, everything owned by accounts). */
export async function clearTestAccounts(): Promise<void> {
  assertLocalDatabase(TEST_DATABASE_URL)
  const client = new Client({ connectionString: TEST_DATABASE_URL })
  await client.connect()
  try {
    await client.query('TRUNCATE TABLE "User" CASCADE')
  } finally {
    await client.end()
  }
}
