import { captureUiReference } from '@tests/e2e/support/ui-reference'
import { registerThroughUi } from '@tests/e2e/support/accounts'
import { expect, expectNoAccessibilityViolations, test } from '@tests/e2e/support/fixtures'
import { seedMember, seedUnion } from '@tests/support/seed-family'
import { seedTree } from '@tests/support/seed-trees'

test('legacy dashboard keeps account navigation in the header and creates in a dialog', async ({
  page,
}) => {
  await registerThroughUi(page)
  await expect(page.getByRole('banner').getByRole('link', { name: 'Mes arbres' })).toBeVisible()
  await expect(page.getByText('Connecté en tant que', { exact: false })).toHaveCount(0)
  await page.getByRole('link', { name: /Créer/ }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/dashboard$/)
})

test('an empty tree opens a full workspace with graph and contextual member creation', async ({
  page,
}) => {
  const owner = await registerThroughUi(page)
  const id = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille de référence',
    visibility: 'PRIVATE',
  })
  await page.goto(`/tree/${id}`)
  await expect(page.locator('.react-flow')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Famille de référence', exact: true }),
  ).toBeVisible()
  const canvas = await page.locator('.react-flow').boundingBox()
  expect(canvas!.width).toBeGreaterThan(page.viewportSize()!.width * 0.8)
  await page.getByRole('link', { name: 'Ajouter un membre', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.react-flow')).toBeVisible()
  await expectNoAccessibilityViolations(page)
})

test('reference desktop and mobile screens retain their layout', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  const owner = await registerThroughUi(page)
  const id = await seedTree({
    ownerEmail: owner.email,
    name: 'BABIK BA MOULOUNGUI',
    visibility: 'PRIVATE',
  })
  await page.goto('/dashboard')
  await captureUiReference(page, testInfo, { name: 'dashboard-desktop.png', fullPage: true })
  await page.goto(`/tree/${id}`)
  await expect(page.locator('.react-flow')).toBeVisible()
  await captureUiReference(page, testInfo, { name: 'tree-empty-desktop.png' })
  await page.getByRole('link', { name: 'Ajouter un membre', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await captureUiReference(page, testInfo, { name: 'member-create-desktop.png' })
  await expectNoAccessibilityViolations(page)
  await page.keyboard.press('Escape')
  await page.setViewportSize({ width: 390, height: 844 })
  await captureUiReference(page, testInfo, { name: 'tree-empty-mobile.png' })
  await expectNoAccessibilityViolations(page)
})

test('inviting stays contextual after success and browser history restores the tree', async ({
  page,
}) => {
  const owner = await registerThroughUi(page)
  const id = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille invitations',
    visibility: 'PRIVATE',
  })
  await page.goto(`/tree/${id}`)
  await page.getByRole('link', { name: 'Inviter', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Inviter un collaborateur' })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Email').fill('invitation-ui@ifumb.test')
  await dialog.getByRole('button', { name: 'Envoyer l’invitation' }).click()
  await expect(dialog.getByRole('status')).toContainText('Invitation envoyée')
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(`/tree/${id}`)
  await expect(page.getByRole('link', { name: 'Inviter', exact: true })).toBeFocused()
  await page.goForward()
  await expect(dialog).toBeVisible()
  await page.reload()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Inviter un collaborateur' })).toBeVisible()
})

test('member tabs retain values, work with arrows and reveal validation in the right tab', async ({
  page,
}) => {
  const owner = await registerThroughUi(page)
  const id = await seedTree({ ownerEmail: owner.email, name: 'Onglets', visibility: 'PRIVATE' })
  await page.goto(`/tree/${id}/members/new`)
  await page.getByLabel('Prénom', { exact: true }).fill('Awa')
  await page.getByRole('tab', { name: 'Identité', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Dates & Lieux' })).toBeFocused()
  await page
    .getByRole('group', { name: 'Date de naissance', exact: true })
    .getByLabel('Mois')
    .selectOption('2')
  await page.getByRole('tab', { name: 'Bio', exact: true }).click()
  await page.getByRole('button', { name: 'Ajouter le membre' }).click()
  await expect(page.getByRole('tab', { name: 'Dates & Lieux' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await page.getByRole('tab', { name: 'Identité', exact: true }).click()
  await expect(page.getByLabel('Prénom', { exact: true })).toHaveValue('Awa')
})

test('a populated graph opens the full member profile and retains view controls', async ({
  page,
}, testInfo) => {
  const owner = await registerThroughUi(page)
  const id = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille de référence',
    visibility: 'PRIVATE',
  })
  const parent = await seedMember(id, { firstName: 'Moussa', lastName: 'Diallo' })
  const partner = await seedMember(id, { firstName: 'Awa', lastName: 'Diallo' })
  const child = await seedMember(id, { firstName: 'Fatou', lastName: 'Sow', tribe: 'Peul' })
  await seedUnion(id, {
    type: 'MARRIAGE',
    parentIds: [parent, partner],
    children: [{ childId: child, filiation: 'BIOLOGICAL' }],
  })
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto(`/tree/${id}`)
  await expect(page.locator('.react-flow__node-member')).toHaveCount(3)
  await page.getByRole('button', { name: 'Afficher minimap', exact: true }).click()
  await expect(page.locator('.react-flow__minimap')).toBeVisible()
  await page.getByRole('button', { name: 'Masquer la minimap' }).click()
  await captureUiReference(page, testInfo, { name: 'tree-populated-desktop.png' })
  await page
    .locator('.react-flow__node-member')
    .getByRole('link', { name: /Fatou Sow/ })
    .click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Fatou Sow', exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Culture', exact: true }).click()
  await expect(page.getByText('Peul', { exact: true })).toBeVisible()
  await captureUiReference(page, testInfo, { name: 'member-profile-desktop.png' })
  await expectNoAccessibilityViolations(page)
})

test('the guided tour opens for a first visit and can be replayed with the keyboard', async ({
  browser,
}) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await registerThroughUi(page)
  await expect(page.getByRole('dialog', { name: 'Créer votre premier arbre' })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Rejouer la visite guidée' }).focus()
  await page.keyboard.press('Enter')
  const tour = page.getByRole('dialog', { name: 'Créer votre premier arbre' })
  await expect(tour).toBeVisible()
  await expectNoAccessibilityViolations(page)
  await tour.getByRole('button', { name: 'Suivant' }).click()
  await page
    .getByRole('dialog', { name: 'Vos arbres' })
    .getByRole('button', { name: 'Terminer' })
    .click()
  await expect(page.getByRole('button', { name: 'Rejouer la visite guidée' })).toBeFocused()
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('tour_seen:dashboard')))
    .toBe('true')
  await context.close()
})
