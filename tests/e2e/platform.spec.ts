import { expect, test } from '@playwright/test'

const PUBLIC_PAGES = ['/', '/login', '/register', '/forgot-password'] as const

test('the liveness probe answers 200 and is never cached', async ({ request }) => {
  const response = await request.get('/api/health')

  expect([response.status(), response.headers()['cache-control'], await response.json()]).toEqual([
    200,
    'no-store',
    { status: 'ok' },
  ])
})

test('pages are served with the security headers', async ({ request }) => {
  const headers = (await request.get('/')).headers()

  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(headers['strict-transport-security']).toContain('max-age=')
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(headers['permissions-policy']).toContain('camera=()')
})

test('the sitemap lists public entry points and no signed-in area', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()

  expect([sitemap.includes('/register'), sitemap.includes('/dashboard')]).toEqual([true, false])
})

test('robots.txt keeps crawlers out of private areas and points to the sitemap', async ({
  request,
}) => {
  const robots = await (await request.get('/robots.txt')).text()

  expect(robots).toContain('Disallow: /reset-password')
  expect(robots).toContain('Sitemap: ')
})

test('the password reset page, whose URL carries a token, asks not to be indexed', async ({
  page,
}) => {
  await page.goto('/reset-password?token=sample-token')

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
})

test('each public page has its own description', async ({ page }) => {
  const descriptions: string[] = []
  for (const path of PUBLIC_PAGES) {
    await page.goto(path)
    descriptions.push(
      (await page.locator('meta[name="description"]').getAttribute('content')) ?? '',
    )
  }

  expect(new Set(descriptions.filter(Boolean)).size).toBe(PUBLIC_PAGES.length)
})
