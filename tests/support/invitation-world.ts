import { UserId } from '@/core/shared/value-objects/user-id'
import { InMemoryInvitationReader } from '@/infrastructure/persistence/in-memory/in-memory-invitation-reader'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { InMemoryUnitOfWork } from '@/infrastructure/persistence/in-memory/in-memory-unit-of-work'
import { InMemoryUserRepository } from '@/infrastructure/persistence/in-memory/in-memory-user-repository'
import {
  FixedClock,
  RecordingInvitationMailer,
  SequentialIdGenerator,
  SequentialTokenGenerator,
} from '@tests/support/fakes'
import { aStoredTree, OWNER_ID } from '@tests/support/tree-fixtures'
import { aUser, emailOf } from '@tests/support/user-fixtures'

export const INVITATIONS_NOW = new Date('2026-09-17T10:00:00Z')
export const EDITOR_ID = 'usr_editor'
export const EDITOR_EMAIL = 'fatou@example.com'

/** The Diallo tree, its owner Awa, and Fatou — invited on some tests, a stranger on others. */
export function invitationWorld() {
  const trees = new InMemoryTreeReader()
  trees.seed(aStoredTree({ acceptedInvitations: [{ userId: EDITOR_ID, role: 'EDITOR' }] }))
  const invitations = new InMemoryInvitationReader()
  const unitOfWork = new InMemoryUnitOfWork()
  const users = new InMemoryUserRepository()
  users.seed(
    aUser({ id: UserId.fromString(OWNER_ID), firstName: 'Awa', lastName: 'Diallo' }),
    aUser({
      id: UserId.fromString(EDITOR_ID),
      email: emailOf(EDITOR_EMAIL),
      firstName: 'Fatou',
      lastName: 'Sow',
    }),
  )
  const mailer = new RecordingInvitationMailer()
  const deps = () => ({
    trees,
    invitations,
    users,
    unitOfWork,
    mailer,
    ids: new SequentialIdGenerator(),
    tokens: new SequentialTokenGenerator(),
    clock: new FixedClock(INVITATIONS_NOW),
  })
  return { trees, invitations, users, unitOfWork, mailer, deps }
}
