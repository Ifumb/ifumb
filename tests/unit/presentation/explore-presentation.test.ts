import { describe, expect, it } from 'vitest'
import { pageOf } from '@/core/shared/page'
import { PageRequest } from '@/core/shared/value-objects/page-request'
import { exploreMembersHref, exploreTreesHref } from '@/presentation/explore/explore-urls'
import {
  toMemberSearchViewModel,
  toTreeExplorationViewModel,
} from '@/presentation/mappers/explore-view-models'
import { toPaginationViewModel } from '@/presentation/mappers/pagination-view-models'
import {
  isRefinedTreeSearch,
  parsePublicMemberSearch,
  parsePublicTreeSearch,
} from '@/presentation/schemas/explore-schema'
import { dateOf } from '@tests/support/family-fixtures'
import { aPublicMember, aPublicTree } from '@tests/support/explore-fixtures'

describe('parsePublicTreeSearch', () => {
  it('reads the criteria and the page', () => {
    expect(
      parsePublicTreeSearch({ q: ' Diallo ', tribe: 'Peul', ethnicity: ['Wolof', 'x'], page: '3' }),
    ).toEqual({
      text: 'Diallo',
      tribe: 'Peul',
      ethnicity: 'Wolof',
      page: 3,
    })
  })

  it.each(['0', '-2', 'deux', '1.5', '99999'])('falls back to the first page for %s', (page) => {
    expect(parsePublicTreeSearch({ page })).toEqual({ page: 1 })
  })

  it('drops blank criteria and cuts long ones', () => {
    const search = parsePublicTreeSearch({ q: '   ', tribe: 'x'.repeat(150) })

    expect([search.text, search.tribe?.length]).toEqual([undefined, 100])
  })

  it.each([
    [{ page: 1 }, false],
    [{ page: 2 }, true],
    [{ page: 1, tribe: 'Peul' }, true],
  ])('tells whether %o is refined: %s', (search, refined) => {
    expect(isRefinedTreeSearch(search)).toBe(refined)
  })
})

describe('parsePublicMemberSearch', () => {
  it('reads the query and the page', () => {
    expect(parsePublicMemberSearch({ q: 'awa', page: '2' })).toEqual({ query: 'awa', page: 2 })
    expect(parsePublicMemberSearch({})).toEqual({ page: 1 })
  })
})

describe('explore URLs', () => {
  it('keep the criteria, and leave the first page and blank values out', () => {
    expect([
      exploreTreesHref({ page: 1 }),
      exploreTreesHref({ text: 'Sow Diallo', tribe: 'Peul', page: 2 }),
      exploreMembersHref({ page: 1 }),
      exploreMembersHref({ query: 'awa', page: 3 }),
    ]).toEqual([
      '/explore',
      '/explore?q=Sow+Diallo&tribe=Peul&page=2',
      '/explore/members',
      '/explore/members?q=awa&page=3',
    ])
  })
})

describe('toPaginationViewModel', () => {
  const href = (page: number) => `/explore?page=${page}` as const

  it('is absent when everything fits on one page', () => {
    expect(toPaginationViewModel(pageOf([], 20, PageRequest.of(1, 20)), href)).toBeNull()
  })

  it('links to the previous and next pages', () => {
    expect(toPaginationViewModel(pageOf([], 60, PageRequest.of(2, 20)), href)).toEqual({
      label: 'Page 2 sur 3',
      previousHref: '/explore?page=1',
      nextHref: '/explore?page=3',
    })
  })

  it('has no previous link on the first page, and no next link on the last', () => {
    const first = toPaginationViewModel(pageOf([], 40, PageRequest.of(1, 20)), href)
    const last = toPaginationViewModel(pageOf([], 40, PageRequest.of(2, 20)), href)

    expect([first?.previousHref, last?.nextHref]).toEqual([null, null])
  })

  it('leads back to the last page from a page beyond it', () => {
    expect(toPaginationViewModel(pageOf([], 40, PageRequest.of(9, 20)), href)?.previousHref).toBe(
      '/explore?page=1',
    )
  })
})

describe('toTreeExplorationViewModel', () => {
  const tree = aPublicTree({
    description: 'Des Fouta au Sine',
    memberCount: 1,
    tribes: ['Peul', 'Malinké', 'Bambara'],
    ethnicities: ['Wolof', 'Sérère'],
  })
  const exploration = {
    criteria: { tribe: 'Peul' },
    trees: pageOf([tree], 21, PageRequest.of(1, 20)),
    facets: { tribes: ['Peul'], ethnicities: [] },
  }

  it('describes each tree card with at most four cultural tags', () => {
    expect(toTreeExplorationViewModel(exploration).trees).toEqual([
      {
        id: 'tree_diallo',
        href: '/tree/tree_diallo',
        name: 'Famille Diallo',
        byline: 'par Awa Diallo · 1 membre',
        description: 'Des Fouta au Sine',
        tags: ['Wolof', 'Sérère', 'Peul', 'Malinké'],
      },
    ])
  })

  it('counts the trees, offers the facets and pages with the criteria kept', () => {
    const viewModel = toTreeExplorationViewModel(exploration)

    expect(viewModel).toMatchObject({
      status: '21 arbres trouvés.',
      hasCriteria: true,
      tribeOptions: [{ value: 'Peul', label: 'Peul' }],
      ethnicityOptions: [],
      pagination: { nextHref: '/explore?tribe=Peul&page=2' },
    })
  })

  it.each([
    [{}, 'Aucun arbre public disponible pour l’instant.'],
    [{ text: 'Sow' }, 'Aucun arbre ne correspond à ces critères.'],
  ])('explains an empty listing for %o', (criteria, status) => {
    const empty = { ...exploration, criteria, trees: pageOf([], 0, PageRequest.of(1, 20)) }

    expect(toTreeExplorationViewModel(empty).status).toBe(status)
  })
})

describe('toMemberSearchViewModel', () => {
  const member = aPublicMember({
    birthDate: dateOf('1932-05-12'),
    birthPlace: 'Labé',
    tribes: ['Peul'],
    originRegion: 'Fouta',
  })

  it('describes each member with a link to the profile and to the tree', () => {
    const viewModel = toMemberSearchViewModel({
      query: 'awa',
      members: pageOf([member], 1, PageRequest.of(1, 20)),
    })

    expect(viewModel).toEqual({
      query: 'awa',
      status: '1 membre trouvé pour « awa ».',
      members: [
        {
          href: '/tree/tree_diallo/member/mbr_awa',
          name: 'Awa Diallo',
          details: 'Né(e) en 1932 · Labé · Peul · Fouta',
          tree: { name: 'Famille Diallo', href: '/tree/tree_diallo' },
        },
      ],
      pagination: null,
    })
  })

  it.each([
    [null, 0, 'Saisissez un nom, une tribu ou une région pour commencer.'],
    ['zzz', 0, 'Aucun membre trouvé pour « zzz ».'],
    ['a', 45, '45 membres trouvés pour « a ».'],
  ])('reports the search for %s with %i results', (query, total, status) => {
    const members = pageOf([], total, PageRequest.of(1, 20))

    expect(toMemberSearchViewModel({ query, members }).status).toBe(status)
  })

  it('has no details line when nothing is recorded', () => {
    const viewModel = toMemberSearchViewModel({
      query: 'awa',
      members: pageOf([aPublicMember()], 1, PageRequest.of(1, 20)),
    })

    expect(viewModel.members[0]?.details).toBeNull()
  })
})
