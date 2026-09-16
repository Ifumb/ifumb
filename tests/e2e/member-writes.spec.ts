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

const errorSummary = (page: Page) =>
  page.getByRole('alert').filter({ hasText: 'Le formulaire contient' })

async function ownTree(page: Page) {
  const owner = await registerThroughUi(page)
  return seedTree({ ownerEmail: owner.email, name: 'Famille Diallo', visibility: 'PRIVATE' })
}

test('the owner adds a member, guided by the date errors', async ({ page }) => {
  const treeId = await ownTree(page)
  await page.goto(`/tree/${treeId}`)
  await page.getByRole('link', { name: 'Ajouter un membre' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Ajouter un membre' })).toBeVisible()
  await expectNoAccessibilityViolations(page)

  const birth = page.getByRole('group', { name: 'Date de naissance' })
  const death = page.getByRole('group', { name: 'Date de décès' })
  await page.getByLabel('Prénom').fill('Awa')
  await page.getByLabel('Nom', { exact: true }).fill('Diallo')
  await birth.getByLabel('Mois').selectOption({ label: 'mars' })
  await page.getByRole('button', { name: 'Ajouter le membre' }).click()
  await expect(errorSummary(page)).toBeFocused()
  await errorSummary(page)
    .getByRole('link', { name: /^Date de naissance : L’année est requise/ })
    .click()
  await expect(birth.getByLabel('Jour')).toBeFocused()
  await expectNoAccessibilityViolations(page)

  await birth.getByLabel('Jour').fill('7')
  await birth.getByLabel('Année').fill('1954')
  await page.getByLabel('Date de naissance approximative').check()
  await death.getByLabel('Année').fill('1950')
  await page.getByRole('button', { name: 'Ajouter le membre' }).click()
  await expect(death.getByText('La date de décès ne peut pas précéder')).toBeVisible()
  await expect(birth.getByLabel('Année')).toHaveValue('1954')

  await death.getByLabel('Année').fill('2001')
  await page.getByRole('button', { name: 'Ajouter le membre' }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Awa Diallo', exact: true }),
  ).toBeVisible()
  await expect(page.getByText('vers 7 mars 1954')).toBeVisible()
  await page.goto(`/tree/${treeId}/history`)
  await expect(page.getByRole('main').locator('ol > li')).toContainText(['Membre créé'])
})

test('the owner clears a field, and the history records only that change', async ({ page }) => {
  const treeId = await ownTree(page)
  const awa = await seedMember(treeId, { firstName: 'Awa', lastName: 'Diallo', tribe: 'Peul' })
  await page.goto(`/tree/${treeId}/member/${awa}`)
  await page.getByRole('link', { name: 'Modifier la fiche' }).click()
  await expect(page.getByLabel('Tribu')).toHaveValue('Peul')
  await expectNoAccessibilityViolations(page)

  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Aucune modification' })).toBeVisible()
  await page.getByLabel('Tribu').fill('')
  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Awa Diallo', exact: true }),
  ).toBeVisible()

  await page.goto(`/tree/${treeId}/history?action=MEMBER_UPDATED`)
  const entries = page.getByRole('main').locator('ol > li')
  await expect(entries).toHaveCount(1)
  await expect(entries.first()).toContainText('Tribu : Peul')
  await expect(entries.first()).not.toContainText('Prénom')
})

test('the owner deletes a member who is a child in a union', async ({ page }) => {
  const treeId = await ownTree(page)
  const moussa = await seedMember(treeId, { firstName: 'Moussa', lastName: 'Diallo' })
  const fatou = await seedMember(treeId, { firstName: 'Fatou', lastName: 'Sow' })
  await seedUnion(treeId, {
    type: 'MARRIAGE',
    parentIds: [moussa],
    children: [{ childId: fatou, filiation: 'BIOLOGICAL' }],
  })

  await page.goto(`/tree/${treeId}/member/${fatou}`)
  await page.getByRole('link', { name: 'Supprimer ce membre' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Supprimer Fatou Sow ?' })).toBeVisible()
  await expectNoAccessibilityViolations(page)
  await page.getByRole('button', { name: 'Supprimer définitivement' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Famille Diallo' })).toBeVisible()
  const members = page.getByRole('region', { name: 'Membres' }).getByRole('link')
  await expect(members).toHaveText(['Moussa Diallo'])
  await page.goto(`/tree/${treeId}/member/${moussa}`)
  await expect(page.getByRole('main')).not.toContainText('Fatou')
})

test('an editor proposes member changes instead of writing directly; the account that claimed one may edit it only', async ({
  page,
  browser,
}) => {
  const treeId = await ownTree(page)
  const editorContext = await newVisitorContext(browser)
  const editor = await editorContext.newPage()
  const claimer = await registerThroughUi(editor)
  await seedAcceptedInvitation(treeId, claimer.email, 'EDITOR')
  const awa = await seedMember(treeId, { firstName: 'Awa', claimedByEmail: claimer.email })
  const moussa = await seedMember(treeId, { firstName: 'Moussa' })

  // The dashboard and profile links to these forms stay hidden from a plain editor; only the
  // owner is invited to write directly. Module 2.6 opens the forms themselves, reached by URL, so
  // that an editor can propose instead — see below.
  await editor.goto(`/tree/${treeId}`)
  await expect(editor.getByRole('link', { name: 'Ajouter un membre' })).toHaveCount(0)
  await editor.goto(`/tree/${treeId}/member/${moussa}`)
  await expect(editor.getByRole('link', { name: 'Modifier la fiche' })).toHaveCount(0)

  await editor.goto(`/tree/${treeId}/members/new`)
  await editor.getByLabel('Prénom').fill('Binta')
  await editor.getByRole('button', { name: 'Ajouter le membre' }).click()
  await expect(
    editor.getByRole('status').filter({ hasText: 'Proposition envoyée' }),
  ).toBeVisible()
  await expect(editor.getByRole('main')).not.toContainText('Binta')

  await editor.goto(`/tree/${treeId}/member/${moussa}/edit`)
  await editor.getByLabel('Biographie').fill('Vécut à Labé.')
  await editor.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(
    editor.getByRole('status').filter({ hasText: 'Proposition envoyée' }),
  ).toBeVisible()
  await editor.goto(`/tree/${treeId}/member/${moussa}`)
  await expect(editor.getByRole('main')).not.toContainText('Vécut à Labé.')

  await editor.goto(`/tree/${treeId}/member/${awa}`)
  await expect(editor.getByRole('link', { name: 'Supprimer ce membre' })).toHaveCount(0)
  await editor.getByRole('link', { name: 'Modifier la fiche' }).click()
  await expect(
    editor.getByRole('heading', { level: 1, name: 'Modifier la fiche de Awa' }),
  ).toBeVisible()
  await editor.getByLabel('Biographie').fill('Née au Fouta Djallon.')
  await editor.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(editor.getByRole('heading', { level: 1, name: 'Awa', exact: true })).toBeVisible()
  await expect(editor.getByText('Née au Fouta Djallon.')).toBeVisible()
  await editor.goto(`/tree/${treeId}/member/${awa}/delete`)
  await expect(
    editor.getByRole('heading', { level: 1, name: 'Réservé au propriétaire' }),
  ).toBeVisible()
  await editorContext.close()
})
