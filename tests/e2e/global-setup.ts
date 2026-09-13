import { clearTestAccounts, prepareTestDatabase } from '@tests/support/test-database'

export default async function globalSetup(): Promise<void> {
  prepareTestDatabase()
  await clearTestAccounts()
}
