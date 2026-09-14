import { beforeEach, describe, expect, it } from 'vitest'
import { FindCommonAncestorsUseCase } from '@/core/use-cases/find-common-ancestors'
import { FindKinshipUseCase } from '@/core/use-cases/find-kinship'
import { InMemoryFamilyReader } from '@/infrastructure/persistence/in-memory/in-memory-family-reader'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { extendedFamily, person } from '@tests/support/family-builder'
import { aStoredTree, aTree, OWNER_ID, STRANGER_ID } from '@tests/support/tree-fixtures'
import { TreeId } from '@/core/shared/value-objects/tree-id'

describe('member pair use cases', () => {
  let findKinship: FindKinshipUseCase
  let findCommonAncestors: FindCommonAncestorsUseCase

  beforeEach(() => {
    const trees = new InMemoryTreeReader()
    const families = new InMemoryFamilyReader()
    trees.seed(aStoredTree(), aStoredTree({ tree: aTree({ id: TreeId.fromString('tree_other') }) }))
    const family = extendedFamily()
    families.seed('tree_diallo', {
      members: [...family.members(), person('stranger')],
      unions: family.unions(),
    })
    families.seed('tree_other', { members: [person('elsewhere')], unions: [] })
    findKinship = new FindKinshipUseCase({ trees, families })
    findCommonAncestors = new FindCommonAncestorsUseCase({ trees, families })
  })

  const pair = (firstId: string, secondId: string, viewerId: string | undefined = OWNER_ID) => ({
    treeId: 'tree_diallo',
    viewerId,
    firstId,
    secondId,
  })

  describe('FindKinshipUseCase', () => {
    it('returns the relation, the people on the path and the unions crossed', async () => {
      const result = await findKinship.execute(pair('me', 'cousin'))

      expect(result.ok && result.value).toEqual({
        first: { id: 'me', firstName: 'me', lastName: null, gender: 'MALE' },
        second: { id: 'cousin', firstName: 'cousin', lastName: null, gender: null },
        relation: { kind: 'blood', ups: 2, downs: 2, fullSiblings: false, branch: 'paternal' },
        path: ['me', 'dad', 'aunt', 'cousin'].map((id) => expect.objectContaining({ id })),
        unionIds: ['u_parents', 'u_grand', 'u_aunt'],
      })
    })

    it('returns no relation when the members are not linked', async () => {
      const result = await findKinship.execute(pair('me', 'stranger'))

      expect(
        result.ok && [result.value.relation, result.value.path, result.value.unionIds],
      ).toEqual([null, [], []])
    })
  })

  describe('FindCommonAncestorsUseCase', () => {
    it('returns the common ancestors with their distances', async () => {
      const result = await findCommonAncestors.execute(pair('me', 'aunt'))

      expect(result.ok && result.value.ancestors).toEqual([
        {
          person: expect.objectContaining({ id: 'grandma' }),
          distanceFromFirst: 2,
          distanceFromSecond: 1,
        },
        {
          person: expect.objectContaining({ id: 'grandpa' }),
          distanceFromFirst: 2,
          distanceFromSecond: 1,
        },
      ])
    })
  })

  describe.each([
    ['FindKinshipUseCase', () => findKinship],
    ['FindCommonAncestorsUseCase', () => findCommonAncestors],
  ])('%s refuses', (_, useCase) => {
    it.each([
      [{ ...pair('me', 'dad'), treeId: 'tree_unknown' }, 'TREE_NOT_FOUND'],
      [{ ...pair('me', 'dad'), viewerId: undefined }, 'AUTHENTICATION_REQUIRED'],
      [pair('me', 'dad', STRANGER_ID), 'ACCESS_DENIED'],
      [pair('me', 'elsewhere'), 'MEMBER_NOT_FOUND'],
      [pair('unknown', 'dad'), 'MEMBER_NOT_FOUND'],
      [pair('me', 'me'), 'SAME_MEMBER'],
    ])('%o with %s', async (input, kind) => {
      expect(await useCase().execute(input)).toEqual({ ok: false, error: { kind } })
    })
  })
})
