import { expect, type Page } from '@playwright/test'

export const E2E_PASSWORD = 'E2e-password-123'

/**
 * reason: hashing uses bcrypt cost 12 (legacy hashes must keep verifying) in pure JavaScript, on the
 * single thread of the test server. When every parallel worker signs up at once against a server
 * that just started, the redirect can take longer than the default 5 s expectation.
 */
const SIGN_UP_TIMEOUT_MS = 15_000

export type TestAccount = { readonly email: string; readonly fullName: string }

/** A fresh address per call, so tests running in parallel never share an account. */
export function uniqueEmail(): string {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `e2e+${suffix}@ifumb.test`
}

export async function registerThroughUi(page: Page): Promise<TestAccount> {
  const email = uniqueEmail()
  await page.goto('/register')
  await page.getByLabel('Prénom', { exact: true }).fill('Awa')
  await page.getByLabel('Nom', { exact: true }).fill('Diallo')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(E2E_PASSWORD)
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: SIGN_UP_TIMEOUT_MS })
  return { email, fullName: 'Awa Diallo' }
}
