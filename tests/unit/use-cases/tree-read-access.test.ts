import { beforeEach, describe, expect, it } from 'vitest'
import { readableTree } from '@/core/use-cases/tree-read-access'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { aStoredTree, OWNER_ID, STRANGER_ID } from '@tests/support/tree-fixtures'

describe('readableTree', () => {
  let trees: InMemoryTreeReader

  beforeEach(() => {
    trees = new InMemoryTreeReader()
    trees.seed(aStoredTree())
  })

  it('grants access with the reader role', async () => {
    const result = await readableTree(trees, { treeId: 'tree_diallo', viewerId: OWNER_ID })

    expect(result.ok && result.value.role).toBe('OWNER')
  })

  it('fails with TREE_NOT_FOUND for an unknown tree', async () => {
    expect(await readableTree(trees, { treeId: 'tree_unknown' })).toEqual({
      ok: false,
      error: { kind: 'TREE_NOT_FOUND' },
    })
  })

  it('fails with AUTHENTICATION_REQUIRED for an anonymous visitor of a private tree', async () => {
    expect(await readableTree(trees, { treeId: 'tree_diallo' })).toEqual({
      ok: false,
      error: { kind: 'AUTHENTICATION_REQUIRED' },
    })
  })

  it('fails with ACCESS_DENIED for a signed-in stranger', async () => {
    expect(await readableTree(trees, { treeId: 'tree_diallo', viewerId: STRANGER_ID })).toEqual({
      ok: false,
      error: { kind: 'ACCESS_DENIED' },
    })
  })
})
