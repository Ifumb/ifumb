import { describe, expect, it } from 'vitest'
import { canContribute, type TreeVisibility } from '@/core/entities/tree'
import { DomainError } from '@/core/shared/errors/domain-error'
import { UserId } from '@/core/shared/value-objects/user-id'
import { aTree, EDITOR_ID, OWNER_ID, STRANGER_ID } from '@tests/support/tree-fixtures'

const owner = { userId: UserId.fromString(OWNER_ID) }
const stranger = { userId: UserId.fromString(STRANGER_ID) }
const anonymous = {}
const PRIVATE_VISIBILITIES: TreeVisibility[] = ['PRIVATE', 'SHARED']

describe('Tree entity', () => {
  it('rejects a blank name', () => {
    expect(() => aTree({ name: '   ' })).toThrow(DomainError)
  })

  it('stores a trimmed name and cannot be mutated', () => {
    const tree = aTree({ name: '  Famille Diallo ' })

    expect([tree.name, Object.isFrozen(tree)]).toEqual(['Famille Diallo', true])
  })

  it.each<TreeVisibility>(['PRIVATE', 'SHARED', 'PUBLIC'])(
    'grants OWNER to its owner when %s',
    (visibility) => {
      expect(aTree({ visibility }).accessFor(owner)).toEqual({ kind: 'granted', role: 'OWNER' })
    },
  )

  it('grants the role of an accepted invitation', () => {
    const invited = { userId: UserId.fromString(EDITOR_ID), invitationRole: 'EDITOR' as const }

    expect(aTree().accessFor(invited)).toEqual({ kind: 'granted', role: 'EDITOR' })
  })

  it('grants VIEWER to an anonymous visitor of a public tree', () => {
    expect(aTree({ visibility: 'PUBLIC' }).accessFor(anonymous)).toEqual({
      kind: 'granted',
      role: 'VIEWER',
    })
  })

  it('grants VIEWER to a signed-in stranger on a public tree', () => {
    expect(aTree({ visibility: 'PUBLIC' }).accessFor(stranger)).toEqual({
      kind: 'granted',
      role: 'VIEWER',
    })
  })

  it.each(PRIVATE_VISIBILITIES)(
    'requires authentication from an anonymous visitor when %s',
    (visibility) => {
      expect(aTree({ visibility }).accessFor(anonymous)).toEqual({
        kind: 'authentication-required',
      })
    },
  )

  it.each(PRIVATE_VISIBILITIES)('denies a signed-in stranger when %s', (visibility) => {
    expect(aTree({ visibility }).accessFor(stranger)).toEqual({ kind: 'denied' })
  })

  it('is archived only once it has an archiving date', () => {
    const archived = aTree({ archivedAt: new Date('2026-03-01T00:00:00Z') })

    expect([aTree().isArchived, archived.isArchived]).toEqual([false, true])
  })

  it.each([
    ['OWNER', true],
    ['EDITOR', true],
    ['VIEWER', false],
  ] as const)('tells whether %s contributes to the tree: %s', (role, contributes) => {
    expect(canContribute(role)).toBe(contributes)
  })
})
