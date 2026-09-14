import { describe, expect, it } from 'vitest'
import type { AuditLogEntryView, AuditLogPage } from '@/core/use-cases/audit-log-views'
import { formatAuditValue, formatDateTime } from '@/presentation/formatting/audit-value-format'
import {
  historyHref,
  toAuditEntryViewModel,
  toAuditLogViewModel,
} from '@/presentation/mappers/audit-log-view-models'
import { parseAuditLogRequest } from '@/presentation/schemas/audit-log-schema'

function anEntry(overrides: Partial<AuditLogEntryView> = {}): AuditLogEntryView {
  return {
    id: 'entry_1',
    action: 'MEMBER_UPDATED',
    targetType: 'MEMBER',
    targetId: 'mbr_awa',
    author: { firstName: 'Awa', lastName: 'Diallo' },
    createdAt: new Date('2026-03-01T10:20:00Z'),
    changes: [],
    ...overrides,
  }
}

const aPage = (overrides: Partial<AuditLogPage> = {}): AuditLogPage => ({
  tree: { id: 'tree_1', name: 'Famille Diallo' },
  filter: {},
  entries: [anEntry()],
  nextCursor: null,
  ...overrides,
})

describe('parseAuditLogRequest', () => {
  it('reads the action, the days and the cursor', () => {
    expect(
      parseAuditLogRequest({
        action: 'TREE_UPDATED',
        from: '2026-03-01',
        to: ['2026-03-31'],
        before: 'abc',
      }),
    ).toEqual({ action: 'TREE_UPDATED', fromDay: '2026-03-01', toDay: '2026-03-31', cursor: 'abc' })
  })

  it.each([
    { action: 'EVERYTHING' },
    { from: '01/03/2026' },
    { to: '2026-02-30' },
    { before: 'x'.repeat(201) },
    { before: '' },
  ])('leaves out the unreadable %o', (params) => {
    expect(parseAuditLogRequest(params)).toEqual({})
  })
})

describe('formatAuditValue', () => {
  it.each([
    [null, 'Non renseigné'],
    ['', 'Non renseigné'],
    [true, 'Oui'],
    [false, 'Non'],
    [3, '3'],
    ['1954-01-01', '1 janvier 1954'],
    ['1954-03', 'mars 1954'],
    ['1954-03-12T00:00:00.000Z', '12 mars 1954'],
    ['FEMALE', 'Féminin'],
    ['MARRIAGE', 'Mariage'],
    ['PUBLIC', 'Public'],
    ['Awa', 'Awa'],
  ])('formats %o as %s', (value, label) => {
    expect(formatAuditValue(value)).toBe(label)
  })
})

describe('formatDateTime', () => {
  it('formats a moment in the given time zone', () => {
    expect(formatDateTime('2026-03-01T10:20:00Z', 'UTC')).toBe('1 mars 2026 à 10:20')
  })
})

describe('toAuditEntryViewModel', () => {
  it('labels the action and the author, and formats each change', () => {
    const entry = anEntry({
      changes: [
        { field: 'firstName', kind: 'changed', before: 'Awa', after: 'Aïcha' },
        { field: 'gender', kind: 'set', after: 'FEMALE' },
        { field: 'birthDate', kind: 'removed', before: '1932-05-12' },
      ],
    })

    expect(toAuditEntryViewModel(entry)).toEqual({
      id: 'entry_1',
      actionLabel: 'Membre modifié',
      tone: 'update',
      createdAtIso: '2026-03-01T10:20:00.000Z',
      authorName: 'Awa Diallo',
      changes: [
        { label: 'Prénom', before: 'Awa', after: 'Aïcha' },
        { label: 'Genre', before: null, after: 'Féminin' },
        { label: 'Naissance', before: '12 mai 1932', after: null },
      ],
    })
  })

  it('hides technical fields and keeps unknown ones under their own name', () => {
    const entry = anEntry({
      action: 'UNION_CREATED',
      changes: [
        { field: 'parent1Id', kind: 'set', after: 'mbr_x' },
        { field: 'legacyNote', kind: 'set', after: 'texte' },
      ],
    })

    expect(toAuditEntryViewModel(entry)).toMatchObject({
      tone: 'creation',
      changes: [{ label: 'legacyNote', before: null, after: 'texte' }],
    })
  })
})

describe('toAuditLogViewModel', () => {
  it('counts the entries and links to the older ones, keeping the filters', () => {
    const page = aPage({ filter: { action: 'MEMBER_UPDATED' }, nextCursor: 'cursor_2' })

    expect(toAuditLogViewModel(page, {})).toMatchObject({
      treeName: 'Famille Diallo',
      treeHref: '/tree/tree_1',
      action: '/tree/tree_1/history',
      filters: { action: 'MEMBER_UPDATED' },
      hasFilters: true,
      status: '1 entrée affichée.',
      olderHref: '/tree/tree_1/history?action=MEMBER_UPDATED&before=cursor_2',
      newestHref: null,
    })
  })

  it('leads back to the newest entries from an older page', () => {
    const viewModel = toAuditLogViewModel(aPage({ filter: { fromDay: '2026-03-01' } }), {
      cursor: 'c',
    })

    expect([viewModel.olderHref, viewModel.newestHref]).toEqual([
      null,
      '/tree/tree_1/history?from=2026-03-01',
    ])
  })

  it.each([
    [{}, 'Aucune entrée dans le journal de cet arbre.'],
    [{ toDay: '2026-03-01' }, 'Aucune entrée ne correspond à ces filtres.'],
  ])('explains an empty page with the filter %o', (filter, status) => {
    expect(toAuditLogViewModel(aPage({ filter, entries: [] }), {}).status).toBe(status)
  })

  it('offers every action to filter on', () => {
    const { actionOptions } = toAuditLogViewModel(aPage(), {})

    expect([actionOptions.length, actionOptions[0]]).toEqual([
      17,
      { value: 'MEMBER_CREATED', label: 'Membre créé' },
    ])
  })
})

describe('historyHref', () => {
  it('leaves the query out when nothing narrows the history', () => {
    expect(historyHref('tree_1', {})).toBe('/tree/tree_1/history')
  })
})
