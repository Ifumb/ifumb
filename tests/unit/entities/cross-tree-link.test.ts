import { describe, expect, it } from 'vitest'
import { CrossTreeLink } from '@/core/entities/cross-tree-link'

const NOW = new Date('2026-09-17T10:00:00Z')

function aLink() {
  return CrossTreeLink.establish({
    id: 'ctl_1',
    tree1Id: 'tree_diallo',
    member1Id: 'mbr_awa',
    tree2Id: 'tree_toure',
    member2Id: 'mbr_awa_target',
    now: NOW,
  })
}

describe('CrossTreeLink', () => {
  it('records its two sides and when it was established', () => {
    const link = aLink()
    expect([link.tree1Id, link.member1Id, link.tree2Id, link.member2Id, link.createdAt]).toEqual([
      'tree_diallo',
      'mbr_awa',
      'tree_toure',
      'mbr_awa_target',
      NOW,
    ])
  })

  it('resolves ownSide/otherSide from either tree it connects', () => {
    const link = aLink()
    expect([link.ownSide('tree_diallo'), link.otherSide('tree_diallo')]).toEqual([
      { treeId: 'tree_diallo', memberId: 'mbr_awa' },
      { treeId: 'tree_toure', memberId: 'mbr_awa_target' },
    ])
    expect([link.ownSide('tree_toure'), link.otherSide('tree_toure')]).toEqual([
      { treeId: 'tree_toure', memberId: 'mbr_awa_target' },
      { treeId: 'tree_diallo', memberId: 'mbr_awa' },
    ])
  })

  it('returns null on both sides for a tree the link does not touch', () => {
    const link = aLink()
    expect([link.ownSide('tree_unrelated'), link.otherSide('tree_unrelated')]).toEqual([null, null])
  })
})
