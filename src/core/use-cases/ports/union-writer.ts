import 'server-only'
import type { Union, UnionChild } from '@/core/entities/union'
import type { MemberId } from '@/core/shared/value-objects/member-id'

/** A child linked to a union, under the id of the link itself. */
export type UnionChildLink = UnionChild & { readonly id: string }

/** Write side of unions. */
export interface UnionWriter {
  /** Stores a new union and its parents; children are linked afterwards. */
  insert(treeId: string, union: Union): Promise<void>
  /** Stores the type, dates and parents of an existing union. */
  update(union: Union): Promise<void>
  /** Removes the union and, with it, the links of its children. */
  delete(unionId: string): Promise<void>
  addChild(unionId: string, link: UnionChildLink): Promise<void>
  removeChild(unionId: string, childId: MemberId): Promise<void>
}
