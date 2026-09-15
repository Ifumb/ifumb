import 'server-only'
import { canDeleteMember } from '@/core/entities/member-access'
import { ok, type Result } from '@/core/shared/result'
import { toMemberDetails, type MemberDetails } from '@/core/use-cases/member-views'
import {
  EDIT_MEMBER_RULE,
  writableMember,
  type MemberReadDeps,
  type MemberTarget,
  type MemberWriteError,
} from '@/core/use-cases/member-write-access'

export type MemberForm = {
  readonly tree: { readonly id: string; readonly name: string }
  readonly member: MemberDetails
  readonly canDelete: boolean
}

/** The current details of a member, for those allowed to edit it. */
export class GetMemberFormUseCase {
  constructor(private readonly deps: MemberReadDeps) {}

  async execute(target: MemberTarget): Promise<Result<MemberForm, MemberWriteError>> {
    const found = await writableMember(this.deps, target, EDIT_MEMBER_RULE)
    if (!found.ok) return found

    const { tree, role, member } = found.value
    return ok({
      tree: { id: tree.id.value, name: tree.name },
      member: toMemberDetails(member),
      canDelete: canDeleteMember(role),
    })
  }
}
