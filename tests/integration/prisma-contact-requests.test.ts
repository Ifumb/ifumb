import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { ContactRequest } from '@/core/entities/contact-request'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaContactRequestReader } from '@/infrastructure/persistence/prisma/prisma-contact-request-reader'
import { PrismaContactRequestWriter } from '@/infrastructure/persistence/prisma/prisma-contact-request-writer'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const writer = new PrismaContactRequestWriter(prisma)
const reader = new PrismaContactRequestReader(prisma)
const TREE = 'tree_diallo'
const OWNER = 'usr_owner'
const REQUESTER = 'usr_requester'

async function createUser(id: string, firstName: string): Promise<void> {
  await prisma.user.create({
    data: { id, email: `${id}@ifumb.test`, passwordHash: 'x', firstName, lastName: 'Test' },
  })
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
  await createUser(OWNER, 'Awa')
  await createUser(REQUESTER, 'Fatou')
  await prisma.tree.create({ data: { id: TREE, name: 'Famille Diallo', ownerId: OWNER } })
  await prisma.member.create({
    data: { id: 'mbr_awa', firstName: 'Awa', treeId: TREE, discoverable: true, ethnicity: 'Peul' },
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})

function aRequest(overrides: Partial<Parameters<typeof ContactRequest.send>[0]> = {}) {
  return ContactRequest.send({
    id: 'cr_1',
    treeId: TREE,
    memberId: 'mbr_awa',
    requesterId: REQUESTER,
    message: 'Bonjour !',
    now: new Date('2026-09-17T10:00:00Z'),
    ...overrides,
  })
}

describe('contact requests through Prisma', () => {
  it('sends a fresh request', async () => {
    await writer.send(aRequest())

    const row = await prisma.contactRequest.findUniqueOrThrow({ where: { id: 'cr_1' } })
    expect([row.status, row.message, row.treeId]).toEqual(['PENDING', 'Bonjour !', TREE])
  })

  it('resets the same row instead of adding a second one when sent again', async () => {
    await writer.send(aRequest())
    await writer.send(aRequest({ message: 'Deuxième message' }))

    const rows = await prisma.contactRequest.findMany({
      where: { requesterId: REQUESTER, memberId: 'mbr_awa' },
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.message).toBe('Deuxième message')
  })

  it('resolves a request', async () => {
    await writer.send(aRequest())
    const found = await reader.findById('cr_1')
    const resolved = found?.respond('ACCEPTED', new Date('2026-09-18T10:00:00Z'))
    if (!resolved?.ok) throw new Error('expected the resolution to succeed')

    await writer.resolve(resolved.value)

    const row = await prisma.contactRequest.findUniqueOrThrow({ where: { id: 'cr_1' } })
    expect(row.status).toBe('ACCEPTED')
  })

  it('finds a request by its (requester, member) pair', async () => {
    await writer.send(aRequest())
    expect(await reader.findByRequesterAndMember(REQUESTER, 'mbr_awa')).toMatchObject({ id: 'cr_1' })
    expect(await reader.findByRequesterAndMember('usr_stranger', 'mbr_awa')).toBeNull()
  })

  it('never exposes the requester’s email to the owner before the request is accepted', async () => {
    await writer.send(aRequest())

    const [pending] = await reader.listReceivedBy(OWNER)
    expect(pending?.requesterEmail).toBeNull()

    const found = await reader.findById('cr_1')
    const resolved = found?.respond('ACCEPTED', new Date('2026-09-18T10:00:00Z'))
    if (!resolved?.ok) throw new Error('expected the resolution to succeed')
    await writer.resolve(resolved.value)

    const [accepted] = await reader.listReceivedBy(OWNER)
    expect(accepted?.requesterEmail).toBe('usr_requester@ifumb.test')
  })

  it('never exposes the owner’s email to the requester before the request is accepted', async () => {
    await writer.send(aRequest())

    const [pending] = await reader.listSentBy(REQUESTER)
    expect(pending?.ownerEmail).toBeNull()
    expect(pending?.treeName).toBe('Famille Diallo')
  })

  it('finds the viewer’s own statuses for a batch of members, one query', async () => {
    await writer.send(aRequest())
    await prisma.member.create({
      data: { id: 'mbr_moussa', firstName: 'Moussa', treeId: TREE, discoverable: true },
    })

    const statuses = await reader.findStatusesForRequester(REQUESTER, ['mbr_awa', 'mbr_moussa'])

    expect(statuses.get('mbr_awa')).toBe('PENDING')
    expect(statuses.get('mbr_moussa')).toBeUndefined()
  })
})
