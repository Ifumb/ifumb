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

/**
 * Alpha → Moussa and Sekou · Moussa + Awa → Fatou · Fatou → Ibrahima.
 */
async function seedFourGenerations(page: Page) {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille Diallo',
    visibility: 'PRIVATE',
  })
  const member = (firstName: string, lastName: string, gender: 'MALE' | 'FEMALE') =>
    seedMember(treeId, { firstName, lastName, gender })
  const alpha = await member('Alpha', 'Diallo', 'MALE')
  const moussa = await member('Moussa', 'Diallo', 'MALE')
  const sekou = await member('Sekou', 'Diallo', 'MALE')
  const awa = await member('Awa', 'Diallo', 'FEMALE')
  const fatou = await member('Fatou', 'Sow', 'FEMALE')
  const ibrahima = await member('Ibrahima', 'Sow', 'MALE')
  const children = (...ids: string[]) =>
    ids.map((childId) => ({ childId, filiation: 'BIOLOGICAL' as const }))
  await seedUnion(treeId, {
    type: 'BIOLOGICAL',
    parentIds: [alpha],
    children: children(moussa, sekou),
  })
  await seedUnion(treeId, { type: 'MARRIAGE', parentIds: [moussa, awa], children: children(fatou) })
  await seedUnion(treeId, { type: 'BIOLOGICAL', parentIds: [fatou], children: children(ibrahima) })
  return { treeId, ids: { alpha, moussa, sekou, awa, fatou, ibrahima } }
}

const memberLinks = (page: Page) => page.locator('.react-flow__node-member').getByRole('link')
const tool = (page: Page, title: string) =>
  page.locator('details').filter({
    has: page.locator('summary').filter({
      hasText:
        title === 'Chemin de parenté'
          ? 'Chemin'
          : title === 'Ancêtres communs'
            ? 'Ancêtres'
            : title,
    }),
  })

async function usePairTool(
  page: Page,
  title: string,
  first: string,
  second: string,
  submit: string,
) {
  const section = tool(page, title)
  await section.locator('summary').click()
  await section.getByLabel('Membre A').selectOption({ label: first })
  await section.getByLabel('Membre B').selectOption({ label: second })
  await section.getByRole('button', { name: submit }).click()
}

test('the lineage of a member opens from their profile and widens on demand', async ({ page }) => {
  const { treeId, ids } = await seedFourGenerations(page)
  await page.goto(`/tree/${treeId}/member/${ids.fatou}`)

  await page.getByRole('link', { name: 'Voir sa descendance dans le graphe' }).click()
  const banner = page.getByRole('region', { name: 'Descendance de Fatou Sow' })
  await expect(banner.getByRole('status')).toHaveText('Générations affichées : de −1 à +4.')
  await expect(memberLinks(page)).toHaveCount(4)
  await expect(page.locator(`[data-id="member_${ids.fatou}"]`)).toContainText('Pivot')
  await expect(page.locator(`[data-id="member_${ids.ibrahima}"]`)).toContainText('+1')
  await expectNoAccessibilityViolations(page)

  await banner.getByRole('link', { name: 'Une génération d’ancêtres de plus' }).click()
  await expect(memberLinks(page)).toHaveCount(5)
  await expect(page.locator(`[data-id="member_${ids.sekou}"]`)).toHaveCount(0)

  await page.getByRole('link', { name: 'Quitter la vue descendance' }).click()
  await expect(memberLinks(page)).toHaveCount(6)
})

test('the descendance tool narrows the graph to the chosen member', async ({ page }) => {
  const { treeId } = await seedFourGenerations(page)
  await page.goto(`/tree/${treeId}/graph`)

  const section = tool(page, 'Descendance')
  await section.locator('summary').click()
  await section.getByLabel('Membre', { exact: true }).selectOption({ label: 'Moussa Diallo' })
  await section.getByRole('button', { name: 'Voir la descendance' }).click()

  await expect(page).toHaveURL(/view=lineage/)
  await expect(page.getByRole('region', { name: 'Descendance de Moussa Diallo' })).toBeVisible()
  // Moussa, Alpha above, Awa as co-parent of Fatou, Fatou and Ibrahima below; not Sekou.
  await expect(memberLinks(page)).toHaveCount(5)
})

