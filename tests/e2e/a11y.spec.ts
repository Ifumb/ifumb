import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { registerThroughUi } from '@tests/e2e/support/accounts'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const PUBLIC_PAGES = [
  { name: 'home', path: '/' },
  { name: 'not found', path: '/this-page-does-not-exist' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'forgot password', path: '/forgot-password' },
  { name: 'reset password', path: '/reset-password?token=sample-token' },
] as const

async function expectNoViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  expect(results.violations).toEqual([])
}

for (const { name, path } of PUBLIC_PAGES) {
  test(`the ${name} page has no detectable accessibility violation`, async ({ page }) => {
    await page.goto(path)

    await expectNoViolations(page)
  })
}

test('a form showing validation errors has no detectable accessibility violation', async ({
  page,
}) => {
  await page.goto('/register')
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Le formulaire contient' })).toBeFocused()

  await expectNoViolations(page)
})

test('the signed-in pages have no detectable accessibility violation', async ({ page }) => {
  await registerThroughUi(page)
  await expectNoViolations(page)

  await page.goto('/account/password')
  await expectNoViolations(page)
})

test('the skip link is the first focusable element and targets the main content', async ({
  page,
}) => {
  await page.goto('/')

  await page.keyboard.press('Tab')

  const skipLink = page.getByRole('link', { name: 'Aller au contenu' })
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toHaveAttribute('href', '#main')
})
