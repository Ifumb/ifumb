import { describe, expect, it } from 'vitest'
import { describeAuditDiff } from '@/core/entities/audit-change'

describe('describeAuditDiff', () => {
  it('lists the recorded fields of a creation', () => {
    expect(
      describeAuditDiff({ before: null, after: { firstName: 'Awa', lastName: null } }),
    ).toEqual([
      { field: 'firstName', kind: 'set', after: 'Awa' },
      { field: 'lastName', kind: 'set', after: null },
    ])
  })

  it('lists the removed fields of a deletion', () => {
    expect(describeAuditDiff({ before: { name: 'Famille Diallo' }, after: null })).toEqual([
      { field: 'name', kind: 'removed', before: 'Famille Diallo' },
    ])
  })

  it('reports only the fields whose value changed in an update', () => {
    const diff = {
      before: { firstName: 'Awa', lastName: 'Diallo' },
      after: { firstName: 'Aïcha', lastName: 'Diallo' },
    }

    expect(describeAuditDiff(diff)).toEqual([
      { field: 'firstName', kind: 'changed', before: 'Awa', after: 'Aïcha' },
    ])
  })

  it('never shows a field missing from a partial legacy "before" as changed from nothing', () => {
    const diff = { before: { firstName: 'Awa' }, after: { firstName: 'Awa', tribe: 'Peul' } }

    expect(describeAuditDiff(diff)).toEqual([{ field: 'tribe', kind: 'set', after: 'Peul' }])
  })

  it('reports a field only present before as removed in an update', () => {
    const diff = { before: { removedChildName: 'Fatou' }, after: { type: 'MARRIAGE' } }

    expect(describeAuditDiff(diff)).toEqual([
      { field: 'removedChildName', kind: 'removed', before: 'Fatou' },
      { field: 'type', kind: 'set', after: 'MARRIAGE' },
    ])
  })

  it('has no change when the diff is empty or unreadable', () => {
    expect([
      describeAuditDiff({ before: null, after: null }),
      describeAuditDiff({ before: { a: 1 }, after: { a: 1 } }),
    ]).toEqual([[], []])
  })
})
