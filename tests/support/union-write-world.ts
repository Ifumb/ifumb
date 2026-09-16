import { TreeId } from '@/core/shared/value-objects/tree-id'
import { UserId } from '@/core/shared/value-objects/user-id'
import { InMemoryFamilyReader } from '@/infrastructure/persistence/in-memory/in-memory-family-reader'
import { InMemoryPendingChangeReader } from '@/infrastructure/persistence/in-memory/in-memory-pending-change-reader'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { InMemoryUnitOfWork } from '@/infrastructure/persistence/in-memory/in-memory-unit-of-work'
import { InMemoryUserRepository } from '@/infrastructure/persistence/in-memory/in-memory-user-repository'
import { unionOf } from '@tests/support/family-builder'
import { FixedClock, RecordingPendingChangeAlertMailer, SequentialIdGenerator } from '@tests/support/fakes'
import { aMember, memberId } from '@tests/support/family-fixtures'
import { aStoredTree, aTree, EDITOR_ID, OWNER_ID } from '@tests/support/tree-fixtures'
import { aUser, emailOf } from '@tests/support/user-fixtures'

export const UNION_WRITES_NOW = new Date('2026-09-15T10:00:00Z')

const named = (id: string, firstName: string, lastName: string | null = 'Diallo') =>
  aMember({ id: memberId(id), firstName, lastName })

/**
 * The Diallo tree, with an editor: Moussa and Awa married twice, Fatou their daughter, Ali her son,
 * and Binta, unrelated. Another tree holds a member and a union of its own.
 */
export function unionWriteWorld() {
  const trees = new InMemoryTreeReader()
  trees.seed(
    aStoredTree({ acceptedInvitations: [{ userId: EDITOR_ID, role: 'EDITOR' }] }),
    aStoredTree({ tree: aTree({ id: TreeId.fromString('tree_other') }) }),
  )
  const families = seededFamilies()
  const unitOfWork = new InMemoryUnitOfWork()
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
    ...{ trees, families, unitOfWork, users, pendingChanges, mailer },
    ...{ ids: new SequentialIdGenerator(), clock: new FixedClock(UNION_WRITES_NOW) },
  })
  return { trees, families, unitOfWork, users, pendingChanges, mailer, deps }
}

function seededFamilies(): InMemoryFamilyReader {
  const families = new InMemoryFamilyReader()
  families.seed('tree_diallo', {
    members: [
      named('mbr_moussa', 'Moussa'),
      named('mbr_awa', 'Awa'),
      named('mbr_fatou', 'Fatou'),
      named('mbr_ali', 'Ali', 'Sow'),
      named('mbr_binta', 'Binta', 'Barry'),
    ],
    unions: [
      unionOf('u_couple', ['mbr_moussa', 'mbr_awa'], ['mbr_fatou']),
      unionOf('u_again', ['mbr_awa', 'mbr_moussa'], []),
      unionOf('u_fatou', ['mbr_fatou'], ['mbr_ali'], 'BIOLOGICAL'),
    ],
  })
  families.seed('tree_other', {
    members: [named('mbr_elsewhere', 'Kadi')],
    unions: [unionOf('u_elsewhere', ['mbr_elsewhere'], [])],
  })
  return families
}
