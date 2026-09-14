import { registerThroughUi } from '@tests/e2e/support/accounts'
import { expect, test } from '@tests/e2e/support/fixtures'
import { seedTree } from '@tests/support/seed-trees'

// Prefetching happens once the page is idle; a negative check needs a moment to let it happen.
const PREFETCH_OBSERVATION_MS = 2_000

test('signed-in readers keep their account navigation on tree pages', async ({ page }) => {
  const account = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: account.email,
    name: 'Famille',
    visibility: 'PRIVATE',
  })

  await page.goto(`/tree/${treeId}`)

  const accountNav = page.getByRole('navigation', { name: 'Compte' })
  await expect(accountNav.getByRole('button', { name: 'Se déconnecter' })).toBeVisible()
})

test('the account navigation marks the current page and never prefetches it', async ({ page }) => {
  await registerThroughUi(page)
  const dashboardPrefetches: string[] = []
  page.on('request', (request) => {
    const isPrefetch = request.headers()['next-router-prefetch'] !== undefined
    if (isPrefetch && new URL(request.url()).pathname === '/dashboard') {
      dashboardPrefetches.push(request.url())
    }
  })

  await page.reload()
  await page.waitForTimeout(PREFETCH_OBSERVATION_MS)

  const currentLink = page.getByRole('navigation', { name: 'Compte' }).getByRole('link', {
    name: 'Mes arbres',
  })
  await expect(currentLink).toHaveAttribute('aria-current', 'page')
  expect(dashboardPrefetches).toEqual([])
})
