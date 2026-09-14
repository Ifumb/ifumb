import { describe, expect, it } from 'vitest'
import {
  canManage,
  Tree,
  TREE_DESCRIPTION_MAX_LENGTH,
  TREE_NAME_MAX_LENGTH,
  type TreeDetailsInput,
} from '@/core/entities/tree'
import { DomainError } from '@/core/shared/errors/domain-error'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { UserId } from '@/core/shared/value-objects/user-id'
import { aTree } from '@tests/support/tree-fixtures'

const NOW = new Date('2026-09-14T10:00:00Z')
const LATER = new Date('2026-09-15T10:00:00Z')

function started(details: Partial<TreeDetailsInput> = {}) {
  return Tree.start({
    id: TreeId.fromString('tree_new'),
    ownerId: UserId.fromString('usr_owner'),
    now: NOW,
    name: 'Famille Diallo',
    description: '',
    visibility: 'PRIVATE',
    ...details,
  })
}

describe('Tree writing', () => {
  it('starts a tree with a trimmed name, an empty description as null and its timestamps', () => {
    const tree = started({ name: '  Famille Diallo ', description: '   ' })

    expect([tree.details, tree.createdAt, tree.updatedAt, tree.isArchived]).toEqual([
      { name: 'Famille Diallo', description: null, visibility: 'PRIVATE' },
      NOW,
      NOW,
      false,
    ])
  })

  it.each(['  ', 'x'.repeat(TREE_NAME_MAX_LENGTH + 1)])('rejects the name %j', (name) => {
    expect(() => started({ name })).toThrow(DomainError)
  })

  it('rejects a description longer than the limit', () => {
    expect(() => started({ description: 'x'.repeat(TREE_DESCRIPTION_MAX_LENGTH + 1) })).toThrow(
      DomainError,
    )
  })

  it('revises only the changed fields and reports them', () => {
    const tree = aTree({ name: 'Famille Diallo', description: 'Du Fouta', visibility: 'PRIVATE' })

    const { tree: revised, changes } = tree.revise(
      { name: 'Famille Diallo', description: 'Du Fouta Djallon', visibility: 'PUBLIC' },
      LATER,
    )

    expect(changes).toEqual([
      { field: 'description', before: 'Du Fouta', after: 'Du Fouta Djallon' },
      { field: 'visibility', before: 'PRIVATE', after: 'PUBLIC' },
    ])
    expect([revised.description, revised.visibility, revised.updatedAt]).toEqual([
      'Du Fouta Djallon',
      'PUBLIC',
      LATER,
    ])
  })

  it('reports no change when the values are the same once trimmed', () => {
    const tree = aTree({ name: 'Famille Diallo', description: null })

    const { tree: revised, changes } = tree.revise(
      { name: ' Famille Diallo ', description: ' ', visibility: 'PRIVATE' },
      LATER,
    )

    expect([changes, revised]).toEqual([[], tree])
  })

  it('clears the description when it is emptied', () => {
    const { changes } = aTree({ description: 'Du Fouta' }).revise(
      { name: 'Famille Diallo', description: '', visibility: 'PRIVATE' },
      LATER,
    )

    expect(changes).toEqual([{ field: 'description', before: 'Du Fouta', after: null }])
  })

  it('keeps the revision rules of a new tree', () => {
    expect(() =>
      aTree().revise({ name: '', description: '', visibility: 'PRIVATE' }, LATER),
    ).toThrow(DomainError)
  })

  it.each([
    ['OWNER', true],
    ['EDITOR', false],
    ['VIEWER', false],
  ] as const)('tells whether %s manages the tree: %s', (role, manages) => {
    expect(canManage(role)).toBe(manages)
  })
})
