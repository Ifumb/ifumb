import { beforeEach, describe, expect, it } from 'vitest'
import { GetTreeOverviewUseCase } from '@/core/use-cases/get-tree-overview'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { aStoredTree, aTree, OWNER_ID, STRANGER_ID } from '@tests/support/tree-fixtures'

describe('GetTreeOverviewUseCase', () => {
  let trees: InMemoryTreeReader
  let getTreeOverview: GetTreeOverviewUseCase

  beforeEach(() => {
    trees = new InMemoryTreeReader()
    getTreeOverview = new GetTreeOverviewUseCase({ trees })
  })

  it('gives the owner the overview with the OWNER role', async () => {
    trees.seed(aStoredTree())

    const result = await getTreeOverview.execute({ treeId: 'tree_diallo', viewerId: OWNER_ID })

    expect(result.ok && result.value.role).toBe('OWNER')
  })

  it('gives an anonymous visitor of a public tree the VIEWER role', async () => {
    trees.seed(aStoredTree({ tree: aTree({ visibility: 'PUBLIC' }) }))

    const result = await getTreeOverview.execute({ treeId: 'tree_diallo' })

    expect(result.ok && result.value.role).toBe('VIEWER')
  })

  it('fails with TREE_NOT_FOUND for an unknown tree', async () => {
    const result = await getTreeOverview.execute({ treeId: 'tree_unknown', viewerId: OWNER_ID })

    expect(result).toEqual({ ok: false, error: { kind: 'TREE_NOT_FOUND' } })
  })

  it('fails with AUTHENTICATION_REQUIRED for an anonymous visitor of a private tree', async () => {
    trees.seed(aStoredTree())

    const result = await getTreeOverview.execute({ treeId: 'tree_diallo' })

    expect(result).toEqual({ ok: false, error: { kind: 'AUTHENTICATION_REQUIRED' } })
  })

  it('fails with ACCESS_DENIED for a signed-in stranger on a private tree', async () => {
    trees.seed(aStoredTree())

    const result = await getTreeOverview.execute({ treeId: 'tree_diallo', viewerId: STRANGER_ID })

    expect(result).toEqual({ ok: false, error: { kind: 'ACCESS_DENIED' } })
  })

  it('still shows an archived tree to its owner, as the legacy app did', async () => {
    trees.seed(aStoredTree({ tree: aTree({ archivedAt: new Date('2026-03-01T00:00:00Z') }) }))

    const result = await getTreeOverview.execute({ treeId: 'tree_diallo', viewerId: OWNER_ID })

    expect(result.ok).toBe(true)
  })
})
