import { beforeEach, describe, expect, it } from 'vitest'
import { GetFamilyGraphUseCase } from '@/core/use-cases/get-family-graph'
import { InMemoryFamilyReader } from '@/infrastructure/persistence/in-memory/in-memory-family-reader'
import { InMemoryPendingChangeReader } from '@/infrastructure/persistence/in-memory/in-memory-pending-change-reader'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { aMember, aUnion, memberId } from '@tests/support/family-fixtures'
import { aStoredTree, aTree, EDITOR_ID, OWNER_ID, STRANGER_ID } from '@tests/support/tree-fixtures'

const VIEWER_ID = 'usr_viewer'

describe('GetFamilyGraphUseCase', () => {
  let families: InMemoryFamilyReader
  let pendingChanges: InMemoryPendingChangeReader

  beforeEach(() => {
    families = new InMemoryFamilyReader()
    pendingChanges = new InMemoryPendingChangeReader()
    families.seed('tree_diallo', {
      members: [
        aMember({ id: memberId('mbr_moussa'), firstName: 'Moussa', tribe: 'Peul, Malinké' }),
        aMember({ id: memberId('mbr_awa'), firstName: 'Awa' }),
        aMember({ id: memberId('mbr_fatou'), firstName: 'Fatou' }),
      ],
      unions: [
        aUnion({
          children: [
            { childId: memberId('mbr_fatou'), filiation: 'ADOPTIVE' },
            { childId: memberId('mbr_ghost'), filiation: 'BIOLOGICAL' },
          ],
        }),
      ],
    })
    pendingChanges.seed('tree_diallo', { mbr_awa: 'UPDATE', uni_1: 'DELETE' })
  })

  function buildGetFamilyGraph(tree = aTree()) {
    const trees = new InMemoryTreeReader()
    trees.seed(
      aStoredTree({
        tree,
        acceptedInvitations: [
          { userId: EDITOR_ID, role: 'EDITOR' },
          { userId: VIEWER_ID, role: 'VIEWER' },
        ],
      }),
    )
    return new GetFamilyGraphUseCase({ trees, families, pendingChanges })
  }

  async function graphFor(viewerId?: string, tree = aTree()) {
    const result = await buildGetFamilyGraph(tree).execute({ treeId: 'tree_diallo', viewerId })
    if (!result.ok) throw new Error(`Unexpected ${result.error.kind}`)
    return result.value
  }

  it('returns members in name order with their generation and cultural lists', async () => {
    const graph = await graphFor(OWNER_ID)

    expect(graph.members.map(({ id, generation, tribes }) => ({ id, generation, tribes }))).toEqual(
      [
        { id: 'mbr_awa', generation: 0, tribes: [] },
        { id: 'mbr_fatou', generation: 1, tribes: [] },
        { id: 'mbr_moussa', generation: 0, tribes: ['Peul', 'Malinké'] },
      ],
    )
  })

  it('returns unions linked to existing members only', async () => {
    const graph = await graphFor(OWNER_ID)

    expect(graph.unions).toEqual([
      {
        id: 'uni_1',
        type: 'MARRIAGE',
        parentIds: ['mbr_moussa', 'mbr_awa'],
        children: [{ childId: 'mbr_fatou', filiation: 'ADOPTIVE' }],
        pendingAction: 'DELETE',
      },
    ])
  })

  it('names the tree', async () => {
    expect((await graphFor(OWNER_ID)).tree).toEqual({ id: 'tree_diallo', name: 'Famille Diallo' })
  })

  it.each([
    ['the owner', OWNER_ID],
    ['an editor', EDITOR_ID],
  ])('shows pending markers to %s', async (_, viewerId) => {
    const graph = await graphFor(viewerId)

    expect(graph.members.find((m) => m.id === 'mbr_awa')?.pendingAction).toBe('UPDATE')
  })

  it('never reads pending changes for a viewer', async () => {
    const graph = await graphFor(VIEWER_ID)

    expect([pendingChanges.readCount, graph.unions[0]?.pendingAction]).toEqual([0, null])
  })

  it('never reads pending changes for an anonymous visitor of a public tree', async () => {
    const graph = await graphFor(undefined, aTree({ visibility: 'PUBLIC' }))

    expect([pendingChanges.readCount, graph.members.map((m) => m.pendingAction)]).toEqual([
      0,
      [null, null, null],
    ])
  })

  it.each([
    [{ treeId: 'tree_unknown', viewerId: OWNER_ID }, 'TREE_NOT_FOUND'],
    [{ treeId: 'tree_diallo' }, 'AUTHENTICATION_REQUIRED'],
    [{ treeId: 'tree_diallo', viewerId: STRANGER_ID }, 'ACCESS_DENIED'],
  ])('refuses %o with %s', async (input, kind) => {
    expect(await buildGetFamilyGraph().execute(input)).toEqual({ ok: false, error: { kind } })
  })
})
