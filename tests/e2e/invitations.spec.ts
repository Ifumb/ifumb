import type { Page } from '@playwright/test'
import { registerThroughUi } from '@tests/e2e/support/accounts'
import {
  expect,
  expectNoAccessibilityViolations,
  newVisitorContext,
  test,
} from '@tests/e2e/support/fixtures'
import { seedMember } from '@tests/support/seed-family'
import { findInvitationToken, seedAcceptedInvitation } from '@tests/support/seed-invitations'
import { seedTree } from '@tests/support/seed-trees'

const heading = (page: Page, name: string) =>
  page.getByRole('heading', { level: 1, name, exact: true })

async function dialloTree(page: Page) {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille Diallo',
    visibility: 'PRIVATE',
  })
  return { treeId }
}

test('the owner invites by email; a new visitor registers, is sent back, and accepts', async ({
  page,
  browser,
}) => {
  const { treeId } = await dialloTree(page)

  await page.goto(`/tree/${treeId}/collaborators`)
  await expect(heading(page, 'Collaborateurs — Famille Diallo')).toBeVisible()
  await page.getByLabel('Email').fill('fatou@example.com')
  await page.getByLabel('Rôle', { exact: true }).selectOption('EDITOR')
  await page.getByRole('button', { name: 'Envoyer l’invitation' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Invitation envoyée' })).toBeVisible()
  await expectNoAccessibilityViolations(page)

  const token = await findInvitationToken(treeId, 'fatou@example.com')
  const visitorContext = await newVisitorContext(browser)
  const visitor = await visitorContext.newPage()
  await visitor.goto(`/invitations/accept?token=${token}`)
  await expect(heading(visitor, 'Invitation à collaborer')).toBeVisible()
  await expect(visitor.getByText('Famille Diallo')).toBeVisible()

  await visitor.getByRole('link', { name: 'Créer un compte' }).click()
  await visitor.getByLabel('Prénom', { exact: true }).fill('Fatou')
  await visitor.getByLabel('Nom', { exact: true }).fill('Sow')
  await visitor.getByLabel('Email', { exact: true }).fill('fatou@example.com')
  await visitor.getByLabel('Mot de passe', { exact: true }).fill('E2e-password-123')
  await visitor.getByRole('button', { name: 'Créer mon compte' }).click()

  // The redirect parameter sent the freshly registered visitor straight back to the invitation.
  await expect(heading(visitor, 'Invitation à collaborer')).toBeVisible()
  await visitor.getByRole('button', { name: 'Accepter' }).click()
  await expect(visitor).toHaveURL(`/tree/${treeId}`)

  await page.goto(`/tree/${treeId}/collaborators`)
  await expect(page.getByText('Fatou Sow', { exact: true })).toBeVisible()
  await expect(page.getByText('Acceptée · Éditeur')).toBeVisible()
  await visitorContext.close()
})

test('the owner changes a collaborator’s role, then revokes access and its pending proposals', async ({
  page,
  browser,
}) => {
  const { treeId } = await dialloTree(page)
  const awa = await seedMember(treeId, { firstName: 'Awa', lastName: 'Diallo' })
  const editorContext = await newVisitorContext(browser)
  const editor = await editorContext.newPage()
  const account = await registerThroughUi(editor)
  await seedAcceptedInvitation(treeId, account.email, 'EDITOR')

  await editor.goto(`/tree/${treeId}/member/${awa}/edit`)
  await editor.getByLabel('Tribu').fill('Soninke')
  await editor.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(
    editor.getByRole('status').filter({ hasText: 'Proposition envoyée' }),
  ).toBeVisible()

  await page.goto(`/tree/${treeId}/collaborators`)
  const row = page.getByRole('listitem')
  await row.getByLabel(/Rôle de/).selectOption('VIEWER')
  await row.getByRole('button', { name: 'Changer' }).click()
  await expect(page.getByText('Acceptée · Lecteur')).toBeVisible()

  await page.getByRole('link', { name: /Révoquer l’accès de/ }).click()
  await expect(heading(page, `Révoquer l’accès de ${account.fullName} ?`)).toBeVisible()
  await expectNoAccessibilityViolations(page)
  await page.getByRole('button', { name: 'Révoquer l’accès' }).click()
  await expect(page).toHaveURL(`/tree/${treeId}/collaborators`)
  await expect(page.getByText('Aucun collaborateur')).toBeVisible()

  await page.goto(`/tree/${treeId}/pending`)
  await expect(page.getByText('Aucune modification en attente.')).toBeVisible()
  await editorContext.close()
})
