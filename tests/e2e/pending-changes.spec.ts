import type { Page } from '@playwright/test'
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

const heading = (page: Page, name: string) =>
  page.getByRole('heading', { level: 1, name, exact: true })

async function treeWithEditor(page: Page) {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille Diallo',
    visibility: 'PRIVATE',
  })
  const awa = await seedMember(treeId, { firstName: 'Awa', lastName: 'Diallo', tribe: 'Peul' })
  const moussa = await seedMember(treeId, { firstName: 'Moussa', lastName: 'Diallo' })
  return { treeId, awa, moussa }
}

test('the owner approves a proposal, which the editor sees applied', async ({ page, browser }) => {
  const { treeId, awa } = await treeWithEditor(page)
  const editorContext = await newVisitorContext(browser)
  const editor = await editorContext.newPage()
  const account = await registerThroughUi(editor)
  await seedAcceptedInvitation(treeId, account.email, 'EDITOR')

  await editor.goto(`/tree/${treeId}/member/${awa}/edit`)
  await editor.getByLabel('Tribu').fill('Soninke')
  await editor.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(
    editor.getByRole('status').filter({ hasText: 'Proposition envoyée' }),
  ).toBeVisible()

  await page.goto(`/tree/${treeId}/pending`)
  await expect(heading(page, `Modifications en attente — Famille Diallo`)).toBeVisible()
  await expect(page.getByText('1 modification en attente.')).toBeVisible()
  await expectNoAccessibilityViolations(page)

  await page.getByRole('button', { name: /^Approuver/ }).click()
  await expect(page.getByRole('status').filter({ hasText: 'approuvée' })).toBeVisible()

  await page.goto(`/tree/${treeId}/member/${awa}`)
  await expect(page.getByText('Soninke')).toBeVisible()
  await editorContext.close()
})

test('the owner rejects a proposal with a comment, which its author reads', async ({
  page,
  browser,
}) => {
  const { treeId, awa } = await treeWithEditor(page)
  const editorContext = await newVisitorContext(browser)
  const editor = await editorContext.newPage()
  const account = await registerThroughUi(editor)
  await seedAcceptedInvitation(treeId, account.email, 'EDITOR')

  await editor.goto(`/tree/${treeId}/member/${awa}/edit`)
  await editor.getByLabel('Biographie').fill('Texte à vérifier.')
  await editor.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(
    editor.getByRole('status').filter({ hasText: 'Proposition envoyée' }),
  ).toBeVisible()

  await page.goto(`/tree/${treeId}/pending`)
  await page.getByLabel('Commentaire (facultatif)').fill('Merci de citer une source.')
  await page.getByRole('button', { name: /^Rejeter/ }).click()
  await expect(page.getByRole('status').filter({ hasText: 'rejetée' })).toBeVisible()

  await page.goto(`/tree/${treeId}/member/${awa}`)
  await expect(page.getByText('Texte à vérifier.')).toHaveCount(0)

  await editor.goto(`/tree/${treeId}/pending`)
  await expect(heading(editor, 'Mes propositions')).toBeVisible()
  await expect(editor.getByText('Rejetée')).toBeVisible()
  await expectNoAccessibilityViolations(editor)
  await editorContext.close()
})

test('the owner approves every pending proposal at once, after confirming', async ({
  page,
  browser,
}) => {
  const { treeId, awa, moussa } = await treeWithEditor(page)
  const editorContext = await newVisitorContext(browser)
  const editor = await editorContext.newPage()
  const account = await registerThroughUi(editor)
  await seedAcceptedInvitation(treeId, account.email, 'EDITOR')

  await editor.goto(`/tree/${treeId}/member/${awa}/edit`)
  await editor.getByLabel('Tribu').fill('Soninke')
  await editor.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await editor.goto(`/tree/${treeId}/member/${moussa}/edit`)
  await editor.getByLabel('Biographie').fill('Né à Labé.')
  await editor.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(
    editor.getByRole('status').filter({ hasText: 'Proposition envoyée' }),
  ).toBeVisible()

  await page.goto(`/tree/${treeId}/pending`)
  await page.getByRole('link', { name: 'Tout approuver' }).click()
  await expect(heading(page, 'Tout approuver ?')).toBeVisible()
  await expectNoAccessibilityViolations(page)
  await page.getByRole('button', { name: 'Tout approuver' }).click()
  await expect(page.getByRole('status').filter({ hasText: '2 approuvée' })).toBeVisible()

  await page.goto(`/tree/${treeId}/member/${awa}`)
  await expect(page.getByText('Soninke')).toBeVisible()
  await editorContext.close()
})

test('an editor may not reach the bulk review pages', async ({ page, browser }) => {
  const { treeId } = await treeWithEditor(page)
  const editorContext = await newVisitorContext(browser)
  const editor = await editorContext.newPage()
  const account = await registerThroughUi(editor)
  await seedAcceptedInvitation(treeId, account.email, 'EDITOR')

  await editor.goto(`/tree/${treeId}/pending/approve-all`)
  await expect(heading(editor, 'Réservé au propriétaire')).toBeVisible()
  await editorContext.close()
})
