import { expect, test } from '@tests/e2e/support/fixtures'
import { E2E_PASSWORD, registerThroughUi, uniqueEmail } from '@tests/e2e/support/accounts'

test('a visitor registers, signs out, then signs back in', async ({ page }) => {
  const account = await registerThroughUi(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Mes arbres' })).toBeVisible()
  await expect(page.getByText(`Connecté en tant que ${account.fullName}`)).toBeVisible()

  await page.getByRole('button', { name: 'Se déconnecter' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel('Email', { exact: true }).fill(account.email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(E2E_PASSWORD)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
})

test('wrong credentials are announced and receive focus, keeping the typed email', async ({
  page,
}) => {
  const email = uniqueEmail()
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Mot de passe', { exact: true }).fill('not-the-password')
  await page.getByRole('button', { name: 'Se connecter' }).click()

  const summary = page.getByRole('alert').filter({ hasText: 'Email ou mot de passe incorrect' })
  await expect(summary).toBeFocused()
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(email)
})

test('an anonymous visitor of a signed-in page is sent to the login page', async ({ page }) => {
  await page.goto('/account/password')

  await expect(page).toHaveURL(/\/login/)
})

test('a signed-in user changes their password and is told so', async ({ page }) => {
  await registerThroughUi(page)
  await page.getByRole('link', { name: 'Changer le mot de passe' }).click()

  await page.getByLabel('Mot de passe actuel', { exact: true }).fill(E2E_PASSWORD)
  await page.getByLabel('Nouveau mot de passe', { exact: true }).fill('Another-password-456')
  await page.getByLabel('Confirmer le nouveau mot de passe').fill('Another-password-456')
  await page.getByRole('button', { name: 'Modifier le mot de passe' }).click()

  await expect(page.getByRole('status')).toHaveText(/Votre mot de passe a été modifié/)
})
