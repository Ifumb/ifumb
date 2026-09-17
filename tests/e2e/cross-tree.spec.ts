import { randomUUID } from 'node:crypto'
import { registerThroughUi } from '@tests/e2e/support/accounts'
import {
  expect,
  expectNoAccessibilityViolations,
  newVisitorContext,
  test,
} from '@tests/e2e/support/fixtures'
import { seedMember } from '@tests/support/seed-family'
import { seedAcceptedInvitation } from '@tests/support/seed-invitations'
import { seedTree } from '@tests/support/seed-trees'

// A unique last name per test run: the matching algorithm requires an exact last name, and the
// test database is shared across every worker running in parallel — a common surname would risk
// picking up an unrelated test's members (same lesson as `contact-requests.spec.ts`).
function uniqueLastName(): string {
  return `Cissé-${randomUUID().slice(0, 8)}`
}

test('an owner computes suggestions, accepts one, the target owner approves it, and the link shows on both sides', async ({
  page,
  browser,
}) => {
  const lastName = uniqueLastName()
  const ownerA = await registerThroughUi(page)
  const sourceTreeId = await seedTree({
    ownerEmail: ownerA.email,
    name: 'Arbre Source',
    visibility: 'PUBLIC',
  })
  await seedMember(sourceTreeId, { firstName: 'Modou', lastName })

  const contextB = await newVisitorContext(browser)
  const pageB = await contextB.newPage()
  const ownerB = await registerThroughUi(pageB)
  const targetTreeId = await seedTree({
    ownerEmail: ownerB.email,
    name: 'Arbre Cible',
    visibility: 'PUBLIC',
  })
  await seedMember(targetTreeId, { firstName: 'Modou', lastName })

  await page.goto(`/tree/${sourceTreeId}/suggestions`)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Suggestions inter-arbres — Arbre Source' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Calculer les suggestions' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'trouvée' })).toBeVisible()
  await expectNoAccessibilityViolations(page)

  const suggestion = page.getByRole('listitem').filter({ hasText: 'Arbre Cible' })
  await expect(suggestion).toBeVisible()
  await suggestion.getByRole('button', { name: /^Accepter/ }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Correspondance acceptée' }),
  ).toBeVisible()

  await pageB.goto(`/tree/${targetTreeId}/connection-requests`)
  await expectNoAccessibilityViolations(pageB)
  const request = pageB.getByRole('listitem').filter({ hasText: 'Arbre Source' })
  await expect(request).toBeVisible()
  await request.getByRole('button', { name: /^Approuver/ }).click()
  await expect(
    pageB.getByRole('status').filter({ hasText: 'Demande de connexion approuvée' }),
  ).toBeVisible()

  await page.goto(`/tree/${sourceTreeId}/links`)
  await expectNoAccessibilityViolations(page)
  await expect(page.getByText('Arbre Cible')).toBeVisible()

  await pageB.goto(`/tree/${targetTreeId}/links`)
  await expect(pageB.getByText('Arbre Source')).toBeVisible()
  await contextB.close()
})

test('a suggestion rejection leaves no connection request behind', async ({ page, browser }) => {
  const lastName = uniqueLastName()
  const ownerA = await registerThroughUi(page)
  const sourceTreeId = await seedTree({
    ownerEmail: ownerA.email,
    name: 'Arbre Rejet Source',
    visibility: 'PUBLIC',
  })
  await seedMember(sourceTreeId, { firstName: 'Ibrahima', lastName })

  const contextB = await newVisitorContext(browser)
  const pageB = await contextB.newPage()
  const ownerB = await registerThroughUi(pageB)
  const targetTreeId = await seedTree({
    ownerEmail: ownerB.email,
    name: 'Arbre Rejet Cible',
    visibility: 'PUBLIC',
  })
  await seedMember(targetTreeId, { firstName: 'Ibrahima', lastName })

  await page.goto(`/tree/${sourceTreeId}/suggestions`)
  await page.getByRole('button', { name: 'Calculer les suggestions' }).click()
  const suggestion = page.getByRole('listitem').filter({ hasText: 'Arbre Rejet Cible' })
  await suggestion.getByRole('button', { name: /^Rejeter/ }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Suggestion rejetée' })).toBeVisible()
  await expect(page.getByText('Aucune suggestion à traiter.')).toBeVisible()

  await pageB.goto(`/tree/${targetTreeId}/connection-requests`)
  await expect(pageB.getByText('Aucune demande de connexion en attente.')).toBeVisible()
  await contextB.close()
})

test('an editor of the source tree never sees a suggestion pointing at a private tree they cannot read themselves', async ({
  page,
  browser,
}) => {
  const lastName = uniqueLastName()
  const owner = await registerThroughUi(page)
  const sourceTreeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Arbre Fuite Source',
    visibility: 'PRIVATE',
  })
  await seedMember(sourceTreeId, { firstName: 'Salif', lastName })

  // The owner also owns a second, PRIVATE tree — personally accessible to them, but to no one else.
  const privateTargetTreeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Arbre Fuite Privé',
    visibility: 'PRIVATE',
  })
  await seedMember(privateTargetTreeId, { firstName: 'Salif', lastName })

  const editorContext = await newVisitorContext(browser)
  const editorPage = await editorContext.newPage()
  const editor = await registerThroughUi(editorPage)
  await seedAcceptedInvitation(sourceTreeId, editor.email, 'EDITOR')

  // The owner computes suggestions: their own personal access to the private target tree widens
  // the candidate pool, and a match is found and stored against the source tree.
  await page.goto(`/tree/${sourceTreeId}/suggestions`)
  await page.getByRole('button', { name: 'Calculer les suggestions' }).click()
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Arbre Fuite Privé' }),
  ).toBeVisible()

  // The editor, who also has access to the source tree, must not see that same suggestion: they
  // have no personal access to the private target tree it points at (the authorization leak the
  // legacy app had — module 3.2, decision 1).
  await editorPage.goto(`/tree/${sourceTreeId}/suggestions`)
  await expect(editorPage.getByText('Aucune suggestion à traiter.')).toBeVisible()
  await expect(editorPage.getByText('Arbre Fuite Privé')).toHaveCount(0)
  await expectNoAccessibilityViolations(editorPage)
  await editorContext.close()
})
