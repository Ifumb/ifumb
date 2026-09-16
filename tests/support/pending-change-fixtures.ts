import { PendingChange, type PendingChangeProps } from '@/core/entities/pending-change'
import { EDITOR_ID } from '@tests/support/tree-fixtures'

const DEFAULT_CREATED_AT = new Date('2026-09-16T10:00:00Z')

export function aPendingChange(overrides: Partial<PendingChangeProps> = {}): PendingChange {
  return PendingChange.create({
    id: 'pc_1',
    treeId: 'tree_diallo',
    authorId: EDITOR_ID,
    targetType: 'MEMBER',
    targetId: 'mbr_awa',
    action: 'UPDATE',
    snapshotBefore: { tribe: 'Peul' },
    snapshotAfter: { tribe: 'Soninke' },
    status: 'PENDING',
    rejectionComment: null,
    resolvedAt: null,
    resolvedById: null,
    createdAt: DEFAULT_CREATED_AT,
    ...overrides,
  })
}
