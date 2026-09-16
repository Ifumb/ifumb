import 'server-only'
import { unionProposalDeletionSnapshot } from '@/core/entities/proposal-snapshots'
import { unionDeletionDiff } from '@/core/entities/union-audit'
import { ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { applied, proposed, type WriteOutcome } from '@/core/use-cases/proposal-outcome'
import { recordProposal, type RecordProposalDeps } from '@/core/use-cases/proposal-recording'
import {
  manageableUnion,
  type FamilyDeps,
  type UnionTarget,
  type UnionWriteError,
} from '@/core/use-cases/union-write-access'

type DeleteUnionDeps = FamilyDeps &
  RecordProposalDeps & {
    readonly unitOfWork: UnitOfWork
    readonly ids: IdGenerator
    readonly clock: Clock
  }

/**
 * The owner removes a union directly; its children stay in the tree without that parent link. An
 * editor's deletion is proposed to the owner instead — the union stays until it is approved.
 */
export class DeleteUnionUseCase {
  constructor(private readonly deps: DeleteUnionDeps) {}

  async execute(target: UnionTarget): Promise<Result<WriteOutcome<object>, UnionWriteError>> {
    const found = await manageableUnion(this.deps, target)
    if (!found.ok) return found

    const { union, family } = found.value
    if (found.value.mode === 'propose') {
      const pendingChangeId = await recordProposal(this.deps, found.value.tree, {
        targetId: union.id,
        targetType: 'UNION',
        action: 'DELETE',
        diff: unionProposalDeletionSnapshot(union),
        authorId: target.viewerId,
      })
      return ok(proposed(pendingChangeId))
    }

    await this.deps.unitOfWork.runInTransaction(async ({ unions, auditLog }) => {
      await unions.delete(union.id)
      await auditLog.record({
        id: this.deps.ids.next(),
        treeId: target.treeId,
        authorId: target.viewerId,
        action: 'UNION_DELETED',
        targetType: 'UNION',
        targetId: union.id,
        diff: unionDeletionDiff(union, family),
        createdAt: this.deps.clock.now(),
      })
    })
    return ok(applied({}))
  }
}
