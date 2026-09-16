import 'server-only'
import type { Filiation } from '@/core/entities/union'
import { childLinkDiff } from '@/core/entities/union-audit'
import { childLinkProblem, type ChildLinkProblem } from '@/core/entities/union-rules'
import { err, ok, type Result } from '@/core/shared/result'
import { MemberId } from '@/core/shared/value-objects/member-id'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import type { UnionChildLink } from '@/core/use-cases/ports/union-writer'
import {
  manageableUnion,
  type FamilyDeps,
  type UnionTarget,
  type UnionWriteError,
} from '@/core/use-cases/union-write-access'

export type AddUnionChildInput = UnionTarget & {
  readonly childId: string
  readonly filiation: Filiation
}

export type AddUnionChildError =
  UnionWriteError | { readonly kind: 'CHILD_NOT_FOUND' } | { readonly kind: ChildLinkProblem }

type AddUnionChildDeps = FamilyDeps & {
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/** The owner links a member of the tree as a child of a union, unless that makes no sense. */
export class AddUnionChildUseCase {
  constructor(private readonly deps: AddUnionChildDeps) {}

  async execute(
    input: AddUnionChildInput,
  ): Promise<Result<{ childName: string }, AddUnionChildError>> {
    const { childId, filiation, ...target } = input
    const found = await manageableUnion(this.deps, target)
    if (!found.ok) return found
    // reason: unlike create/update/delete, linking a child has no shape in the pending-change
    // format (module 2.6) — an editor stays refused here, never proposing.
    if (found.value.mode !== 'apply') return err({ kind: 'UNION_MANAGEMENT_FORBIDDEN' })

    const { family, union } = found.value
    const child = family.findMember(MemberId.fromString(childId))
    if (!child) return err({ kind: 'CHILD_NOT_FOUND' })
    const problem = childLinkProblem(family, union, child.id)
    if (problem) return err({ kind: problem })

    const link = { id: this.deps.ids.next(), childId: child.id, filiation }
    await this.store(target, link, child.fullName)
    return ok({ childName: child.fullName })
  }

  private store(target: UnionTarget, link: UnionChildLink, childName: string) {
    return this.deps.unitOfWork.runInTransaction(async ({ unions, auditLog }) => {
      await unions.addChild(target.unionId, link)
      await auditLog.record({
        id: this.deps.ids.next(),
        treeId: target.treeId,
        authorId: target.viewerId,
        action: 'UNION_UPDATED',
        targetType: 'UNION',
        targetId: target.unionId,
        diff: childLinkDiff('added', childName, link.filiation),
        createdAt: this.deps.clock.now(),
      })
    })
  }
}
