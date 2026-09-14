import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { MemberId } from '@/core/shared/value-objects/member-id'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaFamilyReader } from '@/infrastructure/persistence/prisma/prisma-family-reader'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const reader = new PrismaFamilyReader(prisma)
const TREE = TreeId.fromString('tree_family')

async function createTree(id: string): Promise<void> {
  await prisma.tree.create({ data: { id, name: `Arbre ${id}`, ownerId: 'usr_owner' } })
}

async function createMember(treeId: string, id: string, extra: object = {}): Promise<void> {
  await prisma.member.create({ data: { id, treeId, firstName: id, ...extra } })
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
  await prisma.user.create({
    data: {
      id: 'usr_owner',
      email: 'owner@ifumb.test',
      passwordHash: 'x',
      firstName: 'A',
      lastName: 'B',
    },
  })
  await createTree('tree_family')
  await createTree('tree_other')
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaFamilyReader', () => {
  it('maps members and unions, with children and their filiation', async () => {
    await createMember('tree_family', 'mbr_father')
    await createMember('tree_family', 'mbr_child')
    await prisma.union.create({
      data: {
        treeId: 'tree_family',
        type: 'MARRIAGE',
        parent1Id: 'mbr_father',
        children: { create: [{ childId: 'mbr_child', filiationType: 'ADOPTIVE' }] },
      },
    })

    const family = await reader.loadFamily(TREE)
    const [parentUnion] = family.parentUnionsOf(MemberId.fromString('mbr_child'))

    expect([parentUnion?.parents.map((p) => p.id.value), parentUnion?.filiation]).toEqual([
      ['mbr_father'],
      'ADOPTIVE',
    ])
  })

  it('reads a date stored in the legacy timestamp text format', async () => {
    await createMember('tree_family', 'mbr_old', { birthDate: '1954-03-12 00:00:00' })

    const family = await reader.loadFamily(TREE)
    const birthDate = family.findMember(MemberId.fromString('mbr_old'))?.details.birthDate

    expect([birthDate?.year, birthDate?.month, birthDate?.day]).toEqual([1954, 3, 12])
  })

  it('shows an unreadable stored date as unknown instead of failing', async () => {
    await createMember('tree_family', 'mbr_odd', { birthDate: 'vers 1900' })

    const family = await reader.loadFamily(TREE)

    expect(family.findMember(MemberId.fromString('mbr_odd'))?.details.birthDate).toBeNull()
  })

  it('leaves out the members of another tree', async () => {
    await createMember('tree_family', 'mbr_here')
    await createMember('tree_other', 'mbr_elsewhere')

    const family = await reader.loadFamily(TREE)

    expect(family.members().map((m) => m.id.value)).toEqual(['mbr_here'])
  })
})
