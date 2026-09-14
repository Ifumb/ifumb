import type { Member } from '@/core/entities/member'
import type { Filiation, Union } from '@/core/entities/union'
import type { MemberId } from '@/core/shared/value-objects/member-id'

export type ParentUnion = {
  readonly union: Union
  readonly parents: readonly Member[]
  readonly filiation: Filiation
}

export type PartnerUnion = {
  readonly union: Union
  readonly partner: Member | null
  readonly children: readonly { readonly member: Member; readonly filiation: Filiation }[]
}

const SEARCH_LOCALE = 'fr'
const collator = new Intl.Collator(SEARCH_LOCALE, { sensitivity: 'base' })

/** Every member and union of one tree, with the questions a reader asks about them. */
export class Family {
  private readonly membersById: ReadonlyMap<string, Member>

  private constructor(
    members: readonly Member[],
    private readonly unions: readonly Union[],
  ) {
    this.membersById = new Map(members.map((member) => [member.id.value, member]))
    Object.freeze(this)
  }

  static of(members: readonly Member[], unions: readonly Union[]): Family {
    return new Family(members, unions)
  }

  /** Members by first name, then last name, in French collation (the legacy order). */
  members(): Member[] {
    return [...this.membersById.values()].sort(
      (a, b) =>
        collator.compare(a.firstName, b.firstName) ||
        collator.compare(a.lastName ?? '', b.lastName ?? ''),
    )
  }

  /** Case-insensitive search on first name, last name, tribe, ethnicity and clan. */
  search(query: string): Member[] {
    const needle = query.trim().toLocaleLowerCase(SEARCH_LOCALE)
    if (needle === '') return this.members()
    return this.members().filter((member) =>
      member.searchableTexts.some((text) => text.toLocaleLowerCase(SEARCH_LOCALE).includes(needle)),
    )
  }

  findMember(memberId: MemberId): Member | null {
    return this.membersById.get(memberId.value) ?? null
  }

  /** Unions the member was born or adopted into. */
  parentUnionsOf(memberId: MemberId): ParentUnion[] {
    return this.unions.flatMap((union) => {
      const child = union.children.find(({ childId }) => childId.value === memberId.value)
      if (!child) return []
      return [{ union, parents: this.resolve(union.parentIds), filiation: child.filiation }]
    })
  }

  /** Unions in which the member is a parent. */
  partnerUnionsOf(memberId: MemberId): PartnerUnion[] {
    return this.unions
      .filter((union) => union.hasParent(memberId))
      .map((union) => {
        const partnerId = union.otherParentOf(memberId)
        return {
          union,
          partner: partnerId ? this.findMember(partnerId) : null,
          children: union.children.flatMap(({ childId, filiation }) => {
            const member = this.findMember(childId)
            return member ? [{ member, filiation }] : []
          }),
        }
      })
  }

  private resolve(ids: readonly MemberId[]): Member[] {
    return ids.flatMap((id) => {
      const member = this.findMember(id)
      return member ? [member] : []
    })
  }
}
