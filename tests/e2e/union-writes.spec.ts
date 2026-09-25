import type { Page } from '@playwright/test'
import { registerThroughUi } from '@tests/e2e/support/accounts'
import {
  expect,
  expectNoAccessibilityViolations,
  newVisitorContext,
  test,
} from '@tests/e2e/support/fixtures'
import { seedMember, seedUnion } from '@tests/support/seed-family'
import { seedAcceptedInvitation } from '@tests/support/seed-invitations'
import { seedTree } from '@tests/support/seed-trees'

const heading = (page: Page, name: string) =>
  page.getByRole('heading', { level: 1, name, exact: true })

/** An owner's private tree with Moussa, Awa and Fatou Diallo, not yet linked. */
async function dialloTree(page: Page) {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille Diallo',
    visibility: 'PRIVATE',
  })
  const [moussa, awa, fatou] = [
    await seedMember(treeId, { firstName: 'Moussa', lastName: 'Diallo' }),
    await seedMember(treeId, { firstName: 'Awa', lastName: 'Diallo' }),
    await seedMember(treeId, { firstName: 'Fatou', lastName: 'Diallo' }),
  ]
  return { treeId, moussa, awa, fatou }
}

test('the owner creates a union from a profile and links a child', async ({ page }) => {
  const { treeId, moussa } = await dialloTree(page)
  await page.goto(`/tree/${treeId}/member/${moussa}`)
  await page.getByRole('link', { name: 'Ajouter une union' }).click()
  await expect(heading(page, 'Créer une union')).toBeVisible()
  await expect(page.getByLabel('Parent 1')).toHaveValue(moussa)
  await expectNoAccessibilityViolations(page)

  await page.getByLabel('Parent 2').selectOption({ label: 'Awa Diallo' })
  await page.getByLabel('Mariage', { exact: true }).check()
  await page.getByRole('group', { name: 'Début' }).getByLabel('Année').fill('1955')
  await page.getByRole('button', { name: 'Créer l’union' }).click()
  await expect(page).toHaveURL(`/tree/${treeId}`)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.locator('.react-flow__node-union').getByRole('link').click()
  await expect(heading(page, 'Union de Moussa Diallo et Awa Diallo')).toBeVisible()
  await expectNoAccessibilityViolations(page)

  await page.getByLabel('Enfant', { exact: true }).selectOption({ label: 'Fatou Diallo' })
  await page.getByLabel('Filiation').selectOption({ label: 'Adoptif' })
  await page.getByRole('button', { name: 'Ajouter l’enfant' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Lien ajouté' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Enfants' })).toContainText(
    'Fatou Diallo (Adoptif)',
  )
})

test('linking an ancestor as a child is refused and explained', async ({ page }) => {
  const { treeId, moussa, awa, fatou } = await dialloTree(page)
  const child = { childId: fatou, filiation: 'BIOLOGICAL' } as const
  await seedUnion(treeId, { type: 'MARRIAGE', parentIds: [moussa, awa], children: [child] })
  const fatouUnion = await seedUnion(treeId, {
    type: 'BIOLOGICAL',
    parentIds: [fatou],
    children: [],
  })

  await page.goto(`/tree/${treeId}/union/${fatouUnion}`)
  await page.getByLabel('Enfant', { exact: true }).selectOption({ label: 'Moussa Diallo' })
  await page.getByRole('button', { name: 'Ajouter l’enfant' }).click()
  const summary = page.getByRole('alert').filter({ hasText: 'Le formulaire contient' })
  await expect(summary).toBeFocused()
  await expect(summary).toContainText('Ce membre est un ancêtre d’un des parents')
  await expectNoAccessibilityViolations(page)
})

