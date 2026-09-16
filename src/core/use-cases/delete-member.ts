import 'server-only'
import { canDeleteMember } from '@/core/entities/member-access'
import { memberDeletionDiff } from '@/core/entities/member-audit'
import { ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { PhotoStorage } from '@/core/use-cases/ports/photo-storage'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { discardPhotoFile } from '@/core/use-cases/member-photo-files'
import {
  writableMember,
  type MemberReadDeps,
  type MemberTarget,
  type MemberWriteError,
} from '@/core/use-cases/member-write-access'
import { applied, proposed, type WriteOutcome } from '@/core/use-cases/proposal-outcome'
import { recordProposal, type RecordProposalDeps } from '@/core/use-cases/proposal-recording'

type DeleteMemberDeps = MemberReadDeps &
  RecordProposalDeps & {
    readonly unitOfWork: UnitOfWork
    readonly ids: IdGenerator
    readonly clock: Clock
    readonly storage: PhotoStorage | null
  }

export const DELETE_RULE = {
  allows: canDeleteMember,
  refusal: { kind: 'MEMBER_MANAGEMENT_FORBIDDEN' },
} as const

/**
 * The owner removes a member, its links as a child and its photo, and records what it was; an
 * editor's deletion is proposed to the owner instead — nothing is removed until it is approved.
 */
export class DeleteMemberUseCase {
  constructor(private readonly deps: DeleteMemberDeps) {}

  async execute(target: MemberTarget): Promise<Result<WriteOutcome<object>, MemberWriteError>> {
    const found = await writableMember(this.deps, target, DELETE_RULE)
    if (!found.ok) return found

    const { member } = found.value
    if (found.value.mode === 'propose') {
      const pendingChangeId = await recordProposal(this.deps, found.value.tree, {
        targetId: member.id.value,
        targetType: 'MEMBER',
        action: 'DELETE',
        diff: memberDeletionDiff(member),
        authorId: target.viewerId,
      })
      return ok(proposed(pendingChangeId))
    }

    await this.deps.unitOfWork.runInTransaction(async ({ members, auditLog }) => {
      await members.delete(member.id)
      await auditLog.record({
        id: this.deps.ids.next(),
        treeId: target.treeId,
        authorId: target.viewerId,
        action: 'MEMBER_DELETED',
        targetType: 'MEMBER',
        targetId: member.id.value,
        diff: memberDeletionDiff(member),
        createdAt: this.deps.clock.now(),
      })
    })
    await discardPhotoFile(this.deps.storage, member.details.photoUrl)
    return ok(applied({}))
  }
}
