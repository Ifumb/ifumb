import 'server-only'
import { pageOf, type Page } from '@/core/shared/page'
import type { PageRequest } from '@/core/shared/value-objects/page-request'
import type {
  PublicTreeCriteria,
  PublicTreeSummary,
  RawCulturalValues,
} from '@/core/use-cases/explore-views'
import type { PublicTreeCatalog } from '@/core/use-cases/ports/public-tree-catalog'

/** Test double of the public tree catalog; trees are seeded in listing order. */
export class InMemoryPublicTreeCatalog implements PublicTreeCatalog {
  private trees: readonly PublicTreeSummary[] = []
  private values: RawCulturalValues = { tribes: [], ethnicities: [] }
  lastCriteria: PublicTreeCriteria | null = null

  seed(trees: readonly PublicTreeSummary[]): void {
    this.trees = trees
  }

  seedCulturalValues(values: RawCulturalValues): void {
    this.values = values
  }

  async search(criteria: PublicTreeCriteria, page: PageRequest): Promise<Page<PublicTreeSummary>> {
    this.lastCriteria = criteria
    const matching = this.trees.filter((tree) => matches(tree, criteria))
    return pageOf(matching.slice(page.offset, page.offset + page.size), matching.length, page)
  }

  async culturalValues(): Promise<RawCulturalValues> {
    return this.values
  }
}

function matches(tree: PublicTreeSummary, { text, tribe, ethnicity }: PublicTreeCriteria) {
  const texts = [tree.name, tree.owner.firstName, tree.owner.lastName]
  return (
    containedIn(texts, text) &&
    containedIn(tree.tribes, tribe) &&
    containedIn(tree.ethnicities, ethnicity)
  )
}

function containedIn(values: readonly string[], needle: string | undefined): boolean {
  if (needle === undefined) return true
  return values.some((value) =>
    value.toLocaleLowerCase('fr').includes(needle.toLocaleLowerCase('fr')),
  )
}
