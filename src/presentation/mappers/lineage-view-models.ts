import type { LineageDepth } from '@/core/entities/lineage'
import type { LineageView } from '@/core/use-cases/family-graph-views'
import { graphHref, lineageHref, type GraphHref } from '@/presentation/graph/graph-view-urls'
import { memberLink, type MemberLink } from '@/presentation/mappers/union-view-models'
import { MAX_LINEAGE_GENERATIONS } from '@/presentation/schemas/graph-view-schema'

/** A way to change the lineage view; `href` is null when it would change nothing. */
export type LineageAction = { readonly label: string; readonly href: GraphHref | null }

export type LineageBannerViewModel = {
  readonly pivot: MemberLink
  readonly rangeLabel: string
  readonly noDescendantsMessage: string | null
  readonly actions: readonly LineageAction[]
  readonly quitHref: GraphHref
}

export function toLineageBannerViewModel(
  treeId: string,
  lineage: LineageView,
): LineageBannerViewModel {
  const pivot = memberLink(treeId, lineage.pivot)
  return {
    pivot,
    rangeLabel: `Générations affichées : de ${signed(-lineage.ancestors)} à ${signed(lineage.descendants)}.`,
    noDescendantsMessage: lineage.hasDescendants
      ? null
      : `${pivot.name} n’a pas de descendant enregistré dans cet arbre.`,
    actions: lineageActions(treeId, lineage),
    quitHref: graphHref(treeId),
  }
}

function lineageActions(treeId: string, lineage: LineageView): LineageAction[] {
  const { ancestors, descendants, deepestDescendantShown } = lineage
  const to = (depth: LineageDepth) => lineageHref(treeId, lineage.pivot.id, depth)
  const canGrow = (generations: number) => generations < MAX_LINEAGE_GENERATIONS
  const fewer = Math.max(0, deepestDescendantShown - 1)
  return [
    {
      label: 'Une génération d’ancêtres de plus',
      href: canGrow(ancestors) ? to({ ancestors: ancestors + 1, descendants }) : null,
    },
    {
      label: 'Une génération de descendants de plus',
      href: canGrow(descendants) ? to({ ancestors, descendants: descendants + 1 }) : null,
    },
    {
      label: 'Une génération de descendants de moins',
      href: descendants > 0 ? to({ ancestors, descendants: fewer }) : null,
    },
  ]
}

/** "Pivot" for the pivot itself, "+2" below it, "−1" above it; null outside a lineage view. */
export function relativeGenerationLabel(relative: number | null, isPivot: boolean): string | null {
  if (isPivot) return 'Pivot'
  return relative === null ? null : signed(relative)
}

function signed(value: number): string {
  if (value > 0) return `+${value}`
  return value < 0 ? `−${-value}` : '0'
}
