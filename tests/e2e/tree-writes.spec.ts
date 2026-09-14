import type { Page } from '@playwright/test'
import { registerThroughUi } from '@tests/e2e/support/accounts'
import {
  expect,
  expectNoAccessibilityViolations,
  newVisitorContext,
  test,
} from '@tests/e2e/support/fixtures'
import { seedAcceptedInvitation } from '@tests/support/seed-invitations'

async function createTree(page: Page, name: string, visibility = 'Privé') {
  await page.goto('/trees/new')
  await page.getByLabel('Nom de l’arbre').fill(name)
  await page.getByLabel('Description').fill('Du Fouta Djallon')
  await page.getByLabel(visibility, { exact: true }).check()
  await page.getByRole('button', { name: 'Créer l’arbre' }).click()
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  return page.url().split('/tree/')[1] ?? ''
}

test('a new user creates a first tree from the empty dashboard', async ({ page }) => {
  await registerThroughUi(page)
  await page.getByRole('link', { name: 'Créer un arbre' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Créer un arbre' })).toBeVisible()
  await expectNoAccessibilityViolations(page)

  await page.getByRole('button', { name: 'Créer l’arbre' }).click()
  const summary = page.getByRole('alert').filter({ hasText: 'Le formulaire contient' })
  await expect(summary).toBeFocused()
  await summary.getByRole('link', { name: 'Nom de l’arbre : Le nom de l’arbre est requis' }).click()
  await expect(page.getByLabel('Nom de l’arbre')).toBeFocused()

  await page.getByLabel('Nom de l’arbre').fill('Famille Diallo')
  await page.getByLabel('Public', { exact: true }).check()
  await page.getByRole('button', { name: 'Créer l’arbre' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Famille Diallo' })).toBeVisible()
  await page.getByRole('link', { name: 'Journal de l’arbre' }).click()
  await expect(page.getByRole('main').locator('ol > li')).toContainText(['Arbre créé'])
  await page.goto('/dashboard')
  await expect(page.getByRole('link', { name: 'Famille Diallo' })).toBeVisible()
})

test('the owner edits a tree, clears its description, and the history shows only the changes', async ({
  page,
}) => {
  await registerThroughUi(page)
  const treeId = await createTree(page, 'Famille Sow')

  await page.getByRole('link', { name: 'Modifier l’arbre' }).click()
  await expect(page.getByLabel('Description')).toHaveValue('Du Fouta Djallon')
  await expectNoAccessibilityViolations(page)
  await page.getByLabel('Description').fill('')
  await page.getByLabel('Public', { exact: true }).check()
  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'ont été enregistrées' })).toBeVisible()

  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Aucune modification' })).toBeVisible()

  await page.goto(`/tree/${treeId}/history?action=TREE_UPDATED`)
  const entries = page.getByRole('main').locator('ol > li')
  await expect(entries).toHaveCount(1)
  await expect(entries.first()).toContainText('Description : Du Fouta Djallon')
  await expect(entries.first()).toContainText('Visibilité : Privé')
  await expect(entries.first()).not.toContainText('Nom de l’arbre')
})

test('only the owner may edit a tree', async ({ page, browser }) => {
  await registerThroughUi(page)
  const treeId = await createTree(page, 'Famille Barry')

  const editorContext = await newVisitorContext(browser)
  const editor = await editorContext.newPage()
  const editorAccount = await registerThroughUi(editor)
  await seedAcceptedInvitation(treeId, editorAccount.email, 'EDITOR')
  await editor.goto(`/tree/${treeId}`)
  await expect(editor.getByRole('link', { name: 'Modifier l’arbre' })).toHaveCount(0)
  await editor.goto(`/tree/${treeId}/settings`)
  await expect(
    editor.getByRole('heading', { level: 1, name: 'Réservé au propriétaire' }),
  ).toBeVisible()
  await editorContext.close()

  const anonymousContext = await newVisitorContext(browser)
  const anonymous = await anonymousContext.newPage()
  await anonymous.goto(`/tree/${treeId}/settings`)
  await expect(anonymous).toHaveURL(/\/login/)
  await anonymousContext.close()
})

test('an owner writing too often is asked to wait', async ({ page }) => {
  await registerThroughUi(page)
  await createTree(page, 'Famille Keita')
  await page.getByRole('link', { name: 'Modifier l’arbre' }).click()
  const save = page.getByRole('button', { name: 'Enregistrer les modifications' })
  const unchanged = page.getByRole('status').filter({ hasText: 'Aucune modification' })

  // The creation used one attempt of the 30 allowed; 29 saves use the rest.
  for (let attempt = 0; attempt < 29; attempt += 1) {
    await save.click()
    await expect(unchanged).toBeVisible()
    await page.getByLabel('Nom de l’arbre').press('Tab')
  }
  await save.click()

  await expect(page.getByRole('alert').filter({ hasText: 'Trop de modifications' })).toBeVisible()
})
