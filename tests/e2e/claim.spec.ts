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

test('a collaborator claims their own member profile', async ({ page, browser }) => {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille Diallo',
    visibility: 'PRIVATE',
  })
  const awa = await seedMember(treeId, { firstName: 'Awa', lastName: 'Diallo' })
  const editorContext = await newVisitorContext(browser)
  const editor = await editorContext.newPage()
  const account = await registerThroughUi(editor)
  await seedAcceptedInvitation(treeId, account.email, 'VIEWER')

  await editor.goto(`/tree/${treeId}/member/${awa}`)
  await editor.getByRole('button', { name: 'C’est moi ?' }).click()
  await expect(editor.getByText('Revendiquée par vous.')).toBeVisible()
  await expect(editor.getByRole('button', { name: 'C’est moi ?' })).toHaveCount(0)
  await expectNoAccessibilityViolations(editor)
  await editorContext.close()
})

test('an account may not claim a second member in a different tree', async ({ page, browser }) => {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille Diallo',
    visibility: 'PRIVATE',
  })
  const otherTreeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille Touré',
    visibility: 'PRIVATE',
  })
  const awa = await seedMember(treeId, { firstName: 'Awa', lastName: 'Diallo' })
  const sekou = await seedMember(otherTreeId, { firstName: 'Sekou', lastName: 'Touré' })
  const editorContext = await newVisitorContext(browser)
  const editor = await editorContext.newPage()
  const account = await registerThroughUi(editor)
  await seedAcceptedInvitation(treeId, account.email, 'VIEWER')
  await seedAcceptedInvitation(otherTreeId, account.email, 'VIEWER')

  await editor.goto(`/tree/${treeId}/member/${awa}`)
  await editor.getByRole('button', { name: 'C’est moi ?' }).click()
  await expect(editor.getByText('Revendiquée par vous.')).toBeVisible()

  await editor.goto(`/tree/${otherTreeId}/member/${sekou}`)
  await editor.getByRole('button', { name: 'C’est moi ?' }).click()
  await expect(
    editor.getByRole('alert').filter({ hasText: 'déjà revendiqué une fiche dans un autre arbre' }),
  ).toBeVisible()
  await editorContext.close()
})
