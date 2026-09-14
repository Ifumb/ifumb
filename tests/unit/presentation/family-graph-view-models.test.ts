import { describe, expect, it } from 'vitest'
import type { FamilyGraph, GraphMember } from '@/core/use-cases/family-graph-views'
import { memberPhotoSource } from '@/infrastructure/config/member-photos'
import {
  pendingBadge,
  photoSource,
  toMemberNodeData,
  toUnlaidGraph,
} from '@/presentation/graph/family-graph-view-models'
import { dateOf } from '@tests/support/family-fixtures'

const PHOTOS = memberPhotoSource('https://project.supabase.co')
const PHOTO_URL = 'https://project.supabase.co/storage/v1/object/public/member-photos/t/awa.jpg'

function aGraphMember(overrides: Partial<GraphMember> = {}): GraphMember {
  return {
    id: 'mbr_awa',
    firstName: 'awa',
    lastName: 'Diallo',
    nickname: null,
    birthDate: dateOf('1932'),
    birthDateApprox: false,
    deathDate: dateOf('2001'),
    tribe: 'Peul, Malinké',
    ethnicity: null,
    gender: 'FEMALE',
    certainty: 'APPROXIMATE',
    photoUrl: null,
    tribes: ['Peul', 'Malinké'],
    ethnicities: [],
    generation: 1,
    relativeGeneration: null,
    pendingAction: null,
    ...overrides,
  }
}

describe('toMemberNodeData', () => {
  it('describes the member card', () => {
    expect(toMemberNodeData('tree_1', aGraphMember(), PHOTOS)).toEqual({
      kind: 'member',
      name: 'awa Diallo',
      href: '/tree/tree_1/member/mbr_awa',
      initial: 'A',
      lifespan: '1932 – 2001',
      tribesLabel: 'Peul, Malinké',
      photoSrc: null,
      approximate: true,
      pending: null,
      relativeGenerationLabel: null,
      tribes: ['Peul', 'Malinké'],
      ethnicities: [],
      gender: 'FEMALE',
      generation: 1,
    })
  })

  it('has no tribe label when none is recorded', () => {
    expect(toMemberNodeData('tree_1', aGraphMember({ tribes: [] }), PHOTOS).tribesLabel).toBeNull()
  })

  it('keeps a photo from the member photos bucket', () => {
    const data = toMemberNodeData('tree_1', aGraphMember({ photoUrl: PHOTO_URL }), PHOTOS)

    expect(data.photoSrc).toBe(PHOTO_URL)
  })
})

describe('photoSource', () => {
  it.each([
    ['another host', 'https://evil.example/storage/v1/object/public/member-photos/a.jpg'],
    ['another bucket', 'https://project.supabase.co/storage/v1/object/public/other/a.jpg'],
    ['a malformed URL', 'not a url'],
  ])('drops a photo from %s', (_, url) => {
    expect(photoSource(url, PHOTOS)).toBeNull()
  })

  it('drops every photo when no source is configured', () => {
    expect(photoSource(PHOTO_URL, null)).toBeNull()
  })
})

describe('memberPhotoSource', () => {
  it.each([undefined, '', 'http://project.supabase.co', 'nope'])('is null for %o', (url) => {
    expect(memberPhotoSource(url)).toBeNull()
  })
})

describe('pendingBadge', () => {
  it.each([
    ['UPDATE', { label: 'En attente', tone: 'pending' }],
    ['CREATE', { label: 'En attente', tone: 'pending' }],
    ['DELETE', { label: 'Suppression en attente', tone: 'deletion' }],
    [null, null],
  ] as const)('labels %s', (action, badge) => {
    expect(pendingBadge(action)).toEqual(badge)
  })
})

describe('toUnlaidGraph', () => {
  const graph: FamilyGraph = {
    tree: { id: 'tree_1', name: 'Famille Diallo' },
    people: [],
    lineage: null,
    members: [aGraphMember({ id: 'mbr_p' }), aGraphMember({ id: 'mbr_c' })],
    unions: [
      {
        id: 'uni_1',
        type: 'PARTNERSHIP',
        parentIds: ['mbr_p'],
        children: [{ childId: 'mbr_c', filiation: 'BIOLOGICAL' }],
        pendingAction: 'DELETE',
      },
    ],
  }

  it('creates a node per member and per union', () => {
    const { nodes } = toUnlaidGraph(graph, null)

    expect(nodes.map((node) => node.id)).toEqual(['member_mbr_p', 'member_mbr_c', 'union_uni_1'])
    expect(nodes[2]?.data).toEqual({
      kind: 'union',
      typeLabel: 'Union libre',
      icon: 'rings',
      pending: { label: 'Suppression en attente', tone: 'deletion' },
    })
  })

  it('links parents to the union and the union to its children', () => {
    expect(toUnlaidGraph(graph, null).edges).toEqual([
      { id: 'edge_parent_uni_1_mbr_p', source: 'member_mbr_p', target: 'union_uni_1' },
      { id: 'edge_child_uni_1_mbr_c', source: 'union_uni_1', target: 'member_mbr_c' },
    ])
  })
})
