import { expect, test } from '@playwright/test'

test('the deployed app is alive', async ({ request }) => {
  const health = await request.get('/api/health')

  expect(health.status()).toBe(200)
})

test('the home page renders without console errors', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  expect(consoleErrors).toEqual([])
})
