import { expect, test, type Page } from '@playwright/test'
import { uniqueEmail } from '@tests/e2e/support/accounts'

const LOGIN_ATTEMPTS_PER_EMAIL = 5
const TOO_MANY_ATTEMPTS = 'Trop de tentatives en peu de temps'

/** An address from the IPv6 documentation prefix, so each test gets its own per-IP budget. */
function uniqueClientIp(): string {
  const hextet = () => Math.floor(Math.random() * 0xffff).toString(16)
  return `2001:db8::${hextet()}:${hextet()}:${hextet()}`
}

async function submitLogin(page: Page, email: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Mot de passe', { exact: true }).fill('not-the-password')
  await page.getByRole('button', { name: 'Se connecter' }).click()
}

test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ 'x-forwarded-for': uniqueClientIp() })
})

test('login attempts beyond the per-email budget are refused and announced', async ({ page }) => {
  const email = uniqueEmail()
  for (let attempt = 0; attempt < LOGIN_ATTEMPTS_PER_EMAIL; attempt++) {
    await submitLogin(page, email)
    await expect(page.getByRole('alert').filter({ hasText: 'incorrect' })).toBeVisible()
  }

  await submitLogin(page, email)

  const summary = page.getByRole('alert').filter({ hasText: TOO_MANY_ATTEMPTS })
  await expect(summary).toBeFocused()
})

test('attempts made directly against the Auth.js endpoint count against the login form', async ({
  page,
}) => {
  const email = uniqueEmail()
  const { csrfToken } = await (await page.request.get('/api/auth/csrf')).json()
  for (let attempt = 0; attempt < LOGIN_ATTEMPTS_PER_EMAIL; attempt++) {
    await page.request.post('/api/auth/callback/credentials', {
      form: { csrfToken, email, password: 'not-the-password', callbackUrl: '/' },
      maxRedirects: 0,
    })
  }

  await submitLogin(page, email)

  await expect(page.getByRole('alert').filter({ hasText: TOO_MANY_ATTEMPTS })).toBeFocused()
})
