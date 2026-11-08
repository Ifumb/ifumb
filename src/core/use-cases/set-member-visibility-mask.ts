import 'server-only'
import { canEditMember } from '@/core/entities/member-access'
import type { VisibilityMask } from '@/core/entities/member'
import { DomainError } from '@/core/shared/errors/domain-error'
import { err, ok, type Result } from '@/core/shared/result'
import { MemberId } from '@/core/shared/value-objects/member-id'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { readableTree, type TreeReadError, type TreeReadInput } from '@/core/use-cases/tree-read-access'

export type SetMemberVisibilityMaskInput = TreeReadInput & {
  readonly memberId: string
  readonly mask: VisibilityMask
}

export type SetMemberVisibilityMaskError =
  | TreeReadError
  | { readonly kind: 'MEMBER_NOT_FOUND' }
  | { readonly kind: 'MEMBER_EDIT_FORBIDDEN' }
  | { readonly kind: 'MEMBER_IS_DECEASED' }

type SetMemberVisibilityMaskDeps = {
  readonly trees: TreeReader
  readonly families: FamilyReader
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/**
 * Hides (or reveals) a living member's dates, places, photo and biography from a public tree's
 * non-collaborator viewers. Kept outside `UpdateMemberUseCase`'s propose/apply machinery like
 * `discoverable`: a privacy setting, not a genealogical fact, changed immediately by whoever may
 * edit the member - never proposed for approval.
 */
export class SetMemberVisibilityMaskUseCase {
  constructor(private readonly deps: SetMemberVisibilityMaskDeps) {}

  async execute(
    input: SetMemberVisibilityMaskInput,
  ): Promise<Result<{ changed: boolean }, SetMemberVisibilityMaskError>> {
    const access = await readableTree(this.deps.trees, input)
    if (!access.ok) return access
    const viewerId = input.viewerId
    if (!viewerId) return err({ kind: 'AUTHENTICATION_REQUIRED' })

    const family = await this.deps.families.loadFamily(access.value.listing.tree.id)
    const memberId = MemberId.fromString(input.memberId)
    const member = family.findMember(memberId)
    if (!member) return err({ kind: 'MEMBER_NOT_FOUND' })
    if (!canEditMember(access.value.role, member, viewerId)) {
      return err({ kind: 'MEMBER_EDIT_FORBIDDEN' })
    }

    let outcome: { changed: boolean }
    try {
      outcome = member.setVisibilityMask(input.mask)
    } catch (error) {
      if (error instanceof DomainError) return err({ kind: 'MEMBER_IS_DECEASED' })
      throw error
    }
    if (!outcome.changed) return ok({ changed: false })

    const now = this.deps.clock.now()
    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await context.members.updateVisibilityMask(memberId, input.mask)
      await context.auditLog.record({
        id: this.deps.ids.next(),
        treeId: input.treeId,
        authorId: viewerId,
        action: 'MEMBER_UPDATED',
        targetType: 'MEMBER',
        targetId: member.id.value,
        diff: {
          before: { visibilityMask: member.visibilityMask },
          after: { visibilityMask: input.mask },
        },
        createdAt: now,
      })
    })
    return ok({ changed: true })
  }
}
