import { registerThroughUi } from '@tests/e2e/support/accounts'
import { expect, expectNoAccessibilityViolations, test } from '@tests/e2e/support/fixtures'

// reason: les scénarios gardent leurs actions et assertions ensemble pour rester lisibles de bout en bout.
test('the anonymous landing page presents the product and its calls to action', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1, name: /Chaque famille/ })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /Un arbre qui vous/ })).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 2, name: /Vos racines prennent vie/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Commencer gratuitement', exact: true }),
  ).toHaveAttribute('href', '/register')
  await expect(
    page.getByRole('link', { name: 'Explorer les arbres publics', exact: true }).first(),
  ).toHaveAttribute('href', '/explore')
  await expect(page.getByRole('link', { name: /Se connecter/ }).first()).toBeVisible()
  await expectNoAccessibilityViolations(page)
})

test('a signed-in visitor sees a call to action to their own trees, not the sign-up ones', async ({
  page,
}) => {
  await registerThroughUi(page)
  await page.goto('/')

  await expect(
    page.getByRole('link', { name: 'Accéder à mes arbres', exact: true }).first(),
  ).toHaveAttribute('href', '/dashboard')
  await expect(page.getByRole('link', { name: 'Commencer gratuitement', exact: true })).toHaveCount(
    0,
  )
  await expect(page.getByRole('link', { name: /Déjà un compte/ })).toHaveCount(0)
  await expect(page.locator('.landing a[href="/register"]')).toHaveCount(0)
  await expect(page.locator('.landing a[href="/login"]')).toHaveCount(0)
  await expectNoAccessibilityViolations(page)
})

test('the product preview has a meaningful alternative text', async ({ page }) => {
  await page.goto('/')

  const preview = page.getByRole('img', { name: /Arbre généalogique IFUMB/ })
  await expect(preview).toBeVisible()
  await expect(preview).toHaveJSProperty('complete', true)
  await expect(preview).not.toHaveJSProperty('naturalWidth', 0)
})

test('visitors can navigate sections and read answers using the keyboard', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Aller au contenu' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main')).toBeFocused()
  await page
    .getByRole('navigation', { name: 'Découvrir IFUMB' })
    .getByRole('link', { name: 'Comment ça marche' })
    .click()
  await expect(page).toHaveURL(/#comment-ca-marche$/)
  const question = page.locator('summary').filter({ hasText: 'Qui peut voir mon arbre' })
  await question.focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByText('Votre arbre est privé par défaut. Vous choisissez les personnes'),
  ).toBeVisible()
  await expectNoAccessibilityViolations(page)
  await page.keyboard.press('Enter')
  await expect(
    page.getByText('Votre arbre est privé par défaut. Vous choisissez les personnes'),
  ).toBeHidden()
})

test('the landing page fits a narrow mobile screen and its main action opens registration', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(pageWidth).toBe(360)
  await expectNoAccessibilityViolations(page)
  await page.getByRole('link', { name: 'Commencer gratuitement', exact: true }).click()
  await expect(page).toHaveURL(/\/register$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
