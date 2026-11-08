import { registerThroughUi } from '@tests/e2e/support/accounts'
import {
  expect,
  expectNoAccessibilityViolations,
  newVisitorContext,
  test,
} from '@tests/e2e/support/fixtures'
import { seedMember } from '@tests/support/seed-family'
import { seedTree } from '@tests/support/seed-trees'

test('masking a living member hides dates, place, photo and biography from public visitors only', async ({
  page,
  browser,
}) => {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({ ownerEmail: owner.email, name: 'Famille Diallo', visibility: 'PUBLIC' })
  const awa = await seedMember(treeId, {
    firstName: 'Awa',
    tribe: 'Peul',
    birthDate: '1932-05-07',
    birthPlace: 'Conakry',
  })

  await page.goto(`/tree/${treeId}/member/${awa}`)
  await page.getByRole('tab', { name: 'Dates & Lieux' }).click()
  await expect(page.getByText('Lieu de naissance')).toBeVisible()
  await expect(page.getByText('Conakry')).toBeVisible()

  await page.getByRole('button', { name: 'Masquer dates, lieux, photo et biographie' }).click()
  await expect(page.getByRole('button', { name: 'Rendre la fiche entièrement visible' })).toBeVisible()
  await expectNoAccessibilityViolations(page)
  // the owner keeps seeing everything, even once masked
  await expect(page.getByText('Conakry')).toBeVisible()

  const visitorContext = await newVisitorContext(browser)
  const visitor = await visitorContext.newPage()
  await visitor.goto(`/tree/${treeId}/member/${awa}`)

  await expect(visitor.getByRole('heading', { level: 1, name: 'Awa' })).toBeVisible()
  await visitor.getByRole('tab', { name: 'Culture' }).click()
  await expect(visitor.getByText('Peul')).toBeVisible()
  await expect(visitor.getByText('Conakry')).toHaveCount(0)
  await expectNoAccessibilityViolations(visitor)

  await page.getByRole('button', { name: 'Rendre la fiche entièrement visible' }).click()
  await expect(
    page.getByRole('button', { name: 'Masquer dates, lieux, photo et biographie' }),
  ).toBeVisible()
  await visitor.reload()
  await visitor.getByRole('tab', { name: 'Dates & Lieux' }).click()
  await expect(visitor.getByText('Conakry')).toBeVisible()
})

test('a deceased member cannot be masked', async ({ page }) => {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({ ownerEmail: owner.email, name: 'Famille Diallo', visibility: 'PUBLIC' })
  const moussa = await seedMember(treeId, { firstName: 'Moussa', deathDate: '2001' })

  await page.goto(`/tree/${treeId}/member/${moussa}`)

  await expect(page.getByRole('button', { name: /Masquer dates/ })).toHaveCount(0)
})
