import { registerThroughUi } from '@tests/e2e/support/accounts'
import {
  expect,
  expectNoAccessibilityViolations,
  newVisitorContext,
  test,
} from '@tests/e2e/support/fixtures'
import { seedMember } from '@tests/support/seed-family'
import { seedTree } from '@tests/support/seed-trees'

// Every account registered through the UI is named "Awa Diallo" (a fixed test fixture): each
// discoverable member below gets its own distinct name so a name never has to distinguish between
// the member, the owner and the requester, or between the two tests running in parallel — global
// search spans every tree, so two tests reusing the same member name would collide.
const MEMBER_NAME = 'Fatou Sow'

test('a visitor finds a discoverable member, contacts the owner, and is accepted', async ({
  page,
  browser,
}) => {
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille Diallo',
    visibility: 'PRIVATE',
  })
  const fatou = await seedMember(treeId, { firstName: 'Fatou', lastName: 'Sow', ethnicity: 'Peul' })

  // The owner opts the member into global search from their own profile.
  await page.goto(`/tree/${treeId}/member/${fatou}`)
  await page.getByRole('button', { name: 'Rendre découvrable' }).click()
  await expect(page.getByRole('button', { name: 'Retirer de la recherche' })).toBeVisible()

  // A different, signed-in visitor finds Fatou through the global search, never her tree's name.
  const visitorContext = await newVisitorContext(browser)
  const visitor = await visitorContext.newPage()
  const requester = await registerThroughUi(visitor)
  await visitor.goto('/explore/members?q=Fatou')
  await expect(
    visitor.getByRole('heading', { level: 2, name: 'Membres découvrables d’arbres privés' }),
  ).toBeVisible()
  const row = visitor.getByRole('listitem').filter({ hasText: MEMBER_NAME })
  await expect(row.getByText('Arbre privé.')).toBeVisible()
  await expectNoAccessibilityViolations(visitor)

  await row.getByLabel('Message (facultatif)').fill('Bonjour, je crois que nous sommes cousines.')
  await row.getByRole('button', { name: `Contacter ${MEMBER_NAME}` }).click()
  await expect(row.getByText('En attente')).toBeVisible()

  // The owner sees the request, without the requester's email until they decide.
  await page.goto('/contact-requests')
  await expect(page.getByRole('heading', { level: 1, name: 'Demandes de contact' })).toBeVisible()
  const received = page.getByRole('listitem').filter({ hasText: MEMBER_NAME })
  await expect(received).toContainText('Bonjour, je crois que nous sommes cousines.')
  await expect(received.getByText(requester.email)).toHaveCount(0)
  await expectNoAccessibilityViolations(page)

  await received.getByRole('button', { name: 'Accepter' }).click()
  const acceptedReceived = page.getByRole('listitem').filter({ hasText: MEMBER_NAME })
  await expect(acceptedReceived).toContainText('Acceptée')
  await expect(acceptedReceived.getByText(requester.email)).toBeVisible()

  // The requester now sees the owner's email too, only now that it is accepted.
  await visitor.goto('/contact-requests')
  const sent = visitor.getByRole('listitem').filter({ hasText: MEMBER_NAME })
  await expect(sent.getByText('Acceptée')).toBeVisible()
  await expect(sent.getByText(owner.email)).toBeVisible()
  await visitorContext.close()
})

test('a requester withdraws a pending contact request', async ({ page, browser }) => {
  const withdrawMemberName = 'Mariam Koné'
  const owner = await registerThroughUi(page)
  const treeId = await seedTree({
    ownerEmail: owner.email,
    name: 'Famille Diallo',
    visibility: 'PRIVATE',
  })
  await seedMember(treeId, { firstName: 'Mariam', lastName: 'Koné', discoverable: true })

  const visitorContext = await newVisitorContext(browser)
  const visitor = await visitorContext.newPage()
  await registerThroughUi(visitor)
  await visitor.goto('/explore/members?q=Mariam')
  const row = visitor.getByRole('listitem').filter({ hasText: withdrawMemberName })
  await row.getByRole('button', { name: `Contacter ${withdrawMemberName}` }).click()
  await expect(row.getByText('En attente')).toBeVisible()

  await visitor.goto('/contact-requests')
  const sent = visitor.getByRole('listitem').filter({ hasText: withdrawMemberName })
  await sent.getByRole('button', { name: 'Retirer' }).click()
  await expect(
    visitor.getByRole('listitem').filter({ hasText: withdrawMemberName }),
  ).toContainText('Retirée')
  await visitorContext.close()
})
