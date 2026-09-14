import 'server-only'
import { err, ok, type Result } from '@/core/shared/result'
import { MemberId } from '@/core/shared/value-objects/member-id'
import {
  toMemberDetails,
  toParentUnionView,
  toPartnerUnionView,
  type MemberDetails,
  type ParentUnionView,
  type PartnerUnionView,
} from '@/core/use-cases/member-views'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import {
  readableTree,
  type TreeReadError,
  type TreeReadInput,
} from '@/core/use-cases/tree-read-access'

export type GetMemberProfileInput = TreeReadInput & { readonly memberId: string }

export type GetMemberProfileError = TreeReadError | { readonly kind: 'MEMBER_NOT_FOUND' }

export type MemberProfile = {
  readonly tree: { readonly id: string; readonly name: string; readonly isPublic: boolean }
  readonly member: MemberDetails
  readonly parentUnions: readonly ParentUnionView[]
  readonly partnerUnions: readonly PartnerUnionView[]
}

type GetMemberProfileDeps = {
  readonly trees: TreeReader
  readonly families: FamilyReader
}

export class GetMemberProfileUseCase {
  constructor(private readonly deps: GetMemberProfileDeps) {}

  async execute(
    input: GetMemberProfileInput,
  ): Promise<Result<MemberProfile, GetMemberProfileError>> {
    const access = await readableTree(this.deps.trees, input)
    if (!access.ok) return access

    const { tree } = access.value.listing
    const family = await this.deps.families.loadFamily(tree.id)
    const memberId = MemberId.fromString(input.memberId)
    const member = family.findMember(memberId)
    if (!member) return err({ kind: 'MEMBER_NOT_FOUND' })

    return ok({
      tree: { id: tree.id.value, name: tree.name, isPublic: tree.visibility === 'PUBLIC' },
      member: toMemberDetails(member),
      parentUnions: family.parentUnionsOf(memberId).map(toParentUnionView),
      partnerUnions: family.partnerUnionsOf(memberId).map(toPartnerUnionView),
    })
  }
}
