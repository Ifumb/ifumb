import Form from 'next/form'
import Link from 'next/link'
import { Button } from '@/presentation/components/ui/button'
import { LabelledSelect } from '@/presentation/components/ui/labelled-select'
import { SearchField } from '@/presentation/components/ui/search-field'
import type {
  PublicTreeCardViewModel,
  TreeExplorationViewModel,
} from '@/presentation/mappers/explore-view-models'
import { EXPLORE_PARAMS as P } from '@/presentation/schemas/explore-schema'
import { PaginationView } from '@/presentation/views/pagination-view'

type ExplorationProps = Readonly<{ exploration: TreeExplorationViewModel }>

export function PublicTreeExplorationView({ exploration }: ExplorationProps) {
  return (
    <section aria-labelledby="public-trees-title" className="space-y-6">
      <h2 id="public-trees-title" className="text-2xl font-bold">
        Arbres publics
      </h2>
      <PublicTreeSearchForm exploration={exploration} />
      <p role="status">{exploration.status}</p>
      {exploration.trees.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {exploration.trees.map((tree) => (
            <PublicTreeCard key={tree.id} tree={tree} />
          ))}
        </ul>
      )}
      {exploration.pagination && <PaginationView pagination={exploration.pagination} />}
    </section>
  )
}

function PublicTreeSearchForm({ exploration }: ExplorationProps) {
  const { filters } = exploration
  return (
    <Form action="/explore" role="search" className="flex flex-wrap items-end gap-3">
      <SearchField
        id="explore-trees-text"
        name={P.text}
        label="Rechercher un arbre ou un propriétaire"
        defaultValue={filters.text}
      />
      <CulturalFilters exploration={exploration} />
      <Button type="submit" variant="secondary">
        Rechercher
      </Button>
      {exploration.hasCriteria && (
        <Link href="/explore" className="inline-flex min-h-11 items-center">
          Réinitialiser
        </Link>
      )}
    </Form>
  )
}

/** A filter with no value to choose from is left out rather than shown empty. */
function CulturalFilters({ exploration }: ExplorationProps) {
  return culturalFilterFields(exploration)
    .filter((field) => field.options.length > 0)
    .map(({ key, value, ...field }) => (
      <LabelledSelect
        key={key}
        id={`explore-trees-${key}`}
        name={key}
        defaultValue={value}
        {...field}
      />
    ))
}

function culturalFilterFields({
  filters,
  tribeOptions,
  ethnicityOptions,
}: TreeExplorationViewModel) {
  return [
    {
      key: P.tribe,
      label: 'Tribu',
      placeholder: 'Toutes les tribus',
      options: tribeOptions,
      value: filters.tribe,
    },
    {
      key: P.ethnicity,
      label: 'Ethnie',
      placeholder: 'Toutes les ethnies',
      options: ethnicityOptions,
      value: filters.ethnicity,
    },
  ]
}

function PublicTreeCard({ tree }: Readonly<{ tree: PublicTreeCardViewModel }>) {
  return (
    <li className="space-y-2 rounded-lg border border-earth-sand bg-white p-4">
      <h3 className="text-lg font-semibold">
        <Link href={tree.href}>{tree.name}</Link>
      </h3>
      <p className="text-sm text-earth-bark">{tree.byline}</p>
      {tree.description && <p className="line-clamp-2">{tree.description}</p>}
      {tree.tags.length > 0 && <p className="text-sm">Cultures : {tree.tags.join(', ')}</p>}
    </li>
  )
}
