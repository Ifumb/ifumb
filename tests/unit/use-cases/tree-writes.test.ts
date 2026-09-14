import { beforeEach, describe, expect, it } from 'vitest'
import { CreateTreeUseCase } from '@/core/use-cases/create-tree'
import { GetTreeSettingsUseCase } from '@/core/use-cases/get-tree-settings'
import { UpdateTreeUseCase } from '@/core/use-cases/update-tree'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { InMemoryUnitOfWork } from '@/infrastructure/persistence/in-memory/in-memory-unit-of-work'
import { FixedClock, SequentialIdGenerator } from '@tests/support/fakes'
import { aStoredTree, aTree, EDITOR_ID, OWNER_ID, STRANGER_ID } from '@tests/support/tree-fixtures'

const NOW = new Date('2026-09-14T10:00:00Z')
const DETAILS = { name: 'Famille Diallo', description: '', visibility: 'PRIVATE' } as const

describe('CreateTreeUseCase', () => {
  let unitOfWork: InMemoryUnitOfWork
  let createTree: CreateTreeUseCase

  beforeEach(() => {
    unitOfWork = new InMemoryUnitOfWork()
    createTree = new CreateTreeUseCase({
      unitOfWork,
      ids: new SequentialIdGenerator(),
      clock: new FixedClock(NOW),
    })
  })

  it('creates the tree and its TREE_CREATED entry in one transaction', async () => {
    const { treeId } = await createTree.execute({ ownerId: OWNER_ID, ...DETAILS, name: ' Diallo ' })

    expect(unitOfWork.transactions).toBe(1)
    expect(unitOfWork.insertedTrees.map((tree) => [tree.id.value, tree.name])).toEqual([
      [treeId, 'Diallo'],
    ])
    expect(unitOfWork.auditRecords).toEqual([
      {
        id: 'usr_2',
        treeId,
        authorId: OWNER_ID,
        action: 'TREE_CREATED',
        targetType: 'TREE',
        targetId: treeId,
        diff: { before: null, after: { name: 'Diallo', description: null, visibility: 'PRIVATE' } },
        createdAt: NOW,
      },
    ])
  })

  it('gives the tree a generated id and makes the author its owner', async () => {
    const { treeId } = await createTree.execute({ ownerId: OWNER_ID, ...DETAILS })

    expect([treeId, unitOfWork.insertedTrees[0]?.ownerId.value]).toEqual(['usr_1', OWNER_ID])
  })

  it('writes nothing when the transaction fails', async () => {
    unitOfWork.failNextAuditRecord()

    await expect(createTree.execute({ ownerId: OWNER_ID, ...DETAILS })).rejects.toThrow()

    expect([unitOfWork.insertedTrees, unitOfWork.auditRecords]).toEqual([[], []])
  })
})

describe('tree management use cases', () => {
  let trees: InMemoryTreeReader
  let unitOfWork: InMemoryUnitOfWork

  beforeEach(() => {
    trees = new InMemoryTreeReader()
    trees.seed(
      aStoredTree({
        tree: aTree({ description: 'Du Fouta', visibility: 'PRIVATE' }),
        acceptedInvitations: [{ userId: EDITOR_ID, role: 'EDITOR' }],
      }),
    )
    unitOfWork = new InMemoryUnitOfWork()
  })

  const updateTree = () =>
    new UpdateTreeUseCase({
      trees,
      unitOfWork,
      ids: new SequentialIdGenerator(),
      clock: new FixedClock(NOW),
    })

  describe('UpdateTreeUseCase', () => {
    it('updates the tree and records only the changed fields', async () => {
      const result = await updateTree().execute({
        treeId: 'tree_diallo',
        viewerId: OWNER_ID,
        ...DETAILS,
        visibility: 'PUBLIC',
      })

      expect(result).toEqual({ ok: true, value: { changed: true } })
      expect(unitOfWork.updatedTrees.map((tree) => [tree.description, tree.visibility])).toEqual([
        [null, 'PUBLIC'],
      ])
      expect(unitOfWork.auditRecords.map(({ action, diff }) => ({ action, diff }))).toEqual([
        {
          action: 'TREE_UPDATED',
          diff: {
            before: { description: 'Du Fouta', visibility: 'PRIVATE' },
            after: { description: null, visibility: 'PUBLIC' },
          },
        },
      ])
    })

    it('writes nothing, not even an entry, when nothing changed', async () => {
      const result = await updateTree().execute({
        treeId: 'tree_diallo',
        viewerId: OWNER_ID,
        ...DETAILS,
        description: 'Du Fouta',
      })

      expect(result).toEqual({ ok: true, value: { changed: false } })
      expect(unitOfWork.transactions).toBe(0)
    })

    it.each([
      [{ treeId: 'tree_unknown', viewerId: OWNER_ID }, 'TREE_NOT_FOUND'],
      [{ treeId: 'tree_diallo', viewerId: STRANGER_ID }, 'ACCESS_DENIED'],
      [{ treeId: 'tree_diallo', viewerId: EDITOR_ID }, 'TREE_MANAGEMENT_FORBIDDEN'],
    ])('refuses %o with %s', async (input, kind) => {
      expect(await updateTree().execute({ ...input, ...DETAILS })).toEqual({
        ok: false,
        error: { kind },
      })
      expect(unitOfWork.transactions).toBe(0)
    })
  })

  describe('GetTreeSettingsUseCase', () => {
    it('gives the owner the current values', async () => {
      const result = await new GetTreeSettingsUseCase({ trees }).execute({
        treeId: 'tree_diallo',
        viewerId: OWNER_ID,
      })

      expect(result).toEqual({
        ok: true,
        value: {
          id: 'tree_diallo',
          name: 'Famille Diallo',
          description: 'Du Fouta',
          visibility: 'PRIVATE',
        },
      })
    })

    it.each([
      [{ treeId: 'tree_diallo', viewerId: EDITOR_ID }, 'TREE_MANAGEMENT_FORBIDDEN'],
      [{ treeId: 'tree_diallo' }, 'AUTHENTICATION_REQUIRED'],
    ])('refuses %o with %s', async (input, kind) => {
      expect(await new GetTreeSettingsUseCase({ trees }).execute(input)).toEqual({
        ok: false,
        error: { kind },
      })
    })
  })
})
