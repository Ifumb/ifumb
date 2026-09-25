import { registerThroughUi } from '@tests/e2e/support/accounts'
import { expect, expectNoAccessibilityViolations, test } from '@tests/e2e/support/fixtures'
import { seedTree } from '@tests/support/seed-trees'
import { seedMember, seedUnion } from '@tests/support/seed-family'
import { seedCrossTreeLink } from '@tests/support/seed-cross-tree-links'
import { captureUiReference } from '@tests/e2e/support/ui-reference'

test('dashboard tour stays anchored to its highlighted target', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1304, height: 700 })
  const owner = await registerThroughUi(page)
  await seedTree({ ownerEmail: owner.email, name: 'Arbre de comparaison', visibility: 'PRIVATE' })
  await page.goto('/dashboard')
  await page.getByRole('button', { name: 'Rejouer la visite guidée' }).click()
  const tour = page.getByRole('dialog', { name: 'Créer votre premier arbre' })
  await expect(tour).toBeVisible()
  await expect
    .poll(async () => {
      const target = await page.locator('#tour-btn-create-tree').boundingBox()
      const popover = await tour.boundingBox()
      return Math.abs(popover!.y - (target!.y + target!.height))
    })
    .toBeLessThan(35)
  await expect(tour.getByRole('button', { name: /Retour/ })).toBeDisabled()
  await captureUiReference(page, info, { name: 'tour-create-tree.png' })
  await expectNoAccessibilityViolations(page)
  await tour.getByRole('button', { name: /Suivant/ }).click()
  await expect(page.getByRole('dialog', { name: 'Vos arbres' })).toBeVisible()
  await expect
    .poll(async () => {
      const target = await page.locator('#tour-tree-list').boundingBox()
      const popover = await page.getByRole('dialog', { name: 'Vos arbres' }).boundingBox()
      return Math.abs(popover!.x + popover!.width / 2 - (target!.x + target!.width / 2))
    })
    .toBeLessThan(3)
  await captureUiReference(page, info, { name: 'tour-tree-list.png' })
  await expectNoAccessibilityViolations(page)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Rejouer la visite guidée' })).toBeFocused()
})

test('mobile tour remains in the viewport and restores keyboard focus', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await registerThroughUi(page)
  const trigger = page.getByRole('button', { name: 'Rejouer la visite guidée' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const tour = page.getByRole('dialog', { name: 'Créer votre premier arbre' })
  await expect(tour).toBeVisible()
  const bounds = await tour.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844)
  await expectNoAccessibilityViolations(page)
  await captureUiReference(page, info, { name: 'tour-mobile.png' })
  await page.keyboard.press('Tab')
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
})

test('empty tree tour points left of filters after the two creation steps', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Arbre vide',
    visibility: 'PRIVATE',
  })
  await page.goto(`/tree/${treeId}`)
  await expect(page.locator('.react-flow')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Zoom avant' }).locator('svg')).toHaveCSS(
    'fill',
    'none',
  )
  await page.getByRole('button', { name: 'Rejouer la visite guidée' }).click()
  await page
    .getByRole('dialog', { name: 'Ajouter un membre' })
    .getByRole('button', { name: /Suivant/ })
    .click()
  await page
    .getByRole('dialog', { name: 'Créer une union' })
    .getByRole('button', { name: /Suivant/ })
    .click()
  const tour = page.getByRole('dialog', { name: 'Filtres', exact: true })
  await expect(tour).toContainText('Étape 3 sur 3')
  const target = await page.locator('#tour-btn-filters').boundingBox()
  const bounds = await tour.boundingBox()
  expect(target!.x - (bounds!.x + bounds!.width)).toBeGreaterThanOrEqual(0)
  expect(target!.x - (bounds!.x + bounds!.width)).toBeLessThan(35)
  await expectNoAccessibilityViolations(page)
  await captureUiReference(page, info, { name: 'tour-filters.png' })
  await tour.getByRole('button', { name: 'Terminer' }).click()
  await expect(page.locator('.driver-overlay')).toHaveCount(0)
})

