import type { PartialDate } from '@/core/shared/value-objects/partial-date'
import type { MemberDetails, MemberSummary } from '@/core/use-cases/member-views'
import type { MemberProfile } from '@/core/use-cases/get-member-profile'
import { formatPartialDate, lifespanLabel } from '@/presentation/formatting/partial-date-format'
import { lineageHref, type GraphHref } from '@/presentation/graph/graph-view-urls'
import type { Fact } from '@/presentation/mappers/fact'
import { toPortrait, type PortraitViewModel } from '@/presentation/mappers/portrait'
import type { PhotoSourcePolicy } from '@/presentation/formatting/photo-source'
import { CERTAINTY_LABELS, GENDER_LABELS, NOT_RECORDED } from '@/presentation/labels/member-labels'
import {
  memberLink,
  toParentUnionViewModel,
  toPartnerUnionViewModel,
  type MemberHref,
  type ParentUnionViewModel,
  type PartnerUnionViewModel,
} from '@/presentation/mappers/union-view-models'
import { DEFAULT_LINEAGE_DEPTH } from '@/presentation/schemas/graph-view-schema'

export type MemberListItemViewModel = {
  readonly id: string
  readonly href: MemberHref
  readonly name: string
  readonly nickname: string | null
  readonly lifespan: string | null
  readonly culture: string | null
}

export type MemberProfileViewModel = {
  readonly treeId: string
  readonly memberId: string
  readonly name: string
  readonly nickname: string | null
  readonly tree: { readonly name: string; readonly href: `/tree/${string}` }
  readonly lineageHref: GraphHref
  /** The edit form, for those allowed to change this member. */
  readonly editHref: `${MemberHref}/edit` | null
  /** The deletion confirmation, for the tree's owner only. */
  readonly deleteHref: `${MemberHref}/delete` | null
  /** The photo page, for those allowed to change this member. */
  readonly photoHref: `${MemberHref}/photo` | null
  readonly portrait: PortraitViewModel
  /** The union form with this member as first parent, for the owner only. */
  readonly newUnionHref: `/tree/${string}/unions/new?parent=${string}` | null
  /** "This is me" — shown only when the member is free and the viewer is signed in. */
  readonly canClaim: boolean
  readonly claimedByViewer: boolean
  readonly identity: readonly Fact[]
  readonly datesAndPlaces: readonly Fact[]
  readonly culture: readonly Fact[]
  readonly biography: string | null
  readonly parentUnions: readonly ParentUnionViewModel[]
  readonly partnerUnions: readonly PartnerUnionViewModel[]
}

export function toMemberListItem(treeId: string, member: MemberSummary): MemberListItemViewModel {
  const culture = [member.tribe, member.ethnicity].filter(Boolean).join(' · ')
  return {
    ...memberLink(treeId, member),
    id: member.id,
    nickname: member.nickname,
    lifespan: lifespanLabel(member.birthDate, member.deathDate),
    culture: culture || null,
  }
}

export function toMemberProfileViewModel(
  profile: MemberProfile,
  photos: PhotoSourcePolicy | null = null,
): MemberProfileViewModel {
  const { member, tree } = profile
  return {
    treeId: tree.id,
    memberId: member.id,
    name: memberLink(tree.id, member).name,
    nickname: member.nickname,
    tree: { name: tree.name, href: `/tree/${tree.id}` },
    lineageHref: lineageHref(tree.id, member.id, DEFAULT_LINEAGE_DEPTH),
    ...actionLinks(profile),
    ...claimPermissions(profile),
    portrait: toPortrait(member, member.photoUrl, photos),
    identity: identityFacts(member),
    datesAndPlaces: datesAndPlacesFacts(member),
    culture: cultureFacts(member),
    biography: member.biography,
    parentUnions: profile.parentUnions.map((union) => toParentUnionViewModel(tree.id, union)),
    partnerUnions: profile.partnerUnions.map((union) => toPartnerUnionViewModel(tree.id, union)),
  }
}

/** The pages acting on this member, each only for those allowed to use it. */
function actionLinks({ member, tree, permissions }: MemberProfile) {
  const href = memberLink(tree.id, member).href
  return {
    editHref: permissions.canEdit ? (`${href}/edit` as const) : null,
    deleteHref: permissions.canDelete ? (`${href}/delete` as const) : null,
    photoHref: permissions.canEdit ? (`${href}/photo` as const) : null,
    newUnionHref: permissions.canManageUnions
      ? (`/tree/${tree.id}/unions/new?parent=${encodeURIComponent(member.id)}` as const)
      : null,
  }
}

function claimPermissions({ permissions }: MemberProfile) {
  return { canClaim: permissions.canClaim, claimedByViewer: permissions.claimedByViewer }
}

function identityFacts(member: MemberDetails): Fact[] {
  return [
    fact('Prénom', member.firstName),
    fact('Nom', member.lastName),
    fact('Surnom', member.nickname),
    fact('Genre', member.gender && GENDER_LABELS[member.gender]),
    fact('Certitude', CERTAINTY_LABELS[member.certainty]),
  ]
}

function datesAndPlacesFacts(member: MemberDetails): Fact[] {
  return [
    fact('Naissance', dateLabel(member.birthDate, member.birthDateApprox)),
    fact('Lieu de naissance', member.birthPlace),
    fact('Décès', dateLabel(member.deathDate, false)),
  ]
}

function cultureFacts(member: MemberDetails): Fact[] {
  return [
    fact('Tribu', member.tribe),
    fact('Clan', member.clan),
    fact('Ethnie', member.ethnicity),
    fact('Région d’origine', member.originRegion),
  ]
}

function dateLabel(date: PartialDate | null, approximate: boolean): string | null {
  return date ? formatPartialDate(date, { approximate }) : null
}

function fact(term: string, detail: string | null): Fact {
  return { term, detail: detail || NOT_RECORDED }
}
