import 'server-only'
import type { Member } from '@/core/entities/member'
import type { MemberId } from '@/core/shared/value-objects/member-id'

/** Write side of members. */
export interface MemberWriter {
  insert(treeId: string, member: Member): Promise<void>
  /** Stores the editable details of an existing member. */
  update(member: Member): Promise<void>
  /** Removes the member and its links as a child; unions keep their other people. */
  delete(memberId: MemberId): Promise<void>
}