test('bridge tour expands the authorized branch before pointing at a foreign member', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const owner = await registerThroughUi(page)
  const local = await seedTree({
    ownerEmail: owner.email,
    name: 'Arbre Source',
    visibility: 'PRIVATE',
  })
  const foreign = await seedTree({
    ownerEmail: owner.email,
    name: 'Arbre Distant',
    visibility: 'PRIVATE',
  })
  const awa = await seedMember(local, { firstName: 'Awa' })
  const bridge = await seedMember(foreign, { firstName: 'Awa' })
  const moussa = await seedMember(foreign, { firstName: 'Moussa' })
  await seedUnion(foreign, { type: 'MARRIAGE', parentIds: [bridge, moussa], children: [] })
  await seedCrossTreeLink(local, awa, foreign, bridge)
  await page.goto(`/tree/${local}`)
  await expect(page.locator('[data-tour-member="bridge"]')).toBeVisible()
  await page.getByRole('button', { name: 'Rejouer la visite guidée' }).click()
  const tour = page.getByRole('dialog', { name: 'Membre-pont' })
  await expect(tour).toBeVisible()
  await expectNoAccessibilityViolations(page)
  await captureUiReference(page, info, { name: 'tour-bridge.png' })
  await tour.getByRole('button', { name: /Suivant/ }).click()
  const foreignTour = page.getByRole('dialog', { name: 'Membre étranger' })
  await expect(foreignTour).toBeVisible()
  await expect(page.locator('[data-tour-member="foreign"]')).toContainText('Moussa')
  await expect(page.locator('[data-tour-member="foreign"] a')).toHaveCount(0)
  await expect
    .poll(async () => {
      const member = await page.locator('[data-tour-member="foreign"]').boundingBox()
      const popover = await foreignTour.boundingBox()
      return Math.abs(member!.x + member!.width / 2 - (popover!.x + popover!.width / 2))
    })
    .toBeLessThan(3)
  await expectNoAccessibilityViolations(page)
  await captureUiReference(page, info, { name: 'tour-foreign.png' })
  await foreignTour.getByRole('button', { name: 'Terminer' }).click()
  await expect(page.locator('.driver-overlay')).toHaveCount(0)
  await page.getByRole('button', { name: /^Masquer la branche de/ }).click()
  await expect(page.locator('[data-tour-member="foreign"]')).toHaveCount(0)
  await page.route('**/graph/branch?*', (route) => route.fulfill({ status: 503, body: '{}' }))
  await page.getByRole('button', { name: 'Rejouer la visite guidée' }).click()
  await tour.getByRole('button', { name: /Suivant/ }).click()
  await expect(tour.getByRole('button', { name: /Réessayer/ })).toBeVisible({ timeout: 20_000 })
  await expect(tour.getByRole('status')).toContainText('Cette branche n’est pas disponible')
  await page.keyboard.press('Escape')
  await expect(page.locator('.driver-overlay')).toHaveCount(0)
})

test('populated tree uses the three legacy analysis steps', async ({ page }) => {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Arbre peuplé',
    visibility: 'PRIVATE',
  })
  await seedMember(treeId, { firstName: 'Awa' })
  await page.goto(`/tree/${treeId}`)
  await expect(page.locator('.react-flow')).toBeVisible()
  await page.getByRole('button', { name: 'Rejouer la visite guidée' }).click()
  await page
    .getByRole('dialog', { name: 'Chemin relationnel' })
    .getByRole('button', { name: /Suivant/ })
    .click()
  await page
    .getByRole('dialog', { name: 'Ancêtres communs' })
    .getByRole('button', { name: /Suivant/ })
    .click()
  const last = page.getByRole('dialog', { name: 'Connexions inter-arbres' })
  await expect(last).toContainText('Étape 3 sur 3')
  await last.getByRole('button', { name: 'Terminer' }).click()
  await expect(page.locator('.driver-overlay')).toHaveCount(0)
})
