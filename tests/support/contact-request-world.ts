import { InMemoryContactRequestReader } from '@/infrastructure/persistence/in-memory/in-memory-contact-request-reader'
import { InMemoryDiscoverableMemberDirectory } from '@/infrastructure/persistence/in-memory/in-memory-discoverable-member-directory'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { InMemoryUnitOfWork } from '@/infrastructure/persistence/in-memory/in-memory-unit-of-work'
import { FixedClock, SequentialIdGenerator } from '@tests/support/fakes'
import { aStoredTree, OWNER_ID } from '@tests/support/tree-fixtures'

export const CONTACT_REQUESTS_NOW = new Date('2026-09-17T10:00:00Z')
export const REQUESTER_ID = 'usr_requester'

/** The Diallo tree, its owner Awa, and a stranger asking about one of its members. */
export function contactRequestWorld() {
  const trees = new InMemoryTreeReader()
  trees.seed(aStoredTree())
  const directory = new InMemoryDiscoverableMemberDirectory()
  const contactRequests = new InMemoryContactRequestReader()
  const unitOfWork = new InMemoryUnitOfWork()
  const deps = () => ({
    directory,
    contactRequests,
    trees,
    unitOfWork,
    ids: new SequentialIdGenerator(),
    clock: new FixedClock(CONTACT_REQUESTS_NOW),
  })
  return { trees, directory, contactRequests, unitOfWork, deps }
}

export { OWNER_ID }
