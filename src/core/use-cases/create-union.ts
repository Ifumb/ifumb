import 'server-only'
import type { Family } from '@/core/entities/family'
import { unionProposalCreationSnapshot } from '@/core/entities/proposal-snapshots'
import { Union } from '@/core/entities/union'
import { unionCreationDiff } from '@/core/entities/union-audit'
import { unionDetailsProblem, type UnionDetailsProblem } from '@/core/entities/union-rules'
import { err, ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { applied, proposed, type WriteOutcome } from '@/core/use-cases/proposal-outcome'
import { recordProposal, type RecordProposalDeps } from '@/core/use-cases/proposal-recording'
import {
  manageableFamily,
  unionDetailsFrom,
  type FamilyDeps,
  type FamilyTarget,
  type UnionDetailsEntry,
  type UnionManagementError,
} from '@/core/use-cases/union-write-access'

export type CreateUnionInput = FamilyTarget & UnionDetailsEntry

export type CreateUnionError = UnionManagementError | { readonly kind: UnionDetailsProblem }

type CreateUnionDeps = FamilyDeps &
  RecordProposalDeps & {
    readonly unitOfWork: UnitOfWork
    readonly ids: IdGenerator
    readonly clock: Clock
  }

/** The owner records a union between one or two members; an editor's union is proposed instead. */
export class CreateUnionUseCase {
  constructor(private readonly deps: CreateUnionDeps) {}

  async execute(
    input: CreateUnionInput,
  ): Promise<Result<WriteOutcome<{ unionId: string }>, CreateUnionError>> {
    const { treeId, viewerId, ...entry } = input
    const found = await manageableFamily(this.deps, { treeId, viewerId })
    if (!found.ok) return found

    const details = unionDetailsFrom(entry)
    const problem = unionDetailsProblem(found.value.family, details)
    if (problem) return err({ kind: problem })

    const union = Union.start({ id: this.deps.ids.next(), ...details })
    if (found.value.mode === 'propose') {
      const pendingChangeId = await recordProposal(this.deps, found.value.tree, {
        targetId: union.id,
        targetType: 'UNION',
        action: 'CREATE',
        diff: unionProposalCreationSnapshot(union),
        authorId: viewerId,
      })
      return ok(proposed(pendingChangeId))
    }
    await this.store(union, found.value.family, { treeId, authorId: viewerId })
    return ok(applied({ unionId: union.id }))
  }

  private store(union: Union, family: Family, by: { treeId: string; authorId: string }) {
    return this.deps.unitOfWork.runInTransaction(async ({ unions, auditLog }) => {
      await unions.insert(by.treeId, union)
      await auditLog.record({
        id: this.deps.ids.next(),
        ...by,
        action: 'UNION_CREATED',
        targetType: 'UNION',
        targetId: union.id,
        diff: unionCreationDiff(union, family),
        createdAt: this.deps.clock.now(),
      })
    })
  }
}
