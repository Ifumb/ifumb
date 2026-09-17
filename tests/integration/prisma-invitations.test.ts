import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { Invitation } from '@/core/entities/invitation'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaInvitationReader } from '@/infrastructure/persistence/prisma/prisma-invitation-reader'
import { PrismaInvitationWriter } from '@/infrastructure/persistence/prisma/prisma-invitation-writer'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const writer = new PrismaInvitationWriter(prisma)
const reader = new PrismaInvitationReader(prisma)
const TREE = 'tree_diallo'
const OWNER = 'usr_owner'
const EDITOR = 'usr_editor'
const EDITOR_EMAIL = 'fatou@ifumb.test'

async function createUser(id: string, email: string, firstName: string): Promise<void> {
  await prisma.user.create({
    data: { id, email, passwordHash: 'x', firstName, lastName: 'Test' },
  })
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
  await createUser(OWNER, 'owner@ifumb.test', 'Awa')
  await createUser(EDITOR, EDITOR_EMAIL, 'Fatou')
  await prisma.tree.create({ data: { id: TREE, name: 'Famille Diallo', ownerId: OWNER } })
})

afterAll(async () => {
  await prisma.$disconnect()
})

function anInvitation(overrides: Partial<Parameters<typeof Invitation.send>[0]> = {}) {
  return Invitation.send({
    id: 'inv_1',
    treeId: TREE,
    email: EDITOR_EMAIL,
    role: 'EDITOR',
    token: 'token-1',
    expiresAt: new Date('2026-09-24T10:00:00Z'),
    now: new Date('2026-09-17T10:00:00Z'),
    ...overrides,
  })
}

describe('invitations through Prisma', () => {
  it('sends a fresh invitation', async () => {
    await writer.send(anInvitation())

    const row = await prisma.invitation.findUniqueOrThrow({ where: { id: 'inv_1' } })
    expect([row.email, row.role, row.status, row.token]).toEqual([EDITOR_EMAIL, 'EDITOR', 'PENDING', 'token-1'])
  })

  it('resets the same row instead of adding a second one when sent again', async () => {
    await writer.send(anInvitation())
    await writer.send(anInvitation({ id: 'inv_1', role: 'VIEWER', token: 'token-2' }))

    const rows = await prisma.invitation.findMany({ where: { treeId: TREE, email: EDITOR_EMAIL } })
    expect(rows).toHaveLength(1)
    expect([rows[0]?.role, rows[0]?.token]).toEqual(['VIEWER', 'token-2'])
  })

  it('resets a rejected invitation back to pending, instead of failing (legacy bug 1)', async () => {
    await writer.send(anInvitation())
    const rejected = anInvitation().resolve('REJECTED', {
      userId: EDITOR,
      now: new Date('2026-09-18T10:00:00Z'),
    })
    if (!rejected.ok) throw new Error('expected the rejection to succeed')
    await writer.resolve(rejected.value)

    await writer.send(anInvitation({ id: 'inv_1', token: 'token-3' }))

    const rows = await prisma.invitation.findMany({ where: { treeId: TREE, email: EDITOR_EMAIL } })
    expect(rows).toHaveLength(1)
    expect([rows[0]?.status, rows[0]?.token]).toEqual(['PENDING', 'token-3'])
  })

  it('finds an invitation by its token, but not once resolved', async () => {
    await writer.send(anInvitation())
    expect(await reader.findByToken('token-1')).toMatchObject({ id: 'inv_1' })

    const accepted = anInvitation().resolve('ACCEPTED', { userId: EDITOR, now: new Date('2026-09-18T10:00:00Z') })
    if (!accepted.ok) throw new Error('expected the acceptance to succeed')
    await writer.resolve(accepted.value)

    expect(await reader.findByToken('token-1')).toBeNull()
  })

  it('lists collaborators newest first, naming the linked account once accepted', async () => {
    await writer.send(anInvitation({ id: 'inv_1', email: EDITOR_EMAIL, now: new Date('2026-09-10T00:00:00Z') }))
    const accepted = anInvitation().resolve('ACCEPTED', { userId: EDITOR, now: new Date('2026-09-11T00:00:00Z') })
    if (!accepted.ok) throw new Error('expected the acceptance to succeed')
    await writer.resolve(accepted.value)
    await writer.send(
      anInvitation({
        id: 'inv_2',
        email: 'other@ifumb.test',
        token: 'token-2',
        now: new Date('2026-09-15T00:00:00Z'),
      }),
    )

    const collaborators = await reader.listForTree(TREE)

    expect(collaborators).toMatchObject([
      { invitation: { id: 'inv_2' }, user: null },
      { invitation: { id: 'inv_1', status: 'ACCEPTED' }, user: { firstName: 'Fatou', lastName: 'Test' } },
    ])
  })

  it('changes a collaborator’s role', async () => {
    await writer.send(anInvitation())
    const accepted = anInvitation().resolve('ACCEPTED', { userId: EDITOR, now: new Date('2026-09-18T10:00:00Z') })
    if (!accepted.ok) throw new Error('expected the acceptance to succeed')
    await writer.resolve(accepted.value)

    const changed = accepted.value.changeRole('VIEWER', new Date('2026-09-19T00:00:00Z'))
    if (!changed.ok) throw new Error('expected the role change to succeed')
    await writer.changeRole(changed.value)

    const row = await prisma.invitation.findUniqueOrThrow({ where: { id: 'inv_1' } })
    expect(row.role).toBe('VIEWER')
  })

  it('revokes an invitation, removing its row entirely', async () => {
    await writer.send(anInvitation())
    await writer.revoke('inv_1')

    expect(await prisma.invitation.findUnique({ where: { id: 'inv_1' } })).toBeNull()
  })
})
