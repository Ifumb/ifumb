import type { Page } from '@playwright/test'
import { registerThroughUi } from '@tests/e2e/support/accounts'
import {
  expect,
  expectNoAccessibilityViolations,
  newVisitorContext,
  test,
} from '@tests/e2e/support/fixtures'
import { seedMember, seedUnion } from '@tests/support/seed-family'
import { seedPendingChange } from '@tests/support/seed-pending-changes'
import { seedTree } from '@tests/support/seed-trees'

/** Moussa and Awa, their daughter Fatou, and Fatou's son Ibrahima; Awa has a pending change. */
async function seedGraphFamily(page: Page, visibility: 'PRIVATE' | 'PUBLIC' = 'PRIVATE') {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({ ownerEmail: owner.email, name: 'Famille Diallo', visibility })
  const moussa = await seedMember(treeId, {
    firstName: 'Moussa',
    lastName: 'Diallo',
    tribe: 'Peul',
  })
  const awa = await seedMember(treeId, { firstName: 'Awa', lastName: 'Diallo', gender: 'FEMALE' })
  const fatou = await seedMember(treeId, { firstName: 'Fatou', lastName: 'Sow' })
  const ibrahima = await seedMember(treeId, { firstName: 'Ibrahima', lastName: 'Sow' })
  const child = (childId: string) => ({ childId, filiation: 'BIOLOGICAL' as const })
  await seedUnion(treeId, { type: 'MARRIAGE', parentIds: [moussa, awa], children: [child(fatou)] })
  await seedUnion(treeId, { type: 'BIOLOGICAL', parentIds: [fatou], children: [child(ibrahima)] })
  await seedPendingChange(treeId, { targetType: 'MEMBER', targetId: awa, action: 'UPDATE' })
  return { treeId, moussa, ibrahima }
}

const canvas = (page: Page) => page.locator('.react-flow')
const memberLinks = (page: Page) =>
  canvas(page).locator('.react-flow__node-member').getByRole('link')

test('the graph opens from the tree page and each member leads to their profile', async ({
  page,
}) => {
  const { treeId } = await seedGraphFamily(page)
  await page.goto(`/tree/${treeId}`)

  await page.getByRole('link', { name: 'Voir le graphe' }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Graphe — Famille Diallo' }),
  ).toBeVisible()
  await expect(memberLinks(page)).toHaveCount(4)
  await expect(page.getByRole('status').filter({ hasText: 'membres' })).toHaveText(
    '4 membres affichés.',
  )

  await page.getByText('Filtres', { exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(canvas(page).getByRole('link', { name: /^(Moussa|Awa) Diallo/ })).toHaveCount(2)
  const focusedName = await page.evaluate(() => document.activeElement?.textContent ?? '')
  expect(focusedName).toMatch(/^[A-Z]/)
  expect(await page.evaluate(() => !!document.activeElement?.closest('.react-flow'))).toBe(true)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/member\//)

  await page.goBack()
  await canvas(page)
    .getByRole('link', { name: /^Ibrahima Sow/ })
    .click()
  await expect(page.getByRole('heading', { level: 1, name: 'Ibrahima Sow' })).toBeVisible()
})

test('owners see pending markers, anonymous visitors of a public tree never do', async ({
  page,
  browser,
}) => {
  const { treeId } = await seedGraphFamily(page, 'PUBLIC')
  await page.goto(`/tree/${treeId}/graph`)
  await expect(canvas(page).getByText('En attente', { exact: true })).toBeVisible()
  await expectNoAccessibilityViolations(page)

  const visitorContext = await newVisitorContext(browser)
  const visitor = await visitorContext.newPage()
  await visitor.goto(`/tree/${treeId}/graph`)
  await expect(memberLinks(visitor)).toHaveCount(4)
  await expect(visitor.getByText('En attente')).toHaveCount(0)
  await visitorContext.close()
})

test('the graph of a private tree stays private, and an unknown tree is a 404', async ({
  page,
  browser,
}) => {
  const { treeId } = await seedGraphFamily(page)
  const visitorContext = await newVisitorContext(browser)
  const visitor = await visitorContext.newPage()

  await visitor.goto(`/tree/${treeId}/graph`)
  await expect(
    visitor.getByRole('heading', { level: 1, name: 'Cet arbre est privé' }),
  ).toBeVisible()
  await expect(visitor.getByText('Moussa')).toHaveCount(0)
  expect((await visitor.goto('/tree/unknown-tree/graph'))?.status()).toBe(404)
  await visitorContext.close()
})

test('filters hide the members that do not match', async ({ page }) => {
  const { treeId } = await seedGraphFamily(page)
  await page.goto(`/tree/${treeId}/graph`)
  await expect(memberLinks(page)).toHaveCount(4)

  await page.getByText('Filtres', { exact: true }).click()
  await page.getByLabel('Tribu', { exact: true }).selectOption('Peul')

  await expect(memberLinks(page)).toHaveCount(1)
  await expect(memberLinks(page)).toHaveAccessibleName(/^Moussa Diallo/)
  await expect(page.getByText('1 membre affiché sur 4.')).toBeVisible()
  await expectNoAccessibilityViolations(page)

  await page.getByRole('button', { name: 'Réinitialiser les filtres' }).click()
  await expect(memberLinks(page)).toHaveCount(4)
})

test('centring on a member makes distant relatives inert until the view is reset', async ({
  page,
}) => {
  const { treeId, moussa, ibrahima } = await seedGraphFamily(page)
  await page.goto(`/tree/${treeId}/graph`)
  const ibrahimaNode = canvas(page).locator(`[data-id="member_${ibrahima}"]`)
  await expect(memberLinks(page)).toHaveCount(4)

  await page.getByLabel('Centrer sur un membre').selectOption({ label: 'Moussa Diallo' })
  await page.getByRole('button', { name: 'Centrer', exact: true }).click()

  await expect(ibrahimaNode).toHaveAttribute('inert')
  await expect(canvas(page).locator(`[data-id="member_${moussa}"]`)).not.toHaveAttribute('inert')

  await page.getByRole('button', { name: 'Réinitialiser la vue' }).click()
  await expect(ibrahimaNode).not.toHaveAttribute('inert')
  await expect(page.getByLabel('Centrer sur un membre')).toBeFocused()
})

test('an empty tree explains that it has no member yet', async ({ page }) => {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Arbre vide',
    visibility: 'PRIVATE',
  })

  await page.goto(`/tree/${treeId}/graph`)

  await expect(page.getByText('Cet arbre ne contient encore aucun membre.')).toBeVisible()
  await expectNoAccessibilityViolations(page)
})
