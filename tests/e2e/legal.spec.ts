import { expect, expectNoAccessibilityViolations, test } from '@tests/e2e/support/fixtures'

const PAGES = [
  { path: '/legal/mentions-legales', heading: 'Mentions légales' },
  { path: '/legal/confidentialite', heading: 'Politique de confidentialité' },
  { path: '/legal/cgu', heading: 'Conditions générales d’utilisation' },
  { path: '/legal/credits', heading: 'Crédits et licences tierces' },
] as const

for (const { path, heading } of PAGES) {
  test(`the legal page at ${path} renders its draft banner`, async ({ page }) => {
    await page.goto(path)

    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    await expect(page.getByRole('note')).toContainText('Brouillon à faire valider')
    await expectNoAccessibilityViolations(page)
  })
}

test('the app footer links to every legal page from a regular page', async ({ page }) => {
  await page.goto('/explore')
  const footer = page.getByRole('contentinfo')

  await expect(footer.getByRole('link', { name: 'Mentions légales' })).toHaveAttribute(
    'href',
    '/legal/mentions-legales',
  )
  await expect(footer.getByRole('link', { name: 'Confidentialité' })).toHaveAttribute(
    'href',
    '/legal/confidentialite',
  )
  await expect(footer.getByRole('link', { name: 'CGU' })).toHaveAttribute('href', '/legal/cgu')
  await expect(footer.getByRole('link', { name: 'Crédits' })).toHaveAttribute(
    'href',
    '/legal/credits',
  )
})

test('the app footer is hidden on the landing page, which carries its own legal links', async ({
  page,
}) => {
  await page.goto('/')
  // reason: la landing a son propre pied de page, imbrique dans <main> : il perd le role de repere
  // "contentinfo" (regle HTML pour un <footer> descendant de <main>), d'ou la recherche par sa nav.
  const footerNav = page.getByRole('navigation', { name: 'Informations légales' })

  await expect(footerNav.getByRole('link', { name: 'Mentions légales' })).toBeVisible()
  await expect(footerNav.getByRole('link', { name: 'Confidentialité' })).toBeVisible()
  await expect(footerNav.getByRole('link', { name: 'CGU' })).toBeVisible()
  await expect(footerNav.getByRole('link', { name: 'Crédits' })).toBeVisible()
  await expect(page.getByRole('contentinfo')).toHaveCount(0)
})
