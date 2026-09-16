import 'server-only'
import type { Family } from '@/core/entities/family'
import type { Tree } from '@/core/entities/tree'
import type { Union, UnionDetailsInput, UnionType } from '@/core/entities/union'
import { canManageUnions } from '@/core/entities/union-access'
import { writeMode, type WriteMode } from '@/core/entities/contribution-access'
import { err, ok, type Result } from '@/core/shared/result'
import { MemberId } from '@/core/shared/value-objects/member-id'
import type { PartialDate } from '@/core/shared/value-objects/partial-date'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import { readableTree, type TreeReadError } from '@/core/use-cases/tree-read-access'

export type FamilyTarget = { readonly treeId: string; readonly viewerId: string }

export type UnionTarget = FamilyTarget & { readonly unionId: string }

/** Union details as a form submits them: people by id. */
export type UnionDetailsEntry = {
  readonly type: UnionType
  readonly parent1Id: string
  readonly parent2Id: string | null
  readonly startDate: PartialDate | null
  readonly endDate: PartialDate | null
}

export type UnionManagementError = TreeReadError | { readonly kind: 'UNION_MANAGEMENT_FORBIDDEN' }

export type UnionWriteError = UnionManagementError | { readonly kind: 'UNION_NOT_FOUND' }

export type ManageableFamily = {
  readonly tree: Tree
  readonly family: Family
  /** 'apply' when the viewer writes directly; 'propose' when an editor's change goes to the owner. */
  readonly mode: Exclude<WriteMode, 'forbidden'>
}

export type FamilyDeps = { readonly trees: TreeReader; readonly families: FamilyReader }

/** The family of a tree, and whether the viewer writes its unions directly or only proposes to. */
export async function manageableFamily(
  deps: FamilyDeps,
  target: FamilyTarget,
): Promise<Result<ManageableFamily, UnionManagementError>> {
  const access = await readableTree(deps.trees, target)
  if (!access.ok) return access
  const mode = writeMode(access.value.role, canManageUnions(access.value.role))
  if (mode === 'forbidden') return err({ kind: 'UNION_MANAGEMENT_FORBIDDEN' })

  const { tree } = access.value.listing
  return ok({ tree, family: await deps.families.loadFamily(tree.id), mode })
}

/** A union of such a family; the right to manage is checked before the union is looked up. */
export async function manageableUnion(
  deps: FamilyDeps,
  target: UnionTarget,
): Promise<Result<ManageableFamily & { readonly union: Union }, UnionWriteError>> {
  const found = await manageableFamily(deps, target)
  if (!found.ok) return found
  const union = found.value.family.findUnion(target.unionId)
  return union ? ok({ ...found.value, union }) : err({ kind: 'UNION_NOT_FOUND' })
}

export function unionDetailsFrom(entry: UnionDetailsEntry): UnionDetailsInput {
  return {
    ...entry,
    parent1Id: MemberId.fromString(entry.parent1Id),
    parent2Id: entry.parent2Id ? MemberId.fromString(entry.parent2Id) : null,
  }
}
