import { expect, test } from '@tests/e2e/support/fixtures'
import { E2E_PASSWORD, registerThroughUi, uniqueEmail } from '@tests/e2e/support/accounts'

test('registration is refused without confirming the age and accepting the terms', async ({
  page,
}) => {
  const email = uniqueEmail()
  await page.goto('/register')
  await page.getByLabel('Prénom', { exact: true }).fill('Awa')
  await page.getByLabel('Nom', { exact: true }).fill('Diallo')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(E2E_PASSWORD)
  await page.getByRole('button', { name: 'Créer mon compte' }).click()

  const summary = page.getByRole('alert').filter({ hasText: 'Le formulaire contient' })
  await expect(summary).toBeVisible()
  await expect(summary).toContainText("Déclaration d'âge")
  await expect(summary).toContainText('Acceptation des conditions')
  await expect(page).toHaveURL(/\/register$/)

  // reason: le navigateur vide le champ mot de passe apres une tentative de soumission.
  await page.getByLabel('Mot de passe', { exact: true }).fill(E2E_PASSWORD)
  await page.getByLabel('Je confirme avoir 16 ans ou plus.').check()
  await page
    .getByLabel(/J.accepte les conditions d.utilisation et la politique de confidentialité/)
    .check()
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
})

test('the registration consent checkboxes link to the real legal pages', async ({ page }) => {
  await page.goto('/register')

  await page.getByRole('link', { name: 'conditions d’utilisation' }).click()
  await expect(page).toHaveURL(/\/legal\/cgu$/)

  await page.goBack()
  await page.getByRole('link', { name: 'politique de confidentialité' }).click()
  await expect(page).toHaveURL(/\/legal\/confidentialite$/)
})

test('a visitor registers, signs out, then signs back in', async ({ page }) => {
  const account = await registerThroughUi(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Mes arbres' })).toBeVisible()
  await expect(
    page.getByRole('banner').getByText(account.fullName, { exact: true }).filter({ visible: true }),
  ).toBeVisible()

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
