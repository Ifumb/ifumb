import type { Locator, Page } from '@playwright/test'
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

/** A custom listbox (module: graph tools parity): its options portal to `document.body`, outside
 * whichever popover its combobox button sits in — scoped by the listbox's own accessible name
 * (not just "option", which a neighbouring native `<select>`'s `<option>`s also expose). */
async function selectGraphToolOption(page: Page, panel: Locator, label: string, optionLabel: string) {
  await panel.getByLabel(label).click()
  await page.getByRole('listbox', { name: label }).getByRole('option', { name: optionLabel, exact: true }).click()
}

/** Chemin de parenté is a floating popover (module: graph tools parity), not an inline form. */
async function useKinshipPanel(page: Page, first: string, second: string) {
  await page.getByRole('button', { name: 'Chemin', exact: true }).click()
  const panel = page.getByRole('region', { name: 'Chemin de parenté' })
  await selectGraphToolOption(page, panel, 'Membre A', first)
  await selectGraphToolOption(page, panel, 'Membre B', second)
  await panel.getByRole('button', { name: 'Calculer' }).click()
  return panel
}

test('the lineage of a member opens from their profile and widens on demand', async ({ page }) => {
  const { treeId, ids } = await seedFourGenerations(page)
  await page.goto(`/tree/${treeId}/member/${ids.fatou}`)

  await page.getByRole('link', { name: 'Voir sa descendance dans le graphe' }).click()
  const banner = page.getByRole('region', { name: 'Pivot : Fatou Sow' })
  await expect(banner).toContainText('gen −1 à +4')
  await expect(memberLinks(page)).toHaveCount(4)
  await expect(page.locator(`[data-id="member_${ids.fatou}"]`)).toContainText('Pivot')
  await expect(page.locator(`[data-id="member_${ids.ibrahima}"]`)).toContainText('+1')
  await expectNoAccessibilityViolations(page)

  // Instant, in place: no navigation, the URL this page opened on stays as it is.
  await banner.getByRole('button', { name: 'ancêtres' }).click()
  await expect(memberLinks(page)).toHaveCount(5)
  await expect(page.locator(`[data-id="member_${ids.sekou}"]`)).toHaveCount(0)
  await expect(page).toHaveURL(new RegExp(`/tree/${treeId}/graph\\?view=lineage`))

  await banner.getByRole('button', { name: 'Quitter' }).click()
  await expect(banner).toHaveCount(0)
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
  await expect(page.getByRole('region', { name: 'Pivot : Moussa Diallo' })).toBeVisible()
  // Moussa, Alpha above, Awa as co-parent of Fatou, Fatou and Ibrahima below; not Sekou.
  await expect(memberLinks(page)).toHaveCount(5)
})

test('the kinship path names the relation and puts its people forward', async ({ page }) => {
  const { treeId, ids } = await seedFourGenerations(page)
  await page.goto(`/tree/${treeId}/graph`)

  const panel = await useKinshipPanel(page, 'Awa Diallo', 'Ibrahima Sow')

  await expect(panel.getByRole('status')).toContainText(
    'Pour Awa Diallo, Ibrahima Sow est : petit-fils.',
  )
  await expect(panel.getByRole('list', { name: 'Étapes du chemin' }).getByRole('listitem')).toHaveText(
    ['Awa Diallo', 'Fatou Sow', 'Ibrahima Sow'],
  )
  await expect(page.locator(`[data-id="member_${ids.moussa}"]`)).toHaveAttribute('inert')
  await expect(page.locator(`[data-id="member_${ids.fatou}"]`)).not.toHaveAttribute('inert')
  await expectNoAccessibilityViolations(page)

  // Instant, in place: no navigation, no page reload.
  await expect(page).toHaveURL(`/tree/${treeId}/graph`)

  // Picking a member clears a previous result and removes it from the other field's choices.
  await selectGraphToolOption(page, panel, 'Membre A', 'Fatou Sow')
  await expect(panel.getByRole('status')).toHaveCount(0)
  await panel.getByLabel('Membre B').click()
  await expect(
    page.getByRole('listbox', { name: 'Membre B' }).getByRole('option', { name: 'Fatou Sow', exact: true }),
  ).toHaveCount(0)
  await page.keyboard.press('Escape')

  await panel.getByRole('button', { name: 'Fermer' }).click()
  await expect(panel).toHaveCount(0)
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

  // Chemin de parenté no longer reaches this: each select now excludes the other's own choice
  // (module: graph tools parity), the same prevention the legacy panel always had. Ancêtres
  // communs is not converted yet and still reaches it through a real submission.
  await usePairTool(
    page,
    'Ancêtres communs',
    'Awa Diallo',
    'Awa Diallo',
    'Chercher les ancêtres communs',
  )

  await expect(tool(page, 'Ancêtres communs').getByRole('alert')).toHaveText(
    'Choisissez deux membres différents.',
  )
  await expect(tool(page, 'Ancêtres communs').getByLabel('Membre A')).toHaveAccessibleDescription(
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
