import type { Page } from '@playwright/test'
import sharp from 'sharp'
import { registerThroughUi } from '@tests/e2e/support/accounts'
import {
  expect,
  expectNoAccessibilityViolations,
  newVisitorContext,
  test,
} from '@tests/e2e/support/fixtures'
import { seedMember } from '@tests/support/seed-family'
import { seedAcceptedInvitation } from '@tests/support/seed-invitations'
import { seedTree } from '@tests/support/seed-trees'

const heading = (page: Page, name: string) =>
  page.getByRole('heading', { level: 1, name, exact: true })

async function jpeg() {
  const buffer = await sharp({
    create: { width: 40, height: 30, channels: 3, background: { r: 200, g: 120, b: 60 } },
  })
    .jpeg()
    .toBuffer()
  return { name: 'awa.jpg', mimeType: 'image/jpeg', buffer }
}

async function ownTreeWithAwa(page: Page) {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille Diallo',
    visibility: 'PRIVATE',
  })
  const awa = await seedMember(treeId, { firstName: 'Awa', lastName: 'Diallo' })
  return { treeId, awa }
}

test('the owner adds a photo, which the history records, then removes it', async ({ page }) => {
  const { treeId, awa } = await ownTreeWithAwa(page)
  await page.goto(`/tree/${treeId}/member/${awa}`)
  await page.getByRole('link', { name: 'Changer la photo' }).click()
  await expect(heading(page, 'Photo de Awa Diallo')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retirer la photo' })).toHaveCount(0)
  await expectNoAccessibilityViolations(page)

  await page.getByLabel('Nouvelle photo').setInputFiles(await jpeg())
  await page.getByRole('button', { name: 'Enregistrer la photo' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'La photo a été enregistrée.' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Retirer la photo' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'La photo a été retirée.' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retirer la photo' })).toHaveCount(0)

  await page.goto(`/tree/${treeId}/history?action=MEMBER_UPDATED`)
  const entries = page.getByRole('main').locator('ol > li')
  await expect(entries).toHaveCount(2)
  await expect(entries.first()).toContainText('Photo')
  await expect(page.getByRole('main')).not.toContainText('storage/v1')
})

test('a drawing disguised as a photo is refused and explained', async ({ page }) => {
  const { treeId, awa } = await ownTreeWithAwa(page)
  await page.goto(`/tree/${treeId}/member/${awa}/photo`)

  await page.getByLabel('Nouvelle photo').setInputFiles({
    name: 'awa.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
  })
  await page.getByRole('button', { name: 'Enregistrer la photo' }).click()

  const summary = page.getByRole('alert').filter({ hasText: 'Le formulaire contient' })
  await expect(summary).toBeFocused()
  await summary
    .getByRole('link', { name: /Nouvelle photo : Choisissez une photo au format/ })
    .click()
  await expect(page.getByLabel('Nouvelle photo')).toBeFocused()
  await expectNoAccessibilityViolations(page)
})

test('an editor may not change a photo; the account that claimed the member may', async ({
  page,
  browser,
}) => {
  const { treeId, awa } = await ownTreeWithAwa(page)
  const editorContext = await newVisitorContext(browser)
  const editor = await editorContext.newPage()
  const account = await registerThroughUi(editor)
  await seedAcceptedInvitation(treeId, account.email, 'EDITOR')
  const self = await seedMember(treeId, { firstName: 'Binta', claimedByEmail: account.email })

  await editor.goto(`/tree/${treeId}/member/${awa}/photo`)
  await expect(heading(editor, 'Modification réservée')).toBeVisible()

  await editor.goto(`/tree/${treeId}/member/${self}/photo`)
  await editor.getByLabel('Nouvelle photo').setInputFiles(await jpeg())
  await editor.getByRole('button', { name: 'Enregistrer la photo' }).click()
  await expect(
    editor.getByRole('status').filter({ hasText: 'La photo a été enregistrée.' }),
  ).toBeVisible()
  await editorContext.close()
})
