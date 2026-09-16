import { TreeId } from '@/core/shared/value-objects/tree-id'
import { UserId } from '@/core/shared/value-objects/user-id'
import { InMemoryFamilyReader } from '@/infrastructure/persistence/in-memory/in-memory-family-reader'
import { InMemoryPendingChangeReader } from '@/infrastructure/persistence/in-memory/in-memory-pending-change-reader'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { InMemoryUnitOfWork } from '@/infrastructure/persistence/in-memory/in-memory-unit-of-work'
import { InMemoryUserRepository } from '@/infrastructure/persistence/in-memory/in-memory-user-repository'
import { InMemoryPhotoStorage } from '@/infrastructure/storage/in-memory-photo-storage'
import { unionOf } from '@tests/support/family-builder'
import { FixedClock, SequentialIdGenerator } from '@tests/support/fakes'
import { aMember, memberId } from '@tests/support/family-fixtures'
import { aStoredTree, aTree, EDITOR_ID, OWNER_ID } from '@tests/support/tree-fixtures'
import { aUser } from '@tests/support/user-fixtures'

export const REVIEW_NOW = new Date('2026-09-17T09:00:00Z')

/**
 * The Diallo tree, ready to review proposals against: Moussa, Awa (married, Fatou their
 * daughter) and Binta, unrelated. Another tree holds a member of its own.
 */
export function pendingChangeReviewWorld() {
  const trees = new InMemoryTreeReader()
  trees.seed(
    aStoredTree({ acceptedInvitations: [{ userId: EDITOR_ID, role: 'EDITOR' }] }),
    aStoredTree({ tree: aTree({ id: TreeId.fromString('tree_other') }) }),
  )
  const families = new InMemoryFamilyReader()
  families.seed('tree_diallo', {
    members: [
      aMember({ id: memberId('mbr_moussa'), firstName: 'Moussa', lastName: 'Diallo' }),
      aMember({ id: memberId('mbr_awa'), firstName: 'Awa', lastName: 'Diallo', tribe: 'Peul' }),
      aMember({ id: memberId('mbr_binta'), firstName: 'Binta', lastName: 'Barry' }),
      aMember({ id: memberId('mbr_fatou'), firstName: 'Fatou', lastName: 'Diallo' }),
    ],
    unions: [unionOf('u_couple', ['mbr_moussa', 'mbr_awa'], ['mbr_fatou'])],
  })
  families.seed('tree_other', { members: [aMember({ id: memberId('mbr_elsewhere') })], unions: [] })

  const unitOfWork = new InMemoryUnitOfWork()
  const pendingChanges = new InMemoryPendingChangeReader()
  const users = new InMemoryUserRepository()
  users.seed(
    aUser({ id: UserId.fromString(OWNER_ID), firstName: 'Awa', lastName: 'Diallo' }),
    aUser({ id: UserId.fromString(EDITOR_ID), firstName: 'Fatou', lastName: 'Sow' }),
  )
  const storage = new InMemoryPhotoStorage()
  const deps = () => ({
    trees,
    families,
    pendingChanges,
    unitOfWork,
    users,
    storage,
    ids: new SequentialIdGenerator(),
    clock: new FixedClock(REVIEW_NOW),
  })
  return { trees, families, unitOfWork, pendingChanges, users, storage, deps }
}
