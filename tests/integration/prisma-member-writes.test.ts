import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { MemberId } from '@/core/shared/value-objects/member-id'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { CreateMemberUseCase } from '@/core/use-cases/create-member'
import { DeleteMemberUseCase } from '@/core/use-cases/delete-member'
import { UpdateMemberUseCase } from '@/core/use-cases/update-member'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaFamilyReader } from '@/infrastructure/persistence/prisma/prisma-family-reader'
import { PrismaTreeReader } from '@/infrastructure/persistence/prisma/prisma-tree-reader'
import { PrismaUnitOfWork } from '@/infrastructure/persistence/prisma/prisma-unit-of-work'
import { SystemClock } from '@/infrastructure/system/system-clock'
import { UuidIdGenerator } from '@/infrastructure/system/uuid-id-generator'
import { dateOf } from '@tests/support/family-fixtures'
import { memberInput } from '@tests/support/member-inputs'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const families = new PrismaFamilyReader(prisma)
const deps = {
  trees: new PrismaTreeReader(prisma),
  families,
  unitOfWork: new PrismaUnitOfWork(prisma, { writesEnabled: true }),
  ids: new UuidIdGenerator(),
  clock: new SystemClock(),
}
const TREE = 'tree_members'
const byOwner = { treeId: TREE, viewerId: 'usr_owner' }

async function createUser(id: string): Promise<void> {
  await prisma.user.create({
    data: { id, email: `${id}@ifumb.test`, passwordHash: 'x', firstName: id, lastName: 'Test' },
  })
}

async function addMember(firstName: string): Promise<string> {
  const created = await new CreateMemberUseCase(deps).execute({
    ...byOwner,
    ...memberInput({ firstName }),
  })
  if (!created.ok) throw new Error(`Could not create ${firstName}`)
  return created.value.memberId
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
  await createUser('usr_owner')
  await prisma.tree.create({ data: { id: TREE, name: 'Famille Diallo', ownerId: 'usr_owner' } })
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('member writes through Prisma', () => {
  it('stores a new member with its dates as text and its history entry', async () => {
    const created = await new CreateMemberUseCase(deps).execute({
      ...byOwner,
      ...memberInput({ birthDate: dateOf('1932-05-07'), deathDate: dateOf('2001') }),
    })

    const memberId = created.ok ? created.value.memberId : ''
    const row = await prisma.member.findUniqueOrThrow({ where: { id: memberId } })
    const entries = await prisma.auditLog.findMany({ where: { targetId: memberId } })
    expect([row.firstName, row.birthDate, row.deathDate, row.treeId]).toEqual([
      'Awa',
      '1932-05-07',
      '2001',
      TREE,
    ])
    expect(entries.map((entry) => entry.action)).toEqual(['MEMBER_CREATED'])
  })

  it('clears the fields emptied by an update', async () => {
    const memberId = await addMember('Awa')

    const result = await new UpdateMemberUseCase(deps).execute({
      ...byOwner,
      memberId,
      ...memberInput({ tribe: null, birthDate: null, nickname: 'Mama' }),
    })

    const row = await prisma.member.findUniqueOrThrow({ where: { id: memberId } })
    expect(result).toEqual({ ok: true, value: { changed: true } })
    expect([row.tribe, row.birthDate, row.nickname]).toEqual([null, null, 'Mama'])
  })

  it('lets the account that claimed a member edit it', async () => {
    const memberId = await addMember('Awa')
    await createUser('usr_claimer')
    await prisma.member.update({
      where: { id: memberId },
      data: { claimedByUserId: 'usr_claimer' },
    })
    await prisma.invitation.create({
      data: {
        treeId: TREE,
        email: 'usr_claimer@ifumb.test',
        userId: 'usr_claimer',
        status: 'ACCEPTED',
      },
    })

    const result = await new UpdateMemberUseCase(deps).execute({
      treeId: TREE,
      viewerId: 'usr_claimer',
      memberId,
      ...memberInput({ biography: 'Née au Fouta' }),
    })

    const family = await families.loadFamily(TreeId.fromString(TREE))
    const member = family.findMember(MemberId.fromString(memberId))
    expect(result).toEqual({ ok: true, value: { changed: true } })
    expect([member?.claimedById, member?.details.biography]).toEqual([
      'usr_claimer',
      'Née au Fouta',
    ])
  })
})

describe('member deletion through Prisma', () => {
  const remove = (memberId: string) =>
    new DeleteMemberUseCase(deps).execute({ ...byOwner, memberId })

  it('deletes a member listed as a child, with its child links only', async () => {
    const [father, child, sibling] = [
      await addMember('Moussa'),
      await addMember('Awa'),
      await addMember('Fatou'),
    ]
    await prisma.union.create({
      data: {
        treeId: TREE,
        type: 'MARRIAGE',
        parent1Id: father,
        children: { create: [{ childId: child }, { childId: sibling }] },
      },
    })

    expect(await remove(child)).toEqual({ ok: true, value: undefined })
    expect(await prisma.member.count({ where: { id: child } })).toBe(0)
    expect(await prisma.unionChild.findMany({ select: { childId: true } })).toEqual([
      { childId: sibling },
    ])
    expect(
      await prisma.auditLog.count({ where: { targetId: child, action: 'MEMBER_DELETED' } }),
    ).toBe(1)
  })

  it('keeps the union of a deleted parent with the other parent', async () => {
    const [father, mother] = [await addMember('Moussa'), await addMember('Awa')]
    const union = await prisma.union.create({
      data: { treeId: TREE, type: 'MARRIAGE', parent1Id: father, parent2Id: mother },
    })

    await remove(father)

    const kept = await prisma.union.findUniqueOrThrow({ where: { id: union.id } })
    expect([kept.parent1Id, kept.parent2Id]).toEqual([null, mother])
  })
})
