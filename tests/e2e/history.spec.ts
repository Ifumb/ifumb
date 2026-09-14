import type { Page } from '@playwright/test'
import { registerThroughUi } from '@tests/e2e/support/accounts'
import {
  expect,
  expectNoAccessibilityViolations,
  newVisitorContext,
  test,
} from '@tests/e2e/support/fixtures'
import { seedAuditEntries } from '@tests/support/seed-audit-log'
import { seedAcceptedInvitation } from '@tests/support/seed-invitations'
import { seedTree } from '@tests/support/seed-trees'

const at = (minutes: number) => new Date(Date.UTC(2026, 2, 1, 9, minutes))

async function seedHistory(page: Page) {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille Diallo',
    visibility: 'PRIVATE',
  })
  await seedAuditEntries(treeId, [
    {
      action: 'TREE_CREATED',
      targetType: 'TREE',
      diff: { before: null, after: { name: 'Famille Diallo' } },
      createdAt: at(0),
    },
    {
      action: 'MEMBER_UPDATED',
      // A partial legacy "before": only the first name was recorded.
      diff: { before: { firstName: 'Awa' }, after: { firstName: 'Aïcha', gender: 'FEMALE' } },
      createdAt: at(5),
    },
  ])
  return { owner, treeId }
}

// Entries are the items of the ordered list; their changes are nested lists of their own.
const entries = (page: Page) => page.getByRole('main').locator('ol > li')

test('the owner reads the history from the tree page, with honest changes', async ({ page }) => {
  const { treeId } = await seedHistory(page)
  await page.goto(`/tree/${treeId}`)

  await page.getByRole('link', { name: 'Journal de l’arbre' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Journal — Famille Diallo' }),
  ).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('2 entrées affichées.')
  const updated = entries(page).first()
  await expect(updated).toContainText('Membre modifié')
  await expect(updated).toContainText('par Awa Diallo')
  // The visible arrow is hidden from assistive technology, which reads "remplacé par" instead.
  await expect(updated.getByRole('listitem').nth(0)).toHaveText(
    /^Prénom : Awa\s*→\s*remplacé par Aïcha$/,
  )
  await expect(updated.getByRole('listitem').nth(1)).toHaveText('Genre : Féminin')
  await expectNoAccessibilityViolations(page)

  await page.getByLabel('Type d’action').selectOption({ label: 'Arbre créé' })
  await page.getByRole('button', { name: 'Filtrer' }).click()
  await expect(page).toHaveURL(/action=TREE_CREATED/)
  await expect(entries(page)).toHaveCount(1)
  await expect(entries(page).first()).toContainText('Nom de l’arbre : Famille Diallo')
})

test('older entries are one link away, and the newest ones one link back', async ({ page }) => {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Arbre long',
    visibility: 'PRIVATE',
  })
  await seedAuditEntries(
    treeId,
    Array.from({ length: 21 }, (_, index) => ({
      action: 'MEMBER_CREATED',
      diff: { before: null, after: { firstName: `Membre ${index}` } },
      createdAt: at(index),
    })),
  )

  await page.goto(`/tree/${treeId}/history`)
  await expect(entries(page)).toHaveCount(20)
  await expect(entries(page).first()).toContainText('Membre 20')

  await page.getByRole('link', { name: 'Entrées plus anciennes' }).click()
  await expect(entries(page)).toHaveCount(1)
  await expect(entries(page).first()).toContainText('Membre 0')

  await page.getByRole('link', { name: 'Revenir aux plus récentes' }).click()
  await expect(entries(page)).toHaveCount(20)
})

test('editors read the history, viewers and anonymous visitors do not', async ({
  page,
  browser,
}) => {
  const { treeId } = await seedHistory(page)
  const reader = async (role: 'EDITOR' | 'VIEWER') => {
    const context = await newVisitorContext(browser)
    const visitor = await context.newPage()
    const account = await registerThroughUi(visitor)
    await seedAcceptedInvitation(treeId, account.email, role)
    await visitor.goto(`/tree/${treeId}/history`)
    return { context, visitor }
  }

  const editor = await reader('EDITOR')
  await expect(editor.visitor.getByRole('status')).toHaveText('2 entrées affichées.')
  await editor.context.close()

  const viewer = await reader('VIEWER')
  await expect(
    viewer.visitor.getByRole('heading', { level: 1, name: 'Journal réservé' }),
  ).toBeVisible()
  await expect(viewer.visitor.getByText('Aïcha')).toHaveCount(0)
  await viewer.visitor.goto(`/tree/${treeId}`)
  await expect(viewer.visitor.getByRole('link', { name: 'Journal de l’arbre' })).toHaveCount(0)
  await viewer.context.close()

  const anonymousContext = await newVisitorContext(browser)
  const anonymous = await anonymousContext.newPage()
  await anonymous.goto(`/tree/${treeId}/history`)
  await expect(
    anonymous.getByRole('heading', { level: 1, name: 'Cet arbre est privé' }),
  ).toBeVisible()
  await anonymousContext.close()
})
