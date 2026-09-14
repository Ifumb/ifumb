import { beforeEach, describe, expect, it } from 'vitest'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { GetMemberProfileUseCase } from '@/core/use-cases/get-member-profile'
import { InMemoryFamilyReader } from '@/infrastructure/persistence/in-memory/in-memory-family-reader'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { aMember, aUnion, memberId } from '@tests/support/family-fixtures'
import { aStoredTree, aTree, OWNER_ID, STRANGER_ID } from '@tests/support/tree-fixtures'

describe('GetMemberProfileUseCase', () => {
  let getMemberProfile: GetMemberProfileUseCase

  beforeEach(() => {
    const trees = new InMemoryTreeReader()
    const families = new InMemoryFamilyReader()
    trees.seed(aStoredTree(), aStoredTree({ tree: aTree({ id: TreeId.fromString('tree_other') }) }))
    families.seed('tree_diallo', {
      members: [
        aMember({ id: memberId('mbr_moussa'), firstName: 'Moussa' }),
        aMember({ id: memberId('mbr_awa'), firstName: 'Awa' }),
        aMember({ id: memberId('mbr_fatou'), firstName: 'Fatou' }),
      ],
      unions: [aUnion({ children: [{ childId: memberId('mbr_fatou'), filiation: 'ADOPTIVE' }] })],
    })
    families.seed('tree_other', {
      members: [aMember({ id: memberId('mbr_elsewhere') })],
      unions: [],
    })
    getMemberProfile = new GetMemberProfileUseCase({ trees, families })
  })

  it('returns the profile with its parent unions and partner unions', async () => {
    const result = await getMemberProfile.execute({
      treeId: 'tree_diallo',
      memberId: 'mbr_fatou',
      viewerId: OWNER_ID,
    })

    expect(result.ok && result.value.parentUnions).toEqual([
      {
        id: 'uni_1',
        type: 'MARRIAGE',
        startDate: null,
        endDate: null,
        filiation: 'ADOPTIVE',
        parents: [
          { id: 'mbr_moussa', firstName: 'Moussa', lastName: 'Diallo' },
          { id: 'mbr_awa', firstName: 'Awa', lastName: 'Diallo' },
        ],
      },
    ])
  })

  it('lists the partner and children of a parent', async () => {
    const result = await getMemberProfile.execute({
      treeId: 'tree_diallo',
      memberId: 'mbr_awa',
      viewerId: OWNER_ID,
    })

    const [union] = result.ok ? result.value.partnerUnions : []
    expect([
      union?.partner?.firstName,
      union?.children.map((c) => [c.person.id, c.filiation]),
    ]).toEqual(['Moussa', [['mbr_fatou', 'ADOPTIVE']]])
  })

  it('fails with MEMBER_NOT_FOUND for an unknown member', async () => {
    const result = await getMemberProfile.execute({
      treeId: 'tree_diallo',
      memberId: 'mbr_unknown',
      viewerId: OWNER_ID,
    })

    expect(result).toEqual({ ok: false, error: { kind: 'MEMBER_NOT_FOUND' } })
  })

  it('fails with MEMBER_NOT_FOUND for a member of another tree reached through this URL', async () => {
    const result = await getMemberProfile.execute({
      treeId: 'tree_diallo',
      memberId: 'mbr_elsewhere',
      viewerId: OWNER_ID,
    })

    expect(result).toEqual({ ok: false, error: { kind: 'MEMBER_NOT_FOUND' } })
  })

  it.each([
    [{ treeId: 'tree_unknown', viewerId: OWNER_ID }, 'TREE_NOT_FOUND'],
    [{ treeId: 'tree_diallo' }, 'AUTHENTICATION_REQUIRED'],
    [{ treeId: 'tree_diallo', viewerId: STRANGER_ID }, 'ACCESS_DENIED'],
  ])('refuses %o with %s', async (input, kind) => {
    const result = await getMemberProfile.execute({ ...input, memberId: 'mbr_awa' })

    expect(result).toEqual({ ok: false, error: { kind } })
  })
})
