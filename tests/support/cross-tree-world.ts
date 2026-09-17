import { TreeId } from '@/core/shared/value-objects/tree-id'
import { UserId } from '@/core/shared/value-objects/user-id'
import { InMemoryConnectionRequestReader } from '@/infrastructure/persistence/in-memory/in-memory-connection-request-reader'
import { InMemoryConnectionRequestWriter } from '@/infrastructure/persistence/in-memory/in-memory-connection-request-writer'
import { InMemoryCrossTreeLinkReader } from '@/infrastructure/persistence/in-memory/in-memory-cross-tree-link-reader'
import { InMemoryCrossTreeSuggestionReader } from '@/infrastructure/persistence/in-memory/in-memory-cross-tree-suggestion-reader'
import { InMemoryFamilyReader } from '@/infrastructure/persistence/in-memory/in-memory-family-reader'
import { InMemoryTreeMemberPool } from '@/infrastructure/persistence/in-memory/in-memory-tree-member-pool'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { InMemoryUnitOfWork } from '@/infrastructure/persistence/in-memory/in-memory-unit-of-work'
import { FixedClock, SequentialIdGenerator } from '@tests/support/fakes'
import { aStoredTree, aTree, EDITOR_ID, OWNER_ID } from '@tests/support/tree-fixtures'

export const CROSS_TREE_NOW = new Date('2026-09-17T10:00:00Z')
export const TARGET_TREE_ID = 'tree_toure'
export const TARGET_OWNER_ID = 'usr_target_owner'

/** The Diallo tree (source, owner Awa, editor Fatou Sow) and the public Touré tree (target). */
export function crossTreeWorld() {
  const trees = new InMemoryTreeReader()
  trees.seed(
    aStoredTree({ acceptedInvitations: [{ userId: EDITOR_ID, role: 'EDITOR' }] }),
    aStoredTree({
      tree: aTree({
        id: TreeId.fromString(TARGET_TREE_ID),
        name: 'Famille Touré',
        visibility: 'PUBLIC',
        ownerId: UserId.fromString(TARGET_OWNER_ID),
      }),
      ownerName: { firstName: 'Moussa', lastName: 'Touré' },
    }),
  )
  const families = new InMemoryFamilyReader()
  const pool = new InMemoryTreeMemberPool()
  const suggestions = new InMemoryCrossTreeSuggestionReader()
  const connectionRequests = new InMemoryConnectionRequestReader()
  const connectionRequestWriter = new InMemoryConnectionRequestWriter()
  const links = new InMemoryCrossTreeLinkReader()
  const unitOfWork = new InMemoryUnitOfWork()
  const deps = () => ({
    trees,
    families,
    pool,
    suggestions,
    connectionRequests,
    connectionRequestWriter,
    links,
    unitOfWork,
    ids: new SequentialIdGenerator(),
    clock: new FixedClock(CROSS_TREE_NOW),
  })
  return {
    trees,
    families,
    pool,
    suggestions,
    connectionRequests,
    connectionRequestWriter,
    links,
    unitOfWork,
    deps,
  }
}

export { OWNER_ID, EDITOR_ID }
