import { beforeEach, describe, expect, it } from 'vitest'
import { ListTreeMembersUseCase } from '@/core/use-cases/list-tree-members'
import { InMemoryFamilyReader } from '@/infrastructure/persistence/in-memory/in-memory-family-reader'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { aMember, memberId } from '@tests/support/family-fixtures'
import { aStoredTree, OWNER_ID, STRANGER_ID } from '@tests/support/tree-fixtures'

describe('ListTreeMembersUseCase', () => {
  let listTreeMembers: ListTreeMembersUseCase

  beforeEach(() => {
    const trees = new InMemoryTreeReader()
    const families = new InMemoryFamilyReader()
    trees.seed(aStoredTree())
    families.seed('tree_diallo', {
      members: [
        aMember({ id: memberId('mbr_moussa'), firstName: 'Moussa' }),
        aMember({ id: memberId('mbr_awa'), firstName: 'Awa', tribe: 'Peul' }),
      ],
      unions: [],
    })
    listTreeMembers = new ListTreeMembersUseCase({ trees, families })
  })

  it('lists the members sorted by first name for an authorized reader', async () => {
    const result = await listTreeMembers.execute({ treeId: 'tree_diallo', viewerId: OWNER_ID })

    expect(result.ok && result.value.map((member) => member.firstName)).toEqual(['Awa', 'Moussa'])
  })

  it('narrows the list to the search', async () => {
    const result = await listTreeMembers.execute({
      treeId: 'tree_diallo',
      viewerId: OWNER_ID,
      query: 'peul',
    })

    expect(result.ok && result.value.map((member) => member.id)).toEqual(['mbr_awa'])
  })

  it.each([
    [{ treeId: 'tree_unknown', viewerId: OWNER_ID }, 'TREE_NOT_FOUND'],
    [{ treeId: 'tree_diallo' }, 'AUTHENTICATION_REQUIRED'],
    [{ treeId: 'tree_diallo', viewerId: STRANGER_ID }, 'ACCESS_DENIED'],
  ])('refuses %o with %s', async (input, kind) => {
    expect(await listTreeMembers.execute(input)).toEqual({ ok: false, error: { kind } })
  })
})
