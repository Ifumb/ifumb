import { describe, expect, it } from 'vitest'
import type { MemberProfile } from '@/core/use-cases/get-member-profile'
import type { MemberSummary } from '@/core/use-cases/member-views'
import {
  toMemberListItem,
  toMemberProfileViewModel,
} from '@/presentation/mappers/member-view-models'
import { unionDatesLabel } from '@/presentation/mappers/union-view-models'
import { dateOf } from '@tests/support/family-fixtures'

const summary: MemberSummary = {
  id: 'mbr_awa',
  firstName: 'Awa',
  lastName: 'Diallo',
  nickname: null,
  birthDate: dateOf('1932'),
  birthDateApprox: false,
  deathDate: null,
  tribe: 'Peul',
  ethnicity: null,
}

const profile: MemberProfile = {
  tree: { id: 'tree_1', name: 'Famille Diallo', isPublic: false },
  member: {
    id: 'mbr_awa',
    firstName: 'Awa',
    lastName: null,
    nickname: null,
    gender: 'FEMALE',
    birthDate: dateOf('1932-05'),
    birthDateApprox: true,
    deathDate: null,
    birthPlace: null,
    tribe: 'Peul',
    clan: null,
    ethnicity: null,
    originRegion: null,
    biography: null,
    certainty: 'APPROXIMATE',
    photoUrl: null,
  },
  parentUnions: [],
  partnerUnions: [
    {
      id: 'uni_1',
      type: 'MARRIAGE',
      startDate: dateOf('1955'),
      endDate: null,
      partner: { id: 'mbr_moussa', firstName: 'Moussa', lastName: 'Diallo' },
      children: [
        { person: { id: 'mbr_fatou', firstName: 'Fatou', lastName: null }, filiation: 'ADOPTIVE' },
      ],
    },
  ],
  permissions: {
    canEdit: false,
    canDelete: false,
    canManageUnions: false,
    canClaim: false,
    claimedByViewer: false,
  },
}

describe('member view models', () => {
  it('turns a summary into a list item linking to the profile', () => {
    expect(toMemberListItem('tree_1', summary)).toEqual({
      id: 'mbr_awa',
      href: '/tree/tree_1/member/mbr_awa',
      name: 'Awa Diallo',
      nickname: null,
      lifespan: '1932 –',
      culture: 'Peul',
    })
  })

  it('writes unknown facts as "Non renseigné" and labels known ones in French', () => {
    const { identity, datesAndPlaces } = toMemberProfileViewModel(profile)

    expect([...identity, ...datesAndPlaces]).toEqual([
      { term: 'Prénom', detail: 'Awa' },
      { term: 'Nom', detail: 'Non renseigné' },
      { term: 'Surnom', detail: 'Non renseigné' },
      { term: 'Genre', detail: 'Féminin' },
      { term: 'Certitude', detail: 'Approximative' },
      { term: 'Naissance', detail: 'vers mai 1932' },
      { term: 'Lieu de naissance', detail: 'Non renseigné' },
      { term: 'Décès', detail: 'Non renseigné' },
    ])
  })

  it.each([
    [
      { canEdit: false, canDelete: false, canManageUnions: false, canClaim: false, claimedByViewer: false },
      null,
      null,
      null,
    ],
    [
      { canEdit: true, canDelete: false, canManageUnions: false, canClaim: false, claimedByViewer: false },
      '/tree/tree_1/member/mbr_awa/edit',
      null,
      null,
    ],
    [
      { canEdit: true, canDelete: true, canManageUnions: true, canClaim: false, claimedByViewer: false },
      '/tree/tree_1/member/mbr_awa/edit',
      '/tree/tree_1/member/mbr_awa/delete',
      '/tree/tree_1/unions/new?parent=mbr_awa',
    ],
  ])(
    'offers only the permitted actions for %o',
    (permissions, editHref, deleteHref, newUnionHref) => {
      expect(toMemberProfileViewModel({ ...profile, permissions })).toMatchObject({
        editHref,
        deleteHref,
        newUnionHref,
        photoHref: editHref && '/tree/tree_1/member/mbr_awa/photo',
      })
    },
  )

  it('describes partner unions with links, dates and filiation', () => {
    const [union] = toMemberProfileViewModel(profile).partnerUnions

    expect(union).toEqual({
      id: 'uni_1',
      href: '/tree/tree_1/union/uni_1',
      typeLabel: 'Mariage',
      datesLabel: 'depuis 1955',
      partner: { href: '/tree/tree_1/member/mbr_moussa', name: 'Moussa Diallo' },
      children: [
        { href: '/tree/tree_1/member/mbr_fatou', name: 'Fatou', filiationLabel: 'Adoptif' },
      ],
    })
  })

  it.each([
    [dateOf('1980'), dateOf('1995'), '1980 – 1995'],
    [null, dateOf('1995'), 'jusqu’en 1995'],
    [null, null, null],
  ])('labels union dates from %o to %o', (start, end, label) => {
    expect(unionDatesLabel(start, end)).toBe(label)
  })
})
