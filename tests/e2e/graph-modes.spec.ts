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

/** A custom listbox (module: graph tools parity): its options portal to `document.body`, outside
 * whichever popover its combobox button sits in — scoped by the listbox's own accessible name
 * (not just "option", which a neighbouring native `<select>`'s `<option>`s also expose). */
async function selectGraphToolOption(page: Page, panel: Locator, label: string, optionLabel: string) {
  await panel.getByLabel(label).click()
  await page.getByRole('listbox', { name: label }).getByRole('option', { name: optionLabel, exact: true }).click()
}

/** Chemin de parenté and Ancêtres communs are floating popovers (module: graph tools parity),
 * not inline forms — each field already excludes the other's own choice. */
async function usePairPanel(
  page: Page,
  trigger: string,
  regionName: string,
  first: string,
  second: string,
) {
  await page.getByRole('button', { name: trigger, exact: true }).click()
  const panel = page.getByRole('region', { name: regionName })
  await selectGraphToolOption(page, panel, 'Membre A', first)
  await selectGraphToolOption(page, panel, 'Membre B', second)
  await panel.getByRole('button', { name: 'Calculer' }).click()
  return panel
}

const useKinshipPanel = (page: Page, first: string, second: string) =>
  usePairPanel(page, 'Chemin', 'Chemin de parenté', first, second)

const useCommonAncestorsPanel = (page: Page, first: string, second: string) =>
  usePairPanel(page, 'Ancêtres', 'Ancêtres communs', first, second)

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

  await page.getByRole('button', { name: 'Descendance', exact: true }).click()
  const panel = page.getByRole('region', { name: 'Descendance' })
  await selectGraphToolOption(page, panel, 'Membre', 'Moussa Diallo')

  // Dismissible like the other graph tools (module: mobile/keyboard parity) — it used to be a
  // plain <details> with no Escape or outside-click handling at all.
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
  await page.getByRole('button', { name: 'Descendance', exact: true }).click()

  await panel.getByRole('button', { name: 'Voir la descendance' }).click()

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

  const panel = await useCommonAncestorsPanel(page, 'Fatou Sow', 'Ibrahima Sow')

  await expect(panel.getByRole('status')).toContainText(
    '3 ancêtres communs à Fatou Sow et Ibrahima Sow.',
  )
  const ancestors = panel.getByRole('list', { name: 'Ancêtres communs' }).getByRole('listitem')
  await expect(ancestors).toHaveCount(3)
  await expect(ancestors.nth(0)).toContainText('Awa Diallo')
  await expect(ancestors.nth(0)).toContainText(
    '1 génération depuis Fatou Sow · 2 générations depuis Ibrahima Sow',
  )
  await expect(ancestors.nth(1)).toContainText('Moussa Diallo')
  await expect(ancestors.nth(2)).toContainText('Alpha Diallo')
  await expectNoAccessibilityViolations(page)

  // Escape dismisses it too (module: mobile/keyboard parity) — not just its own Fermer button.
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
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
