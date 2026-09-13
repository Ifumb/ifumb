import { registerThroughUi } from '@tests/e2e/support/accounts'
import {
  expect,
  expectNoAccessibilityViolations,
  newVisitorContext,
  test,
} from '@tests/e2e/support/fixtures'
import { seedTree } from '@tests/support/seed-trees'

test('a new account starts with an empty tree list', async ({ page }) => {
  await registerThroughUi(page)

  await expect(page.getByText('Aucun arbre généalogique pour l’instant.')).toBeVisible()
})

test('the dashboard lists a tree with its facts, and leads to the tree', async ({ page }) => {
  const account = await registerThroughUi(page)
  await seedTree({
    ownerEmail: account.email,
    name: 'Famille Diallo',
    visibility: 'SHARED',
    memberFirstNames: ['Awa', 'Moussa', 'Fatou'],
  })
  await page.reload()

  const card = page.getByRole('article').filter({ hasText: 'Famille Diallo' })
  await expect(card).toContainText('3 membres')
  await expect(card).toContainText('Partagé')
  await expect(card).toContainText('Propriétaire')
  await expectNoAccessibilityViolations(page)

  await card.getByRole('link', { name: 'Famille Diallo' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Famille Diallo' })).toBeVisible()
  await expect(page).toHaveTitle(/Famille Diallo/)
  await expectNoAccessibilityViolations(page)
})

test('a public tree can be read without an account', async ({ page, browser }) => {
  const account = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: account.email,
    name: 'Famille ouverte',
    visibility: 'PUBLIC',
  })
  const visitorContext = await newVisitorContext(browser)
  const visitor = await visitorContext.newPage()

  await visitor.goto(`/tree/${treeId}`)

  await expect(visitor.getByRole('heading', { level: 1, name: 'Famille ouverte' })).toBeVisible()
  await expect(visitor.getByText('Lecteur')).toBeVisible()
  await visitorContext.close()
})

test('a private tree asks an anonymous visitor to sign in, without revealing its name', async ({
  page,
  browser,
}) => {
  const account = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: account.email,
    name: 'Famille secrète',
    visibility: 'PRIVATE',
  })
  const visitorContext = await newVisitorContext(browser)
  const visitor = await visitorContext.newPage()

  await visitor.goto(`/tree/${treeId}`)

  await expect(
    visitor.getByRole('heading', { level: 1, name: 'Cet arbre est privé' }),
  ).toBeVisible()
  await expect(visitor.getByRole('link', { name: 'Se connecter' })).toBeVisible()
  await expect(visitor).toHaveTitle(/Arbre privé/)
  await expect(visitor.getByText('Famille secrète')).toHaveCount(0)
  await expectNoAccessibilityViolations(visitor)
  await visitorContext.close()
})

test('a private tree is refused to another signed-in account', async ({ page, browser }) => {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille secrète',
    visibility: 'PRIVATE',
  })
  const strangerContext = await newVisitorContext(browser)
  const stranger = await strangerContext.newPage()
  await registerThroughUi(stranger)

  await stranger.goto(`/tree/${treeId}`)

  await expect(
    stranger.getByRole('heading', { level: 1, name: 'Cet arbre est privé' }),
  ).toBeVisible()
  await expect(stranger.getByRole('link', { name: 'Se connecter' })).toHaveCount(0)
  await expect(stranger.getByRole('link', { name: 'Revenir à mes arbres' })).toBeVisible()
  await strangerContext.close()
})

test('an unknown tree shows the tree-specific not found page with a 404', async ({ page }) => {
  const response = await page.goto('/tree/this-tree-does-not-exist')

  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1, name: 'Arbre introuvable' })).toBeVisible()
  await expectNoAccessibilityViolations(page)
})