test('the kinship path names the relation and puts its people forward', async ({ page }) => {
  const { treeId, ids } = await seedFourGenerations(page)
  await page.goto(`/tree/${treeId}/graph`)

  await usePairTool(page, 'Chemin de parenté', 'Awa Diallo', 'Ibrahima Sow', 'Calculer le chemin')

  const result = page.getByRole('region', { name: 'Chemin de parenté' })
  await expect(result.getByRole('status')).toHaveText(
    'Pour Awa Diallo, Ibrahima Sow est : petit-fils.',
  )
  await expect(result.getByRole('list', { name: 'Étapes du chemin' }).getByRole('link')).toHaveText(
    ['Awa Diallo', 'Fatou Sow', 'Ibrahima Sow'],
  )
  await expect(page.locator(`[data-id="member_${ids.moussa}"]`)).toHaveAttribute('inert')
  await expect(page.locator(`[data-id="member_${ids.fatou}"]`)).not.toHaveAttribute('inert')
  await expectNoAccessibilityViolations(page)
})

test('a spouse is named as such, not as a half-sibling', async ({ page }) => {
  const { treeId, ids } = await seedFourGenerations(page)

  await page.goto(`/tree/${treeId}/graph?view=kinship&a=${ids.moussa}&b=${ids.awa}`)

  await expect(
    page.getByRole('region', { name: 'Chemin de parenté' }).getByRole('status'),
  ).toHaveText('Pour Moussa Diallo, Awa Diallo est : épouse.')
})

test('common ancestors are listed with their distances', async ({ page }) => {
  const { treeId } = await seedFourGenerations(page)
  await page.goto(`/tree/${treeId}/graph`)

  await usePairTool(
    page,
    'Ancêtres communs',
    'Fatou Sow',
    'Ibrahima Sow',
    'Chercher les ancêtres communs',
  )

  const result = page.getByRole('region', { name: 'Ancêtres communs' })
  await expect(result.getByRole('status')).toHaveText(
    '3 ancêtres communs à Fatou Sow et Ibrahima Sow.',
  )
  await expect(result.getByRole('listitem').getByRole('link')).toHaveText([
    'Awa Diallo',
    'Moussa Diallo',
    'Alpha Diallo',
  ])
  await expect(result).toContainText(
    '1 génération depuis Fatou Sow · 2 générations depuis Ibrahima Sow',
  )
  await expectNoAccessibilityViolations(page)
})

test('the tools explain an incomplete choice', async ({ page }) => {
  const { treeId } = await seedFourGenerations(page)
  await page.goto(`/tree/${treeId}/graph`)

  await usePairTool(page, 'Chemin de parenté', 'Awa Diallo', 'Awa Diallo', 'Calculer le chemin')

  await expect(tool(page, 'Chemin de parenté').getByRole('alert')).toHaveText(
    'Choisissez deux membres différents.',
  )
  await expect(tool(page, 'Chemin de parenté').getByLabel('Membre A')).toHaveAccessibleDescription(
    'Choisissez deux membres différents.',
  )
})

test('a private tree names nobody through the tools, and unknown members are a 404', async ({
  page,
  browser,
}) => {
  const { treeId, ids } = await seedFourGenerations(page)
  const visitorContext = await newVisitorContext(browser)
  const visitor = await visitorContext.newPage()

  await visitor.goto(`/tree/${treeId}/graph?view=kinship&a=${ids.moussa}&b=${ids.awa}`)
  await expect(
    visitor.getByRole('heading', { level: 1, name: 'Cet arbre est privé' }),
  ).toBeVisible()
  await expect(visitor.getByText('Moussa')).toHaveCount(0)
  await visitorContext.close()

  const response = await page.goto(`/tree/${treeId}/graph?view=lineage&member=unknown-member`)
  expect(response?.status()).toBe(404)
})
