import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { PageRequest } from '@/core/shared/value-objects/page-request'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaPublicMemberDirectory } from '@/infrastructure/persistence/prisma/prisma-public-member-directory'
import { PrismaPublicTreeCatalog } from '@/infrastructure/persistence/prisma/prisma-public-tree-catalog'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const catalog = new PrismaPublicTreeCatalog(prisma)
const directory = new PrismaPublicMemberDirectory(prisma)
const FIRST_PAGE = PageRequest.of(1, 20)

type TreeInput = {
  readonly id: string
  readonly visibility?: 'PRIVATE' | 'SHARED' | 'PUBLIC'
  readonly archived?: boolean
  readonly createdAt?: Date
  readonly members?: readonly Record<string, string>[]
}

async function createTree({
  id,
  visibility = 'PUBLIC',
  archived,
  createdAt,
  members = [],
}: TreeInput) {
  await prisma.tree.create({
    data: {
      id,
      name: `Famille ${id}`,
      visibility,
      ownerId: 'usr_owner',
      archivedAt: archived ? new Date() : null,
      createdAt,
      members: {
        create: members.map((member, index) => ({
          id: `${id}_m${index}`,
          firstName: 'X',
          ...member,
        })),
      },
    },
  })
}

const ids = (items: readonly { id: string }[]) => items.map((item) => item.id)

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
  await prisma.user.create({
    data: {
      id: 'usr_owner',
      email: 'owner@ifumb.test',
      passwordHash: 'x',
      firstName: 'Kadiatou',
      lastName: 'Barry',
    },
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaPublicTreeCatalog', () => {
  it('lists public trees only, most recent first, leaving out private, shared and archived ones', async () => {
    await createTree({ id: 'old', createdAt: new Date('2026-01-01') })
    await createTree({ id: 'new', createdAt: new Date('2026-02-01') })
    await createTree({ id: 'private', visibility: 'PRIVATE' })
    await createTree({ id: 'shared', visibility: 'SHARED' })
    await createTree({ id: 'archived', archived: true })

    const page = await catalog.search({}, FIRST_PAGE)

    expect([ids(page.items), page.total]).toEqual([['new', 'old'], 2])
  })

  it('finds a tree by its name or its owner name', async () => {
    await createTree({ id: 'diallo' })

    const byName = await catalog.search({ text: 'DIALLO' }, FIRST_PAGE)
    const byOwner = await catalog.search({ text: 'barry' }, FIRST_PAGE)
    const none = await catalog.search({ text: 'sow' }, FIRST_PAGE)

    expect([byName.total, byOwner.total, none.total]).toEqual([1, 1, 0])
  })

  it('applies the tribe and the ethnicity filters together', async () => {
    await createTree({ id: 'both', members: [{ tribe: 'Peul, Malinké', ethnicity: 'Wolof' }] })
    await createTree({ id: 'tribe_only', members: [{ tribe: 'Peul' }] })
    await createTree({ id: 'ethnicity_only', members: [{ tribe: 'Bambara', ethnicity: 'Wolof' }] })

    const page = await catalog.search({ tribe: 'malinké', ethnicity: 'wolof' }, FIRST_PAGE)

    expect(ids(page.items)).toEqual(['both'])
  })

  it('summarises a tree with its owner, member count and cultural tokens', async () => {
    await createTree({
      id: 'diallo',
      members: [{ tribe: 'Peul, Malinké' }, { tribe: 'Peul', ethnicity: 'Wolof' }],
    })

    const [tree] = (await catalog.search({}, FIRST_PAGE)).items

    expect(tree).toEqual({
      id: 'diallo',
      name: 'Famille diallo',
      description: null,
      owner: { firstName: 'Kadiatou', lastName: 'Barry' },
      memberCount: 2,
      tribes: ['Malinké', 'Peul'],
      ethnicities: ['Wolof'],
    })
  })

  it('pages the trees and counts them all', async () => {
    for (let index = 0; index < 3; index += 1) await createTree({ id: `tree_${index}` })

    const second = await catalog.search({}, PageRequest.of(2, 2))

    expect([second.items.length, second.total, second.totalPages]).toEqual([1, 3, 2])
  })

  it('reads the cultural values of every public tree, not only the page shown', async () => {
    await createTree({ id: 'public', members: [{ tribe: 'Peul', ethnicity: 'Wolof' }] })
    await createTree({ id: 'private', visibility: 'PRIVATE', members: [{ tribe: 'Secret' }] })

    const values = await catalog.culturalValues()

    expect([values.tribes, values.ethnicities]).toEqual([['Peul'], ['Wolof']])
  })
})

describe('PrismaPublicMemberDirectory', () => {
  it.each([
    ['firstName', 'Fatoumata'],
    ['lastName', 'Traoré'],
    ['ethnicity', 'Soninké'],
    ['tribe', 'Bambara'],
    ['clan', 'Keita'],
    ['originRegion', 'Kayes'],
  ])('finds a member by %s', async (field, value) => {
    await createTree({ id: 'public', members: [{ [field]: value }] })

    const page = await directory.search(value.slice(1, 5).toUpperCase(), FIRST_PAGE)

    expect(page.total).toBe(1)
  })

  it('leaves out members of private, shared and archived trees', async () => {
    await createTree({ id: 'private', visibility: 'PRIVATE', members: [{ firstName: 'Awa' }] })
    await createTree({ id: 'shared', visibility: 'SHARED', members: [{ firstName: 'Awa' }] })
    await createTree({ id: 'archived', archived: true, members: [{ firstName: 'Awa' }] })

    expect((await directory.search('awa', FIRST_PAGE)).total).toBe(0)
  })

  it('pages the members in name order with a total covering every page', async () => {
    await createTree({
      id: 'public',
      members: [
        { firstName: 'Awa' },
        { firstName: 'Aminata' },
        { firstName: 'Adama', lastName: 'Sow' },
      ],
    })

    const first = await directory.search('a', PageRequest.of(1, 2))
    const second = await directory.search('a', PageRequest.of(2, 2))

    expect([first.items.map((m) => m.firstName), second.items.map((m) => m.firstName)]).toEqual([
      ['Adama', 'Aminata'],
      ['Awa'],
    ])
    expect([first.total, second.total]).toEqual([3, 3])
  })

  it('summarises a member with its tree', async () => {
    await createTree({
      id: 'public',
      members: [
        {
          firstName: 'Awa',
          birthDate: '1932-05-12 00:00:00',
          tribe: 'Peul, Malinké',
          originRegion: 'Fouta',
        },
      ],
    })

    const [member] = (await directory.search('awa', FIRST_PAGE)).items

    expect(member).toMatchObject({
      firstName: 'Awa',
      tribes: ['Peul', 'Malinké'],
      originRegion: 'Fouta',
      tree: { id: 'public', name: 'Famille public' },
    })
    expect([member?.birthDate?.year, member?.birthDate?.day]).toEqual([1932, 12])
  })
})
