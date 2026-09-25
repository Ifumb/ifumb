import { randomUUID } from 'node:crypto'
import type { Page } from '@playwright/test'
import { registerThroughUi } from '@tests/e2e/support/accounts'
import {
  expect,
  expectNoAccessibilityViolations,
  newVisitorContext,
  test,
} from '@tests/e2e/support/fixtures'
import { seedMember } from '@tests/support/seed-family'
import { seedTree } from '@tests/support/seed-trees'

// Other specs create public trees in the same database at the same time: every search in this
// file goes through a token unique to the test, so counts never depend on them.
const uniqueToken = () => `Zx${randomUUID().slice(0, 8)}`

const treeCards = (page: Page) =>
  page.getByRole('region', { name: 'Arbres publics' }).getByRole('listitem')

// The page also has a "discoverable members" status region (module 3.1): scoped here so a search
// that matches nothing on that side never makes `getByRole('status')` ambiguous.
const publicMembers = (page: Page) =>
  page.getByRole('region', { name: 'Membres des arbres publics' })

test('an anonymous visitor explores public trees, never private ones', async ({
  page,
  browser,
}) => {
  const token = uniqueToken()
  const owner = await registerThroughUi(page)
  const publicTree = await seedTree({
    ownerEmail: owner.email,
    name: `Famille ${token} publique`,
    visibility: 'PUBLIC',
  })
  await seedTree({
    ownerEmail: owner.email,
    name: `Famille ${token} privée`,
    visibility: 'PRIVATE',
  })
  await seedMember(publicTree, { firstName: 'Awa', tribe: `Tribu${token}` })

  const visitorContext = await newVisitorContext(browser)
  const visitor = await visitorContext.newPage()
  await visitor.goto('/')
  await visitor
    .getByRole('main')
    .getByRole('link', { name: /Explorer/ })
    .click()
  await expect(visitor.getByRole('heading', { level: 1, name: 'Explorer' })).toBeVisible()
  await expectNoAccessibilityViolations(visitor)

  await visitor.getByLabel('Rechercher un arbre ou un propriétaire').fill(token)
  await visitor.getByRole('button', { name: 'Rechercher' }).click()

  await expect(visitor.getByRole('status')).toHaveText('1 arbre trouvé.')
  await expect(treeCards(visitor)).toContainText([`par Awa Diallo · 1 membre`])
  await treeCards(visitor)
    .getByRole('link', { name: `Famille ${token} publique` })
    .click()
  await expect(
    visitor.getByRole('heading', { level: 1, name: `Famille ${token} publique` }),
  ).toBeVisible()
  await visitorContext.close()
})

test('tribe and ethnicity filters apply together, and the listing pages', async ({ page }) => {
  const token = uniqueToken()
  const owner = await registerThroughUi(page)
  const seed = async (suffix: string, member: { tribe?: string; ethnicity?: string } = {}) => {
    const treeId = await seedTree({
      ownerEmail: owner.email,
      name: `Arbre ${token} ${suffix}`,
      visibility: 'PUBLIC',
    })
    if (member.tribe || member.ethnicity)
      await seedMember(treeId, { firstName: 'Membre', ...member })
  }
  await seed('both', { tribe: `Tribu${token}`, ethnicity: `Ethnie${token}` })
  await seed('tribe', { tribe: `Tribu${token}` })
  for (let index = 0; index < 20; index += 1) await seed(`n${index}`)

  await page.goto(`/explore?q=${token}`)
  await expect(page.getByRole('status')).toHaveText('22 arbres trouvés.')
  await expect(treeCards(page)).toHaveCount(20)
  const pagination = page.getByRole('navigation', { name: 'Pagination' })
  await expect(pagination).toContainText('Page 1 sur 2')
  await pagination.getByRole('link', { name: 'Page suivante' }).click()
  await expect(treeCards(page)).toHaveCount(2)

  await page.getByLabel('Tribu', { exact: true }).selectOption(`Tribu${token}`)
  await page.getByLabel('Ethnie', { exact: true }).selectOption(`Ethnie${token}`)
  await page.getByRole('button', { name: 'Rechercher' }).click()
  await expect(page.getByRole('status')).toHaveText('1 arbre trouvé.')
  await expect(treeCards(page).getByRole('link')).toHaveText([`Arbre ${token} both`])
  await expectNoAccessibilityViolations(page)

  await page.getByRole('link', { name: 'Réinitialiser' }).click()
  await expect(page).toHaveURL(/\/explore$/)
})

test('the member search finds members of public trees only, and leads to their profile', async ({
  page,
}) => {
  const token = uniqueToken()
  const owner = await registerThroughUi(page)
  const publicTree = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille publique',
    visibility: 'PUBLIC',
  })
  const privateTree = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille privée',
    visibility: 'PRIVATE',
  })
  await seedMember(publicTree, { firstName: `Awa${token}`, lastName: 'Diallo', tribe: 'Peul' })
  await seedMember(privateTree, { firstName: `Awa${token}`, lastName: 'Secret' })

  await page.goto('/explore/members')
  await expect(publicMembers(page).getByRole('status')).toHaveText(
    'Saisissez un nom, une tribu ou une région pour commencer.',
  )

  await page.getByLabel('Rechercher un membre').fill(token)
  await page.getByRole('button', { name: 'Rechercher' }).click()

  await expect(publicMembers(page).getByRole('status')).toHaveText(
    `1 membre trouvé pour « ${token} ».`,
  )
  await expect(page.getByText('Secret')).toHaveCount(0)
  await expectNoAccessibilityViolations(page)
  await page.getByRole('link', { name: `Awa${token} Diallo` }).click()
  await expect(page.getByRole('heading', { level: 1, name: `Awa${token} Diallo` })).toBeVisible()
})

test('a visitor searching too often is asked to wait', async ({ page }) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    expect((await page.request.get('/explore/members?q=rate')).ok()).toBe(true)
  }

  await page.goto('/explore/members?q=rate')

  await expect(page.getByRole('heading', { name: 'Trop de recherches' })).toBeVisible()
  await expect(
    page.getByRole('alert').filter({ hasText: 'Réessayez dans une minute' }),
  ).toBeVisible()
})
