import { registerThroughUi } from '@tests/e2e/support/accounts'
import { expect, expectNoAccessibilityViolations, test } from '@tests/e2e/support/fixtures'
import { seedMember, seedUnion } from '@tests/support/seed-family'
import { seedTree } from '@tests/support/seed-trees'

test('the card opens a persistent pivot banner that moves its generation window in place', async ({
  page,
}) => {
  const owner = await registerThroughUi(page)
  const id = await seedTree({
    ownerEmail: owner.email,
    name: 'Pivot direct',
    visibility: 'PRIVATE',
  })
  const greatGrandparent = await seedMember(id, { firstName: 'Jean-Robert', lastName: 'Mboumba' })
  const grandparent = await seedMember(id, { firstName: 'Cedric', lastName: 'Moussavou' })
  const pivotMember = await seedMember(id, { firstName: 'Nieto', lastName: 'Boussougou' })
  await seedUnion(id, {
    type: 'BIOLOGICAL',
    parentIds: [greatGrandparent],
    children: [{ childId: grandparent, filiation: 'BIOLOGICAL' }],
  })
  await seedUnion(id, {
    type: 'BIOLOGICAL',
    parentIds: [grandparent],
    children: [{ childId: pivotMember, filiation: 'BIOLOGICAL' }],
  })
  await page.goto(`/tree/${id}`)

  const pivotButton = page.getByRole('button', {
    name: 'Voir la descendance de Nieto Boussougou',
    exact: true,
  })
  await pivotButton.focus()
  await page.keyboard.press('Enter')

  // The default window (one ancestor generation) shows the pivot and its parent, not yet the
  // grandparent — the same boundary the legacy "pivot" view opens on. The sidebar tool selects
  // always list every member of the tree regardless of scope, so the card itself (a link) is the
  // only reliable way to tell whether a member is actually drawn on the graph.
  const grandparentCard = page.getByRole('link', { name: 'Jean-Robert Mboumba', exact: true })
  const banner = page.getByRole('region', { name: 'Pivot : Nieto Boussougou' })
  const status = page.getByRole('status')
  await expect(banner).toBeVisible()
  await expect(pivotButton).toHaveCount(0)
  await expect(grandparentCard).toHaveCount(0)
  await expect(status).toHaveText('2 membres affichés.')
  await expect(page).toHaveURL(`/tree/${id}`)
  await expectNoAccessibilityViolations(page)

  // Instant, in place: one more generation of ancestors, no navigation.
  await banner.getByRole('button', { name: 'ancêtres' }).click()
  await expect(grandparentCard).toBeVisible()
  await expect(status).toHaveText('3 membres affichés.')
  await expect(page).toHaveURL(`/tree/${id}`)

  await banner.getByRole('button', { name: 'Quitter' }).click()
  await expect(banner).toHaveCount(0)
  await expect(pivotButton).toBeVisible()
})
