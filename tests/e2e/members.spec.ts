import type { Page } from '@playwright/test'
import { registerThroughUi } from '@tests/e2e/support/accounts'
import {
  expect,
  expectNoAccessibilityViolations,
  newVisitorContext,
  test,
} from '@tests/e2e/support/fixtures'
import { seedMember, seedUnion } from '@tests/support/seed-family'
import { seedTree } from '@tests/support/seed-trees'

/** A tree with two parents married in 1955 and their adopted daughter. */
async function seedDialloFamily(page: Page, visibility: 'PRIVATE' | 'PUBLIC' = 'PRIVATE') {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({ ownerEmail: owner.email, name: 'Famille Diallo', visibility })
  const moussa = await seedMember(treeId, {
    firstName: 'Moussa',
    lastName: 'Diallo',
    tribe: 'Peul',
  })
  const awa = await seedMember(treeId, {
    firstName: 'Awa',
    lastName: 'Diallo',
    gender: 'FEMALE',
    birthDate: '1932-05-12 00:00:00',
    birthDateApprox: true,
  })
  const fatou = await seedMember(treeId, {
    firstName: 'Fatou',
    lastName: 'Sow',
    ethnicity: 'Wolof',
  })
  await seedUnion(treeId, {
    type: 'MARRIAGE',
    parentIds: [moussa, awa],
    startDate: '1955',
    children: [{ childId: fatou, filiation: 'ADOPTIVE' }],
  })
  return { treeId, awa }
}

const memberNames = (page: Page) =>
  page.getByRole('region', { name: 'Membres' }).getByRole('listitem').getByRole('link')

test('the tree page lists its members, and the search narrows them', async ({ page }) => {
  const { treeId } = await seedDialloFamily(page)
  await page.goto(`/tree/${treeId}`)

  await expect(memberNames(page)).toHaveText(['Awa Diallo', 'Fatou Sow', 'Moussa Diallo'])
  await expectNoAccessibilityViolations(page)

  await page.getByLabel('Rechercher un membre').fill('peul')
  await page.getByRole('button', { name: 'Rechercher' }).click()
  await expect(page).toHaveURL(/\?q=peul$/)
  await expect(memberNames(page)).toHaveText(['Moussa Diallo'])
  await expect(page.getByText('1 résultat pour « peul »')).toBeVisible()

  await page.goto(`/tree/${treeId}?q=zzz`)
  await expect(page.getByText('Aucun membre ne correspond à « zzz ».')).toBeVisible()
})

test('a member profile shows facts and relations, and leads to relatives', async ({ page }) => {
  const { treeId, awa } = await seedDialloFamily(page)
  await page.goto(`/tree/${treeId}/member/${awa}`)

  await expect(page.getByRole('heading', { level: 1, name: 'Awa Diallo' })).toBeVisible()
  await expect(page.getByText('vers 12 mai 1932')).toBeVisible()
  const partnerUnions = page.getByRole('region', { name: 'Parent dans' })
  await expect(partnerUnions).toContainText('Mariage (depuis 1955)')
  await expect(partnerUnions).toContainText('Avec : Moussa Diallo')
  await expectNoAccessibilityViolations(page)

  await partnerUnions.getByRole('link', { name: 'Fatou Sow' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Fatou Sow' })).toBeVisible()
  const parentUnions = page.getByRole('region', { name: 'Unions parentales' })
  await expect(parentUnions).toContainText('Parents : Moussa Diallo et Awa Diallo')
  await expect(parentUnions).toContainText('Filiation : Adoptif')
})

test('a member of a private tree is never named to an anonymous visitor', async ({
  page,
  browser,
}) => {
  const { treeId, awa } = await seedDialloFamily(page)
  const visitorContext = await newVisitorContext(browser)
  const visitor = await visitorContext.newPage()

  await visitor.goto(`/tree/${treeId}/member/${awa}`)

  await expect(
    visitor.getByRole('heading', { level: 1, name: 'Cet arbre est privé' }),
  ).toBeVisible()
  await expect(visitor).toHaveTitle(/Arbre privé/)
  await expect(visitor.getByText('Awa')).toHaveCount(0)
  await visitorContext.close()
})

test('an unknown member shows the profile not found page with a 404', async ({ page }) => {
  const { treeId } = await seedDialloFamily(page, 'PUBLIC')

  const response = await page.goto(`/tree/${treeId}/member/unknown-member`)

  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1, name: 'Fiche introuvable' })).toBeVisible()
})
