import { TreeId } from '@/core/shared/value-objects/tree-id'
import { UserId } from '@/core/shared/value-objects/user-id'
import { InMemoryFamilyReader } from '@/infrastructure/persistence/in-memory/in-memory-family-reader'
import { InMemoryPendingChangeReader } from '@/infrastructure/persistence/in-memory/in-memory-pending-change-reader'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { InMemoryUnitOfWork } from '@/infrastructure/persistence/in-memory/in-memory-unit-of-work'
import { InMemoryUserRepository } from '@/infrastructure/persistence/in-memory/in-memory-user-repository'
import { InMemoryPhotoStorage } from '@/infrastructure/storage/in-memory-photo-storage'
import { FixedClock, RecordingPendingChangeAlertMailer, SequentialIdGenerator } from '@tests/support/fakes'
import { FakePhotoProcessor } from '@tests/support/photo-doubles'
import { aMember, dateOf, memberId } from '@tests/support/family-fixtures'
import { aStoredTree, aTree, EDITOR_ID, OWNER_ID } from '@tests/support/tree-fixtures'
import { aUser, emailOf } from '@tests/support/user-fixtures'

/** Awa's current photo, stored before the tests run. */
export const AWA_PHOTO_URL = `${InMemoryPhotoStorage.PUBLIC_BASE}tree_diallo/mbr_awa.jpg`

export const MEMBER_WRITES_NOW = new Date('2026-09-14T10:00:00Z')
export const CLAIMER_ID = 'usr_claimer'

/**
 * The Diallo tree with an editor and a viewer who claimed Awa, beside another tree: what every
 * member write use case is tested against.
 */
export function memberWriteWorld() {
  const trees = new InMemoryTreeReader()
  trees.seed(
    aStoredTree({
      acceptedInvitations: [
        { userId: EDITOR_ID, role: 'EDITOR' },
        { userId: CLAIMER_ID, role: 'VIEWER' },
      ],
    }),
    aStoredTree({ tree: aTree({ id: TreeId.fromString('tree_other') }) }),
  )
  const families = seededFamilies()
  const unitOfWork = new InMemoryUnitOfWork()
  const storage = new InMemoryPhotoStorage()
  const photos = new FakePhotoProcessor()
  const pendingChanges = new InMemoryPendingChangeReader()
  const mailer = new RecordingPendingChangeAlertMailer()
  const users = new InMemoryUserRepository()
  users.seed(
    aUser({ id: UserId.fromString(OWNER_ID), firstName: 'Awa', lastName: 'Diallo' }),
    aUser({
      id: UserId.fromString(EDITOR_ID),
      email: emailOf('editor@example.com'),
      firstName: 'Fatou',
      lastName: 'Sow',
    }),
  )
  const deps = () => ({
    ...{ trees, families, unitOfWork, storage, photos, users, pendingChanges, mailer },
    ...{ ids: new SequentialIdGenerator(), clock: new FixedClock(MEMBER_WRITES_NOW) },
  })
  return { trees, families, unitOfWork, storage, photos, users, pendingChanges, mailer, deps }
}

function seededFamilies(): InMemoryFamilyReader {
  const families = new InMemoryFamilyReader()
  const awa = {
    ...{ id: memberId('mbr_awa'), tribe: 'Peul', birthDate: dateOf('1932-05') },
    photoUrl: AWA_PHOTO_URL,
  }
  families.seed('tree_diallo', {
    members: [
      aMember({ ...awa, claimedById: CLAIMER_ID }),
      aMember({ id: memberId('mbr_moussa'), firstName: 'Moussa' }),
    ],
    unions: [],
  })
  families.seed('tree_other', { members: [aMember({ id: memberId('mbr_elsewhere') })], unions: [] })
  return families
}