test('the owner edits a union opened from the graph; the history keeps only the change', async ({
  page,
}) => {
  const { treeId, moussa, awa } = await dialloTree(page)
  await seedUnion(treeId, {
    type: 'MARRIAGE',
    parentIds: [moussa, awa],
    startDate: '1955',
    children: [],
  })

  await page.goto(`/tree/${treeId}/graph`)
  await page
    .getByRole('link', { name: 'Voir l’union — Mariage : Moussa Diallo et Awa Diallo' })
    .click()
  await expect(heading(page, 'Union de Moussa Diallo et Awa Diallo')).toBeVisible()
  await page.getByRole('link', { name: 'Modifier l’union' }).click()
  await expect(page.getByRole('group', { name: 'Début' }).getByLabel('Année')).toHaveValue('1955')
  await expectNoAccessibilityViolations(page)

  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Aucune modification' })).toBeVisible()
  await page.getByRole('group', { name: 'Fin' }).getByLabel('Année').fill('1970')
  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(heading(page, 'Union de Moussa Diallo et Awa Diallo')).toBeVisible()
  await expect(page.getByText('1955 – 1970')).toBeVisible()

  await page.goto(`/tree/${treeId}/history?action=UNION_UPDATED`)
  const entries = page.getByRole('main').locator('ol > li')
  await expect(entries).toHaveCount(1)
  await expect(entries.first()).toContainText('1970')
  await expect(entries.first()).not.toContainText('Type d’union')
})

test('the owner unlinks a child, then deletes the union after confirming', async ({ page }) => {
  const { treeId, moussa, awa, fatou } = await dialloTree(page)
  const union = await seedUnion(treeId, {
    type: 'MARRIAGE',
    parentIds: [moussa, awa],
    children: [{ childId: fatou, filiation: 'BIOLOGICAL' }],
  })

  await page.goto(`/tree/${treeId}/union/${union}`)
  await page.getByRole('button', { name: 'Retirer Fatou Diallo de cette union' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Lien retiré' })).toBeVisible()
  await expect(page.getByText('Aucun enfant rattaché.')).toBeVisible()

  await page.getByRole('link', { name: 'Supprimer l’union' }).click()
  await expect(heading(page, 'Supprimer l’union ?')).toBeVisible()
  await expectNoAccessibilityViolations(page)
  await page.getByRole('button', { name: 'Supprimer définitivement' }).click()
  await expect(heading(page, 'Famille Diallo')).toBeVisible()

  await page.goto(`/tree/${treeId}/history`)
  await expect(page.getByRole('main').locator('ol > li').first()).toContainText('Union supprimée')
})

test('an editor reads a union but may not change it', async ({ page, browser }) => {
  const { treeId, moussa, awa, fatou } = await dialloTree(page)
  const union = await seedUnion(treeId, {
    type: 'MARRIAGE',
    parentIds: [moussa, awa],
    children: [{ childId: fatou, filiation: 'BIOLOGICAL' }],
  })
  const editorContext = await newVisitorContext(browser)
  const editor = await editorContext.newPage()
  const account = await registerThroughUi(editor)
  await seedAcceptedInvitation(treeId, account.email, 'EDITOR')

  await editor.goto(`/tree/${treeId}/union/${union}`)
  await expect(heading(editor, 'Union de Moussa Diallo et Awa Diallo')).toBeVisible()
  await expect(editor.getByRole('region', { name: 'Enfants' })).toContainText('Fatou Diallo')
  await expect(editor.getByRole('link', { name: 'Modifier l’union' })).toHaveCount(0)
  await expect(editor.getByRole('button', { name: /Retirer/ })).toHaveCount(0)
  await expectNoAccessibilityViolations(editor)

  // The link is hidden, but module 2.6 opens the form itself by URL, so an editor can propose.
  await editor.goto(`/tree/${treeId}/union/${union}/edit`)
  await editor.getByRole('group', { name: 'Début' }).getByLabel('Année').fill('1955')
  await editor.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(editor.getByRole('status').filter({ hasText: 'Proposition envoyée' })).toBeVisible()
  await editor.goto(`/tree/${treeId}/union/${union}`)
  await expect(editor.getByText('1955')).toHaveCount(0)

  await editorContext.close()
})
