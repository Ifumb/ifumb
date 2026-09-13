import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'not found', path: '/this-page-does-not-exist' },
] as const

for (const { name, path } of PAGES) {
  test(`the ${name} page has no detectable accessibility violation`, async ({ page }) => {
    await page.goto(path)

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

    expect(results.violations).toEqual([])
  })
}

test('the skip link is the first focusable element and targets the main content', async ({
  page,
}) => {
  await page.goto('/')

  await page.keyboard.press('Tab')

  const skipLink = page.getByRole('link', { name: 'Aller au contenu' })
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toHaveAttribute('href', '#main')
})
