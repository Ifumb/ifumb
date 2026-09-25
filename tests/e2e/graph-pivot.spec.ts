import { registerThroughUi } from '@tests/e2e/support/accounts'
import { expect, expectNoAccessibilityViolations, test } from '@tests/e2e/support/fixtures'
import { seedMember, seedUnion } from '@tests/support/seed-family'
import { seedTree } from '@tests/support/seed-trees'

test('the card opens a lineage pivot with the keyboard and returns to the full graph', async ({
  page,
}) => {
  const owner = await registerThroughUi(page)
  const id = await seedTree({
    ownerEmail: owner.email,
    name: 'Pivot direct',
    visibility: 'PRIVATE',
  })
  const parent = await seedMember(id, { firstName: 'Awa', lastName: 'Diallo' })
  const child = await seedMember(id, { firstName: 'Fatou', lastName: 'Sow' })
  await seedUnion(id, {
    type: 'BIOLOGICAL',
    parentIds: [parent],
    children: [{ childId: child, filiation: 'BIOLOGICAL' }],
  })
  await page.goto(`/tree/${id}`)
  const pivot = page.getByRole('button', { name: 'Voir la descendance de Awa Diallo', exact: true })
  await pivot.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('region', { name: 'Descendance de Awa Diallo' })).toBeVisible()
  await expect(pivot).toHaveCount(0)
  await expectNoAccessibilityViolations(page)
  await page.getByRole('link', { name: 'Quitter la vue descendance' }).click()
  await expect(pivot).toBeVisible()
})
