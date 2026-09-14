import type { PublicMemberSummary, PublicTreeSummary } from '@/core/use-cases/explore-views'

export function aPublicTree(overrides: Partial<PublicTreeSummary> = {}): PublicTreeSummary {
  return {
    id: 'tree_diallo',
    name: 'Famille Diallo',
    description: null,
    owner: { firstName: 'Awa', lastName: 'Diallo' },
    memberCount: 3,
    tribes: [],
    ethnicities: [],
    ...overrides,
  }
}

export function aPublicMember(overrides: Partial<PublicMemberSummary> = {}): PublicMemberSummary {
  return {
    id: 'mbr_awa',
    firstName: 'Awa',
    lastName: 'Diallo',
    birthDate: null,
    birthPlace: null,
    tribes: [],
    ethnicities: [],
    clan: null,
    originRegion: null,
    tree: { id: 'tree_diallo', name: 'Famille Diallo' },
    ...overrides,
  }
}
