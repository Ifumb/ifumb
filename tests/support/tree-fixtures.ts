import { Tree, type TreeProps } from '@/core/entities/tree'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { UserId } from '@/core/shared/value-objects/user-id'
import type { StoredTree } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'

export const OWNER_ID = 'usr_owner'
export const EDITOR_ID = 'usr_editor'
export const STRANGER_ID = 'usr_stranger'

export function aTree(overrides: Partial<TreeProps> = {}): Tree {
  return Tree.create({
    id: TreeId.fromString('tree_diallo'),
    name: 'Famille Diallo',
    description: null,
    visibility: 'PRIVATE',
    ownerId: UserId.fromString(OWNER_ID),
    archivedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-02-01T00:00:00Z'),
    ...overrides,
  })
}

export function aStoredTree(overrides: Partial<StoredTree> = {}): StoredTree {
  return {
    tree: aTree(),
    ownerName: { firstName: 'Awa', lastName: 'Diallo' },
    memberCount: 3,
    acceptedInvitations: [],
    ...overrides,
  }
}
