import 'server-only'
import { ok, type Result } from '@/core/shared/result'
import type { MemberPhotoDeps } from '@/core/use-cases/member-photo-deps'
import {
  EDIT_MEMBER_RULE,
  writableMember,
  type MemberTarget,
  type MemberWriteError,
} from '@/core/use-cases/member-write-access'
import { toPersonReference, type PersonReference } from '@/core/use-cases/member-views'

export type MemberPhotoForm = {
  readonly tree: { readonly id: string; readonly name: string }
  readonly member: PersonReference & { readonly photoUrl: string | null }
  /** False where no photo storage is configured: photos can then be neither added nor removed. */
  readonly storageAvailable: boolean
}

/** The current photo of a member, for those allowed to change it. */
export class GetMemberPhotoFormUseCase {
  constructor(private readonly deps: Pick<MemberPhotoDeps, 'trees' | 'families' | 'storage'>) {}

  async execute(target: MemberTarget): Promise<Result<MemberPhotoForm, MemberWriteError>> {
    const found = await writableMember(this.deps, target, EDIT_MEMBER_RULE)
    if (!found.ok) return found

    const { tree, member } = found.value
    return ok({
      tree: { id: tree.id.value, name: tree.name },
      member: { ...toPersonReference(member), photoUrl: member.details.photoUrl },
      storageAvailable: this.deps.storage !== null,
    })
  }
}
