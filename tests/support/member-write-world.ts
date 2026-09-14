import { TreeId } from '@/core/shared/value-objects/tree-id'
import { InMemoryFamilyReader } from '@/infrastructure/persistence/in-memory/in-memory-family-reader'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { InMemoryUnitOfWork } from '@/infrastructure/persistence/in-memory/in-memory-unit-of-work'
import { FixedClock, SequentialIdGenerator } from '@tests/support/fakes'
import { aMember, dateOf, memberId } from '@tests/support/family-fixtures'
import { aStoredTree, aTree, EDITOR_ID } from '@tests/support/tree-fixtures'

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
  const deps = () => ({
    ...{ trees, families, unitOfWork },
    ...{ ids: new SequentialIdGenerator(), clock: new FixedClock(MEMBER_WRITES_NOW) },
  })
  return { trees, families, unitOfWork, deps }
}

function seededFamilies(): InMemoryFamilyReader {
  const families = new InMemoryFamilyReader()
  const awa = { id: memberId('mbr_awa'), tribe: 'Peul', birthDate: dateOf('1932-05') }
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
