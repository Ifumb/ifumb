import 'server-only'
import type { Member } from '@/core/entities/member'
import { canEditMember } from '@/core/entities/member-access'
import { writeMode, type WriteMode } from '@/core/entities/contribution-access'
import type { Tree, TreeRole } from '@/core/entities/tree'
import { err, ok, type Result } from '@/core/shared/result'
import { MemberId } from '@/core/shared/value-objects/member-id'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import { readableTree, type TreeReadError } from '@/core/use-cases/tree-read-access'

export type MemberTarget = {
  readonly treeId: string
  readonly memberId: string
  readonly viewerId: string
}

export type MemberAccessDenied =
  { readonly kind: 'MEMBER_EDIT_FORBIDDEN' } | { readonly kind: 'MEMBER_MANAGEMENT_FORBIDDEN' }

export type MemberWriteError =
  TreeReadError | { readonly kind: 'MEMBER_NOT_FOUND' } | MemberAccessDenied

export type WritableMember = {
  readonly tree: Tree
  readonly role: TreeRole
  readonly member: Member
  /** 'apply' when the viewer writes directly; 'propose' when an editor's change goes to the owner. */
  readonly mode: Exclude<WriteMode, 'forbidden'>
}

export type MemberReadDeps = { readonly trees: TreeReader; readonly families: FamilyReader }

type MemberRule = (role: TreeRole, member: Member, viewerId: string) => boolean

/** The owner writes any member directly; so does the account that claimed one. */
export const EDIT_MEMBER_RULE = {
  allows: canEditMember,
  refusal: { kind: 'MEMBER_EDIT_FORBIDDEN' },
} as const

/**
 * A member of a readable tree, and whether the viewer writes it directly or only proposes to; the
 * tree is checked first.
 */
export async function writableMember(
  deps: MemberReadDeps,
  target: MemberTarget,
  rule: { readonly allows: MemberRule; readonly refusal: MemberAccessDenied },
): Promise<Result<WritableMember, MemberWriteError>> {
  const access = await readableTree(deps.trees, target)
  if (!access.ok) return access

  const { listing, role } = access.value
  const family = await deps.families.loadFamily(listing.tree.id)
  const member = family.findMember(MemberId.fromString(target.memberId))
  if (!member) return err({ kind: 'MEMBER_NOT_FOUND' })

  const mode = writeMode(role, rule.allows(role, member, target.viewerId))
  if (mode === 'forbidden') return err(rule.refusal)
  return ok({ tree: listing.tree, role, member, mode })
}
