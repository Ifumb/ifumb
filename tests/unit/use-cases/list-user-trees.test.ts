import { beforeEach, describe, expect, it } from 'vitest'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { ListUserTreesUseCase } from '@/core/use-cases/list-user-trees'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { aStoredTree, aTree, EDITOR_ID, OWNER_ID } from '@tests/support/tree-fixtures'

describe('ListUserTreesUseCase', () => {
  let trees: InMemoryTreeReader
  let listUserTrees: ListUserTreesUseCase

  beforeEach(() => {
    trees = new InMemoryTreeReader()
    listUserTrees = new ListUserTreesUseCase({ trees })
  })

  it('lists owned trees with the OWNER role, the owner name and the member count', async () => {
    trees.seed(aStoredTree())

    const [summary] = await listUserTrees.execute({ userId: OWNER_ID })

    expect(summary).toMatchObject({
      id: 'tree_diallo',
      name: 'Famille Diallo',
      role: 'OWNER',
      ownerName: { firstName: 'Awa', lastName: 'Diallo' },
      memberCount: 3,
    })
  })

  it('includes trees shared through an accepted invitation, with its role', async () => {
    trees.seed(aStoredTree({ acceptedInvitations: [{ userId: EDITOR_ID, role: 'EDITOR' }] }))

    const summaries = await listUserTrees.execute({ userId: EDITOR_ID })

    expect(summaries.map(({ id, role }) => ({ id, role }))).toEqual([
      { id: 'tree_diallo', role: 'EDITOR' },
    ])
  })

  it('leaves archived trees out', async () => {
    trees.seed(aStoredTree({ tree: aTree({ archivedAt: new Date('2026-03-01T00:00:00Z') }) }))

    expect(await listUserTrees.execute({ userId: OWNER_ID })).toEqual([])
  })

  it('sorts trees by most recent update first', async () => {
    trees.seed(
      aStoredTree({
        tree: aTree({ id: TreeId.fromString('tree_old'), updatedAt: new Date('2026-01-10') }),
      }),
      aStoredTree({
        tree: aTree({ id: TreeId.fromString('tree_new'), updatedAt: new Date('2026-04-10') }),
      }),
    )

    const summaries = await listUserTrees.execute({ userId: OWNER_ID })

    expect(summaries.map(({ id }) => id)).toEqual(['tree_new', 'tree_old'])
  })

  it('returns an empty list to a user without any tree', async () => {
    expect(await listUserTrees.execute({ userId: OWNER_ID })).toEqual([])
  })
})
