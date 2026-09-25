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
  const awa = await seedMember(treeId, { firstName: 'Awa', lastName: 'Diallo' })
  return { treeId, awa }
}

test('a proposal notifies the owner, who reads it then marks it read', async ({
  page,
  browser,
}) => {
  const { treeId, awa } = await treeWithEditor(page)
  const editorContext = await newVisitorContext(browser)
  const editor = await editorContext.newPage()
  const account = await registerThroughUi(editor)
  await seedAcceptedInvitation(treeId, account.email, 'EDITOR')

  await editor.goto(`/tree/${treeId}/member/${awa}/edit`)
  await editor.getByRole('tab', { name: 'Culture', exact: true }).click()
  await editor.getByLabel('Tribu').fill('Soninke')
  await editor.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(editor.getByRole('status').filter({ hasText: 'Proposition envoyée' })).toBeVisible()

  await page.goto(`/notifications`)
  await expect(heading(page, 'Notifications')).toBeVisible()
  await expect(page.getByText('1 notification non lue.')).toBeVisible()
  const item = page.getByRole('listitem').filter({ hasText: 'a proposé une modification' })
  await expect(item).toContainText('Famille Diallo')
  await expectNoAccessibilityViolations(page)

  await item.getByRole('link', { name: /a proposé une modification/ }).click()
  await expect(heading(page, 'Modifications en attente — Famille Diallo')).toBeVisible()

  await page.goto('/notifications')
  await item.getByRole('button', { name: 'Marquer comme lue' }).click()
  await expect(page.getByText('Aucune notification non lue.')).toBeVisible()
  await editorContext.close()
})

test('the owner marks every notification read at once', async ({ page, browser }) => {
  const { treeId, awa } = await treeWithEditor(page)
  const moussa = await seedMember(treeId, { firstName: 'Moussa', lastName: 'Diallo' })
  const editorContext = await newVisitorContext(browser)
  const editor = await editorContext.newPage()
  const account = await registerThroughUi(editor)
  await seedAcceptedInvitation(treeId, account.email, 'EDITOR')

  for (const memberId of [awa, moussa]) {
    await editor.goto(`/tree/${treeId}/member/${memberId}/edit`)
    await editor.getByRole('tab', { name: 'Bio', exact: true }).click()
    await editor.getByLabel('Biographie').fill('Texte.')
    await editor.getByRole('button', { name: 'Enregistrer les modifications' }).click()
    await expect(
      editor.getByRole('status').filter({ hasText: 'Proposition envoyée' }),
    ).toBeVisible()
  }

  await page.goto('/notifications')
  await expect(page.getByText('2 notifications non lues.')).toBeVisible()
  await page.getByRole('button', { name: 'Tout marquer comme lu' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'marquée' })).toBeVisible()
  await expect(page.getByText('Aucune notification non lue.')).toBeVisible()
  await editorContext.close()
})

test('the account badge picks up a new notification without reloading the page', async ({
  page,
  browser,
}) => {
  test.setTimeout(60_000)
  const { treeId, awa } = await treeWithEditor(page)
  await page.goto('/dashboard')
  await expect(page.getByRole('link', { name: 'Notifications' })).toBeVisible()

  const editorContext = await newVisitorContext(browser)
  const editor = await editorContext.newPage()
  const account = await registerThroughUi(editor)
  await seedAcceptedInvitation(treeId, account.email, 'EDITOR')
  await editor.goto(`/tree/${treeId}/member/${awa}/edit`)
  await editor.getByRole('tab', { name: 'Culture', exact: true }).click()
  await editor.getByLabel('Tribu').fill('Soninke')
  await editor.getByRole('button', { name: 'Enregistrer les modifications' }).click()

  // The badge polls every ~15s (module 2.7); this waits for it without any navigation of its own.
  await expect(page.getByRole('link', { name: 'Notifications (1)' })).toBeVisible({
    timeout: 25_000,
  })
  await editorContext.close()
})
