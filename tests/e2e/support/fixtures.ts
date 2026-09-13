import AxeBuilder from '@axe-core/playwright'
import {
  test as base,
  expect,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

/**
 * An address from the IPv6 documentation prefix. Each test gets its own, so per-IP rate-limit
 * budgets never add up across a whole parallel run.
 */
export function uniqueClientIp(): string {
  const hextet = () => Math.floor(Math.random() * 0xffff).toString(16)
  return `2001:db8::${hextet()}:${hextet()}:${hextet()}`
}

/** Playwright `test` whose default browser context presents a unique client IP. */
export const test = base.extend({
  // The fixture callback is named `provide` rather than Playwright's usual `use`: the React hooks
  // lint rule would otherwise mistake it for React's `use` hook.
  context: async ({ context }, provide) => {
    await context.setExtraHTTPHeaders({ 'x-forwarded-for': uniqueClientIp() })
    await provide(context)
  },
})

/** A second, separate visitor (anonymous until it signs in), with its own client IP. */
export async function newVisitorContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext()
  await context.setExtraHTTPHeaders({ 'x-forwarded-for': uniqueClientIp() })
  return context
}

export async function expectNoAccessibilityViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  expect(results.violations).toEqual([])
}

export { expect }
