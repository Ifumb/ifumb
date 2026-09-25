import type { Page } from '@playwright/test'
import { registerThroughUi } from '@tests/e2e/support/accounts'
import {
  expect,
  expectNoAccessibilityViolations,
  newVisitorContext,
  test,
} from '@tests/e2e/support/fixtures'
import { seedMember, seedUnion } from '@tests/support/seed-family'
import { seedCrossTreeLink } from '@tests/support/seed-cross-tree-links'
import { seedTree } from '@tests/support/seed-trees'

const canvas = (page: Page) => page.locator('.react-flow')
const memberNode = (page: Page, name: string) =>
  canvas(page).locator('.react-flow__node-member').filter({ hasText: name })

test('a member bridges into a linked tree; its branch merges into the graph, authorized by the link alone even into an otherwise PRIVATE tree', async ({
  page,
  browser,
}) => {
  const owner = await registerThroughUi(page)
  const sourceTreeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Arbre Source',
    visibility: 'PRIVATE',
  })
  const awa = await seedMember(sourceTreeId, { firstName: 'Awa', lastName: 'Diallo' })

  // A second, unrelated account owns the foreign tree — the visitor below has no access to it at
  // all beyond the CrossTreeLink itself (not its owner, never invited): module 3.3, decision 1.
  const foreignContext = await newVisitorContext(browser)
  const foreignPage = await foreignContext.newPage()
  const foreignOwner = await registerThroughUi(foreignPage)
  await foreignContext.close()
  const foreignTreeId = await seedTree({
    ownerEmail: foreignOwner.email,
    name: 'Arbre Distant',
    visibility: 'PRIVATE',
  })
  // Fatou is the bridge's own pivot on the foreign side — merging folds her node onto Awa's, the
  // local member she stands for. Moussa, her spouse in the foreign tree, is what should actually
  // show up as new: he is a real second member of that tree, on the other side of a union.
  const fatou = await seedMember(foreignTreeId, { firstName: 'Fatou', lastName: 'Touré' })
  const moussa = await seedMember(foreignTreeId, { firstName: 'Moussa', lastName: 'Touré' })
  await seedUnion(foreignTreeId, { type: 'MARRIAGE', parentIds: [fatou, moussa], children: [] })
  await seedCrossTreeLink(sourceTreeId, awa, foreignTreeId, fatou)

  await page.goto(`/tree/${sourceTreeId}/graph`)
  await expect(page.getByRole('heading', { level: 1, name: 'Arbre Source' })).toBeVisible()
  await expect(memberNode(page, 'Moussa')).toHaveCount(0)

  const toggle = page.getByRole('button', { name: /^Afficher la branche de Arbre Distant/ })
  await expect(toggle).toBeVisible()
  await toggle.click()

  const foreignNode = memberNode(page, 'Moussa')
  await expect(foreignNode).toBeVisible()
  await expect(foreignNode.getByRole('link')).toHaveCount(0) // never clickable (decision 4)
  await expect(memberNode(page, 'Fatou')).toHaveCount(0) // folded onto Awa's own node, never duplicated
  await expectNoAccessibilityViolations(page)

  const collapse = page.getByRole('button', { name: /^Masquer la branche de Arbre Distant/ })
  await collapse.click()
  await expect(memberNode(page, 'Moussa')).toHaveCount(0)
})
