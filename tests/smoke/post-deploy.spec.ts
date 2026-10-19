import { expect, test } from '@playwright/test'

test('the deployed app is alive', async ({ request }) => {
  const health = await request.get('/api/health')

  expect(health.status()).toBe(200)
})

// reason: Chromium itself logs this through its Credential Management / FedCM probe on any page
// with a password field, independently of our code — not an application error.
const BROWSER_NOISE = ["Provider's accounts list is empty."]

test('the home page renders without console errors', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && !BROWSER_NOISE.includes(message.text())) {
      consoleErrors.push(message.text())
    }
  })
  const failedRequests: string[] = []
  page.on('response', (response) => {
    if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`)
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  expect(failedRequests).toEqual([])
  expect(consoleErrors).toEqual([])
})
