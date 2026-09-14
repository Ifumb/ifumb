import { beforeEach, describe, expect, it } from 'vitest'
import { AuditCursor } from '@/core/shared/value-objects/audit-cursor'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import type { AuditEntry } from '@/core/use-cases/audit-log-views'
import { AUDIT_LOG_PAGE_SIZE, GetAuditLogUseCase } from '@/core/use-cases/get-audit-log'
import { InMemoryAuditLogReader } from '@/infrastructure/persistence/in-memory/in-memory-audit-log-reader'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { aStoredTree, aTree, EDITOR_ID, OWNER_ID, STRANGER_ID } from '@tests/support/tree-fixtures'

const VIEWER_ID = 'usr_viewer'

function anEntry(index: number, overrides: Partial<AuditEntry> = {}): AuditEntry {
  return {
    id: `entry_${String(index).padStart(2, '0')}`,
    action: 'MEMBER_UPDATED',
    targetType: 'MEMBER',
    targetId: 'mbr_awa',
    author: { firstName: 'Awa', lastName: 'Diallo' },
    createdAt: new Date(Date.UTC(2026, 2, 1, 12, index)),
    diff: { before: { firstName: 'Awa' }, after: { firstName: 'Aïcha' } },
    ...overrides,
  }
}

describe('GetAuditLogUseCase', () => {
  let auditLog: InMemoryAuditLogReader

  beforeEach(() => {
    auditLog = new InMemoryAuditLogReader()
    auditLog.seed('tree_diallo', [anEntry(1), anEntry(2, { action: 'TREE_UPDATED' })])
  })

  function useCaseFor(tree = aTree()) {
    const trees = new InMemoryTreeReader()
    trees.seed(
      aStoredTree({
        tree,
        acceptedInvitations: [
          { userId: EDITOR_ID, role: 'EDITOR' },
          { userId: VIEWER_ID, role: 'VIEWER' },
        ],
      }),
    )
    return new GetAuditLogUseCase({ trees, auditLog })
  }

  it('returns entries newest first with their changes', async () => {
    const result = await useCaseFor().execute({ treeId: 'tree_diallo', viewerId: OWNER_ID })

    expect(result.ok && result.value.entries.map((entry) => [entry.id, entry.changes])).toEqual([
      ['entry_02', [{ field: 'firstName', kind: 'changed', before: 'Awa', after: 'Aïcha' }]],
      ['entry_01', [{ field: 'firstName', kind: 'changed', before: 'Awa', after: 'Aïcha' }]],
    ])
    expect(result.ok && result.value.tree).toEqual({ id: 'tree_diallo', name: 'Famille Diallo' })
  })

  it('pages the entries and gives the cursor of the next page', async () => {
    auditLog.seed(
      'tree_diallo',
      Array.from({ length: AUDIT_LOG_PAGE_SIZE + 1 }, (_, index) => anEntry(index)),
    )
    const useCase = useCaseFor()

    const first = await useCase.execute({ treeId: 'tree_diallo', viewerId: OWNER_ID })
    const next = first.ok ? first.value.nextCursor : null
    const second = await useCase.execute({
      treeId: 'tree_diallo',
      viewerId: OWNER_ID,
      cursor: next ?? undefined,
    })

    expect(first.ok && first.value.entries).toHaveLength(AUDIT_LOG_PAGE_SIZE)
    expect(second.ok && [second.value.entries.map((e) => e.id), second.value.nextCursor]).toEqual([
      ['entry_00'],
      null,
    ])
  })

  it('starts from the most recent entries when the cursor is unreadable', async () => {
    const result = await useCaseFor().execute({
      treeId: 'tree_diallo',
      viewerId: OWNER_ID,
      cursor: 'garbage',
    })

    expect(result.ok && result.value.entries).toHaveLength(2)
  })

  it('lets an editor read the log', async () => {
    const result = await useCaseFor().execute({ treeId: 'tree_diallo', viewerId: EDITOR_ID })

    expect(result.ok).toBe(true)
  })

  it('passes the action and day filters to the reader', async () => {
    await useCaseFor().execute({
      treeId: 'tree_diallo',
      viewerId: OWNER_ID,
      action: 'TREE_UPDATED',
      fromDay: '2026-03-01',
      toDay: '2026-03-02',
    })

    expect(auditLog.lastFilter).toEqual({
      action: 'TREE_UPDATED',
      fromDay: '2026-03-01',
      toDay: '2026-03-02',
    })
  })

  it('refuses a viewer with AUDIT_LOG_FORBIDDEN', async () => {
    expect(await useCaseFor().execute({ treeId: 'tree_diallo', viewerId: VIEWER_ID })).toEqual({
      ok: false,
      error: { kind: 'AUDIT_LOG_FORBIDDEN' },
    })
  })

  it('refuses an anonymous visitor of a public tree with AUDIT_LOG_FORBIDDEN', async () => {
    const useCase = useCaseFor(aTree({ visibility: 'PUBLIC' }))

    expect(await useCase.execute({ treeId: 'tree_diallo' })).toEqual({
      ok: false,
      error: { kind: 'AUDIT_LOG_FORBIDDEN' },
    })
  })

  it.each([
    [{ treeId: 'tree_unknown', viewerId: OWNER_ID }, 'TREE_NOT_FOUND'],
    [{ treeId: 'tree_diallo' }, 'AUTHENTICATION_REQUIRED'],
    [{ treeId: 'tree_diallo', viewerId: STRANGER_ID }, 'ACCESS_DENIED'],
  ])('refuses %o with %s', async (input, kind) => {
    expect(await useCaseFor().execute(input)).toEqual({ ok: false, error: { kind } })
  })

  it('never reads the log of a tree the viewer may not read', async () => {
    await useCaseFor().execute({ treeId: 'tree_diallo', viewerId: VIEWER_ID })

    expect(auditLog.lastFilter).toBeNull()
  })
})

describe('AuditCursor use in the reader double', () => {
  it('continues after the entry the cursor points to', async () => {
    const auditLog = new InMemoryAuditLogReader()
    const entries = [anEntry(3), anEntry(2), anEntry(1)]
    auditLog.seed('tree_diallo', entries)
    const cursor = AuditCursor.of(entries[1]!.createdAt, entries[1]!.id)

    const page = await auditLog.page(
      TreeId.fromString('tree_diallo'),
      {},
      cursor,
      AUDIT_LOG_PAGE_SIZE,
    )

    expect(page.entries.map((entry) => entry.id)).toEqual(['entry_01'])
  })
})
