import 'server-only'
import { memberPhotoDiff } from '@/core/entities/member-audit'
import { photoUploadProblem, type PhotoUploadProblem } from '@/core/entities/member-photo'
import type { Member } from '@/core/entities/member'
import { err, ok, type Result } from '@/core/shared/result'
import { discardPhotoFile } from '@/core/use-cases/member-photo-files'
import {
  EDIT_MEMBER_RULE,
  writableMember,
  type MemberTarget,
  type MemberWriteError,
} from '@/core/use-cases/member-write-access'
import type { PhotoUnreadable } from '@/core/use-cases/ports/photo-processor'
import type { MemberPhotoDeps } from '@/core/use-cases/member-photo-deps'

export type ChangeMemberPhotoInput = MemberTarget & { readonly photo: Uint8Array }

export type ChangeMemberPhotoError =
  | MemberWriteError
  | { readonly kind: PhotoUploadProblem }
  | PhotoUnreadable
  | { readonly kind: 'PHOTO_STORAGE_UNAVAILABLE' }

/**
 * The owner, or the account that claimed the member, replaces its photo. The file is stored first
 * under a new name, then the member points at it, then the previous file is discarded.
 */
export class ChangeMemberPhotoUseCase {
  constructor(private readonly deps: MemberPhotoDeps) {}

  async execute(
    input: ChangeMemberPhotoInput,
  ): Promise<Result<{ photoUrl: string }, ChangeMemberPhotoError>> {
    const { photo, ...target } = input
    const found = await writableMember(this.deps, target, EDIT_MEMBER_RULE)
    if (!found.ok) return found
    const { storage } = this.deps
    if (!storage) return err({ kind: 'PHOTO_STORAGE_UNAVAILABLE' })
    const problem = photoUploadProblem(photo)
    if (problem) return err({ kind: problem })
    const normalized = await this.deps.photos.normalize(photo)
    if (!normalized.ok) return normalized

    const photoUrl = await storage.save(this.pathFor(target), normalized.value)
    await this.pointAt(found.value.member, photoUrl, target)
    await discardPhotoFile(storage, found.value.member.details.photoUrl)
    return ok({ photoUrl })
  }

  private pathFor({ treeId, memberId }: MemberTarget): string {
    return `${treeId}/${memberId}-${this.deps.ids.next()}.webp`
  }

  /** reason: when the member cannot point at the new file, that file is discarded again. */
  private async pointAt(member: Member, photoUrl: string, target: MemberTarget): Promise<void> {
    try {
      await this.deps.unitOfWork.runInTransaction(async ({ members, auditLog }) => {
        await members.updatePhoto(member.id, photoUrl)
        await auditLog.record({
          id: this.deps.ids.next(),
          treeId: target.treeId,
          authorId: target.viewerId,
          action: 'MEMBER_UPDATED',
          targetType: 'MEMBER',
          targetId: member.id.value,
          diff: memberPhotoDiff(member.details.photoUrl, photoUrl),
          createdAt: this.deps.clock.now(),
        })
      })
    } catch (error) {
      await discardPhotoFile(this.deps.storage, photoUrl)
      throw error
    }
  }
}
