import { beforeEach, describe, expect, it } from 'vitest'
import {
  ExplorePublicTreesUseCase,
  PUBLIC_TREES_PAGE_SIZE,
} from '@/core/use-cases/explore-public-trees'
import { SearchPublicMembersUseCase } from '@/core/use-cases/search-public-members'
import { InMemoryPublicMemberDirectory } from '@/infrastructure/persistence/in-memory/in-memory-public-member-directory'
import { InMemoryPublicTreeCatalog } from '@/infrastructure/persistence/in-memory/in-memory-public-tree-catalog'
import { aPublicMember, aPublicTree } from '@tests/support/explore-fixtures'

describe('ExplorePublicTreesUseCase', () => {
  let catalog: InMemoryPublicTreeCatalog
  let explore: ExplorePublicTreesUseCase

  beforeEach(() => {
    catalog = new InMemoryPublicTreeCatalog()
    explore = new ExplorePublicTreesUseCase({ catalog })
  })

  it('lists public trees for the requested page', async () => {
    catalog.seed(
      Array.from({ length: PUBLIC_TREES_PAGE_SIZE + 1 }, (_, index) =>
        aPublicTree({ id: `tree_${index}` }),
      ),
    )

    const { trees } = await explore.execute({ page: 2 })

    expect([trees.items.map((tree) => tree.id), trees.total, trees.totalPages]).toEqual([
      [`tree_${PUBLIC_TREES_PAGE_SIZE}`],
      PUBLIC_TREES_PAGE_SIZE + 1,
      2,
    ])
  })

  it('passes trimmed criteria and ignores blank ones', async () => {
    catalog.seed([aPublicTree()])

    const { criteria } = await explore.execute({ text: '  Diallo ', tribe: ' ', page: 1 })

    expect([criteria, catalog.lastCriteria]).toEqual([{ text: 'Diallo' }, { text: 'Diallo' }])
  })

  it('combines every criterion', async () => {
    catalog.seed([
      aPublicTree({ id: 'both', tribes: ['Peul'], ethnicities: ['Wolof'] }),
      aPublicTree({ id: 'tribe_only', tribes: ['Peul'] }),
    ])

    const { trees } = await explore.execute({ tribe: 'peul', ethnicity: 'wolof', page: 1 })

    expect(trees.items.map((tree) => tree.id)).toEqual(['both'])
  })

  it('offers distinct tribes and ethnicities from all public trees, in French order', async () => {
    catalog.seedCulturalValues({ tribes: ['Peul, Éwé', null, 'Bambara'], ethnicities: ['Wolof'] })

    const { facets } = await explore.execute({ page: 1 })

    expect(facets).toEqual({ tribes: ['Bambara', 'Éwé', 'Peul'], ethnicities: ['Wolof'] })
  })
})

describe('SearchPublicMembersUseCase', () => {
  let directory: InMemoryPublicMemberDirectory
  let search: SearchPublicMembersUseCase

  beforeEach(() => {
    directory = new InMemoryPublicMemberDirectory()
    directory.seed([
      aPublicMember({ id: 'mbr_awa', firstName: 'Awa', tribes: ['Peul'] }),
      aPublicMember({ id: 'mbr_moussa', firstName: 'Moussa', originRegion: 'Fouta' }),
    ])
    search = new SearchPublicMembersUseCase({ directory })
  })

  it.each([undefined, '', '   '])(
    'returns an empty page without searching for %o',
    async (query) => {
      const result = await search.execute({ query, page: 1 })

      expect([result.query, result.members.total, directory.searchCount]).toEqual([null, 0, 0])
    },
  )

  it('returns the matching public members for the requested page', async () => {
    const result = await search.execute({ query: ' fouta ', page: 1 })

    expect([result.query, result.members.items.map((member) => member.id)]).toEqual([
      'fouta',
      ['mbr_moussa'],
    ])
  })
})
