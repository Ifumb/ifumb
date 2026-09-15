import { describe, expect, it } from 'vitest'
import type { TreeSummary } from '@/core/use-cases/tree-summary'
import { memberCountLabel } from '@/presentation/labels/tree-labels'
import { toTreeViewModel } from '@/presentation/mappers/tree-view-models'

const summary: TreeSummary = {
  id: 'tree_diallo',
  name: 'Famille Diallo',
  description: null,
  visibility: 'SHARED',
  role: 'EDITOR',
  ownerName: { firstName: 'Awa', lastName: 'Diallo' },
  memberCount: 3,
  updatedAt: new Date('2026-02-01T00:00:00Z'),
}

describe('tree view models', () => {
  it.each([
    [0, '0 membre'],
    [1, '1 membre'],
    [3, '3 membres'],
  ])('labels %i member(s) as "%s"', (count, label) => {
    expect(memberCountLabel(count)).toBe(label)
  })

  it('turns a summary into French labels and a link to the tree', () => {
    expect(toTreeViewModel(summary)).toEqual({
      id: 'tree_diallo',
      href: '/tree/tree_diallo',
      name: 'Famille Diallo',
      description: null,
      ownerName: 'Awa Diallo',
      memberCountLabel: '3 membres',
      visibilityLabel: 'Partagé',
      roleLabel: 'Éditeur',
      historyHref: '/tree/tree_diallo/history',
      settingsHref: null,
      newMemberHref: null,
      newUnionHref: null,
    })
  })

  it('offers the history to contributors only', () => {
    expect(toTreeViewModel({ ...summary, role: 'VIEWER' }).historyHref).toBeNull()
  })

  it('offers the settings and the member form to the owner only', () => {
    expect(toTreeViewModel({ ...summary, role: 'OWNER' })).toMatchObject({
      settingsHref: '/tree/tree_diallo/settings',
      newMemberHref: '/tree/tree_diallo/members/new',
      newUnionHref: '/tree/tree_diallo/unions/new',
    })
  })
})
