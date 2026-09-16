import 'server-only'
import type { Family } from '@/core/entities/family'
import { unionProposalRevisionSnapshot } from '@/core/entities/proposal-snapshots'
import type { Union, UnionDetailsInput } from '@/core/entities/union'
import { unionRevisionDiff } from '@/core/entities/union-audit'
import {
  parentChangeProblem,
  parentIdsIn,
  unionDetailsProblem,
  type UnionDetailsProblem,
} from '@/core/entities/union-rules'
import { err, ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { applied, proposed, type WriteOutcome } from '@/core/use-cases/proposal-outcome'
import { recordProposal, type RecordProposalDeps } from '@/core/use-cases/proposal-recording'
import {
  manageableUnion,
  unionDetailsFrom,
  type FamilyDeps,
  type UnionDetailsEntry,
  type UnionTarget,
  type UnionWriteError,
} from '@/core/use-cases/union-write-access'

export type UpdateUnionInput = UnionTarget & UnionDetailsEntry

export type UpdateUnionError =
  UnionWriteError | { readonly kind: UnionDetailsProblem } | { readonly kind: 'FAMILY_CYCLE' }

type UpdateUnionDeps = FamilyDeps &
  RecordProposalDeps & {
    readonly unitOfWork: UnitOfWork
    readonly ids: IdGenerator
    readonly clock: Clock
  }

/**
 * The owner changes the type, dates or parents of a union directly; only real changes are stored.
 * An editor's revision is proposed to the owner instead.
 */
export class UpdateUnionUseCase {
  constructor(private readonly deps: UpdateUnionDeps) {}

  async execute(input: UpdateUnionInput): Promise<Result<WriteOutcome<{ changed: boolean }>, UpdateUnionError>> {
    const { treeId, unionId, viewerId, ...entry } = input
    const found = await manageableUnion(this.deps, { treeId, unionId, viewerId })
    if (!found.ok) return found

    const { family, union } = found.value
    const details = unionDetailsFrom(entry)
    const problem = revisionProblem(family, union, details)
    if (problem) return err({ kind: problem })

    const revised = union.revise(details)
    if (!revised.changed) return ok(applied({ changed: false }))

    if (found.value.mode === 'propose') {
      const pendingChangeId = await recordProposal(this.deps, found.value.tree, {
        targetId: union.id,
        targetType: 'UNION',
        action: 'UPDATE',
        diff: unionProposalRevisionSnapshot(union, revised.union),
        authorId: viewerId,
      })
      return ok(proposed(pendingChangeId))
    }
    await this.store(
      { before: union, after: revised.union, family },
      { treeId, authorId: viewerId },
    )
    return ok(applied({ changed: true }))
  }

  private store(
    revision: { before: Union; after: Union; family: Family },
    by: { treeId: string; authorId: string },
  ) {
    return this.deps.unitOfWork.runInTransaction(async ({ unions, auditLog }) => {
      await unions.update(revision.after)
      await auditLog.record({
        id: this.deps.ids.next(),
        ...by,
        action: 'UNION_UPDATED',
        targetType: 'UNION',
        targetId: revision.after.id,
        diff: unionRevisionDiff(revision.before, revision.after, revision.family),
        createdAt: this.deps.clock.now(),
      })
    })
  }
}

function revisionProblem(family: Family, union: Union, details: UnionDetailsInput) {
  return (
    unionDetailsProblem(family, details) ?? parentChangeProblem(family, union, parentIdsIn(details))
  )
}
