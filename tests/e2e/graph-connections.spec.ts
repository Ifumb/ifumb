import { randomUUID } from 'node:crypto'
import { registerThroughUi } from '@tests/e2e/support/accounts'
import {
  expect,
  expectNoAccessibilityViolations,
  newVisitorContext,
  test,
} from '@tests/e2e/support/fixtures'
import { seedAcceptedInvitation } from '@tests/support/seed-invitations'
import { seedMember } from '@tests/support/seed-family'
import { seedTree } from '@tests/support/seed-trees'

// A unique last name per test run: the matching algorithm requires an exact last name, and the
// test database is shared across every worker running in parallel (same lesson as `cross-tree.spec.ts`).
function uniqueLastName(): string {
  return `Barry-${randomUUID().slice(0, 8)}`
}

test('the owner computes connections from the graph panel and accepts one, inline', async ({
  page,
  browser,
}) => {
  const lastName = uniqueLastName()
  const owner = await registerThroughUi(page)
  const sourceTreeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Arbre Panneau Source',
    visibility: 'PUBLIC',
  })
  await seedMember(sourceTreeId, { firstName: 'Aissatou', lastName })

  const targetContext = await newVisitorContext(browser)
  const targetPage = await targetContext.newPage()
  const targetOwner = await registerThroughUi(targetPage)
  const targetTreeId = await seedTree({
    ownerEmail: targetOwner.email,
    name: 'Arbre Panneau Cible',
    visibility: 'PUBLIC',
  })
  await seedMember(targetTreeId, { firstName: 'Aissatou', lastName })
  await targetContext.close()

  await page.goto(`/tree/${sourceTreeId}/graph`)

  await page.getByRole('button', { name: 'Connexions', exact: true }).click()
  const panel = page.getByRole('region', { name: 'Connexions inter-arbres' })
  await panel.getByRole('button', { name: 'Chercher des connexions' }).click()

  const suggestion = panel.getByRole('listitem').filter({ hasText: 'Arbre Panneau Cible' })
  await expect(suggestion).toBeVisible()
  await expectNoAccessibilityViolations(page)

  await suggestion.getByRole('button', { name: 'Accepter' }).click()
  await expect(suggestion).toHaveCount(0)
  await expect(panel.getByText('Aucune correspondance trouvée.')).toBeVisible()

  // Instant, in place: no navigation.
  await expect(page).toHaveURL(`/tree/${sourceTreeId}/graph`)

  await panel.getByRole('button', { name: 'Fermer' }).click()
  await expect(panel).toHaveCount(0)
})

test('a viewer never sees the Connexions tool; an editor does', async ({ page, browser }) => {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Arbre Visibilité Connexions',
    visibility: 'PUBLIC',
  })

  const viewerContext = await newVisitorContext(browser)
  const viewerPage = await viewerContext.newPage()
  const viewer = await registerThroughUi(viewerPage)
  await seedAcceptedInvitation(treeId, viewer.email, 'VIEWER')
  await viewerPage.goto(`/tree/${treeId}/graph`)
  await expect(viewerPage.getByRole('button', { name: 'Connexions', exact: true })).toHaveCount(0)
  await viewerContext.close()

  const editorContext = await newVisitorContext(browser)
  const editorPage = await editorContext.newPage()
  const editor = await registerThroughUi(editorPage)
  await seedAcceptedInvitation(treeId, editor.email, 'EDITOR')
  await editorPage.goto(`/tree/${treeId}/graph`)
  await expect(editorPage.getByRole('button', { name: 'Connexions', exact: true })).toBeVisible()
  await editorContext.close()
})
