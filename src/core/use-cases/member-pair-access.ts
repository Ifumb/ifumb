import 'server-only'
import type { Family } from '@/core/entities/family'
import type { Member } from '@/core/entities/member'
import { err, ok, type Result } from '@/core/shared/result'
import { MemberId } from '@/core/shared/value-objects/member-id'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import {
  readableTree,
  type TreeReadError,
  type TreeReadInput,
} from '@/core/use-cases/tree-read-access'

export type MemberPairInput = TreeReadInput & {
  readonly firstId: string
  readonly secondId: string
}

export type MemberPairError =
  TreeReadError | { readonly kind: 'MEMBER_NOT_FOUND' } | { readonly kind: 'SAME_MEMBER' }

export type MemberPair = {
  readonly family: Family
  readonly first: Member
  readonly second: Member
}

export type MemberPairDeps = {
  readonly trees: TreeReader
  readonly families: FamilyReader
}

/** Two different members of a tree the viewer may read, with the family they belong to. */
export async function readableMemberPair(
  deps: MemberPairDeps,
  input: MemberPairInput,
): Promise<Result<MemberPair, MemberPairError>> {
  const access = await readableTree(deps.trees, input)
  if (!access.ok) return access
  if (input.firstId === input.secondId) return err({ kind: 'SAME_MEMBER' })

  const family = await deps.families.loadFamily(access.value.listing.tree.id)
  const first = family.findMember(MemberId.fromString(input.firstId))
  const second = family.findMember(MemberId.fromString(input.secondId))
  if (!first || !second) return err({ kind: 'MEMBER_NOT_FOUND' })
  return ok({ family, first, second })
}
