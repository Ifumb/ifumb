import 'server-only'
import type { Member } from '@/core/entities/member'
import { memberPhotoDiff } from '@/core/entities/member-audit'
import { err, ok, type Result } from '@/core/shared/result'
import type { MemberPhotoDeps } from '@/core/use-cases/member-photo-deps'
import { discardPhotoFile } from '@/core/use-cases/member-photo-files'
import {
  EDIT_MEMBER_RULE,
  writableMember,
  type MemberTarget,
  type MemberWriteError,
} from '@/core/use-cases/member-write-access'

/** The owner, or the account that claimed the member, removes its photo; the file goes too. */
export class RemoveMemberPhotoUseCase {
  constructor(private readonly deps: Omit<MemberPhotoDeps, 'photos'>) {}

  async execute(target: MemberTarget): Promise<Result<{ changed: boolean }, MemberWriteError>> {
    const found = await writableMember(this.deps, target, EDIT_MEMBER_RULE)
    if (!found.ok) return found
    // reason: a photo has no shape in the pending-change format (module 2.6) — an editor who did
    // not claim this member stays refused here, never proposing.
    if (found.value.mode !== 'apply') return err({ kind: 'MEMBER_EDIT_FORBIDDEN' })

    const { member } = found.value
    const previous = member.details.photoUrl
    if (previous === null) return ok({ changed: false })
    await this.clear(member, previous, target)
    await discardPhotoFile(this.deps.storage, previous)
    return ok({ changed: true })
  }

  private clear(member: Member, previous: string, target: MemberTarget) {
    return this.deps.unitOfWork.runInTransaction(async ({ members, auditLog }) => {
      await members.updatePhoto(member.id, null)
      await auditLog.record({
        id: this.deps.ids.next(),
        treeId: target.treeId,
        authorId: target.viewerId,
        action: 'MEMBER_UPDATED',
        targetType: 'MEMBER',
        targetId: member.id.value,
        diff: memberPhotoDiff(previous, null),
        createdAt: this.deps.clock.now(),
      })
    })
  }
}
