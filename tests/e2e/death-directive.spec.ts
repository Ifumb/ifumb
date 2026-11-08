import { registerThroughUi } from '@tests/e2e/support/accounts'
import { expect, expectNoAccessibilityViolations, test } from '@tests/e2e/support/fixtures'

test('an account holder declares, then edits, their death directive', async ({ page }) => {
  await registerThroughUi(page)
  await page.getByRole('banner').getByRole('link', { name: 'Changer le mot de passe' }).click()
  await page.getByRole('link', { name: 'Souhaits après mon décès' }).click()
  await expect(page).toHaveURL(/\/account\/death-directive$/)
  await expectNoAccessibilityViolations(page)

  await page.getByLabel('Vos souhaits').fill('Gardez mon arbre accessible à mes proches.')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByRole('status')).toContainText('Vos souhaits ont été enregistrés.')

  await page.reload()
  await expect(page.getByLabel('Vos souhaits')).toHaveValue(
    'Gardez mon arbre accessible à mes proches.',
  )

  await page.getByRole('main').getByRole('link', { name: 'Changer le mot de passe' }).click()
  await expect(page).toHaveURL(/\/account\/password$/)
})
