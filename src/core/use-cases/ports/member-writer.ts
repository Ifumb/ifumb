import 'server-only'
import type { Member } from '@/core/entities/member'
import type { MemberId } from '@/core/shared/value-objects/member-id'

/** Write side of members. */
export interface MemberWriter {
  insert(treeId: string, member: Member): Promise<void>
  /** Stores the editable details of an existing member. */
  update(member: Member): Promise<void>
  /** Points the member at another photo, or at none. */
  updatePhoto(memberId: MemberId, photoUrl: string | null): Promise<void>
  /** Removes the member and its links as a child; unions keep their other people. */
  delete(memberId: MemberId): Promise<void>
  /** Records who claimed this member ("this is me"). */
  claim(memberId: MemberId, userId: string): Promise<void>
  /** Records whether strangers may find this member through global search (module 3.1). */
  updateDiscoverable(memberId: MemberId, discoverable: boolean): Promise<void>
}
