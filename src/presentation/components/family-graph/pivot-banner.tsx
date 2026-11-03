import { Icon } from '@/presentation/components/ui/icon'
import type { LineagePivotViewModel } from '@/presentation/graph/family-graph-types'
import { signed } from '@/presentation/mappers/lineage-view-models'
import { MAX_LINEAGE_GENERATIONS } from '@/presentation/schemas/graph-view-schema'

const BUTTON_CLASS_NAMES =
  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-violet-100 hover:bg-violet-200 text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

export type PivotBannerProps = Readonly<{
  pivot: LineagePivotViewModel
  pending: boolean
  onExpandAncestors: () => void
  onExpandDescendants: () => void
  onCollapseDescendants: () => void
  onQuit: () => void
}>

/** The legacy pivot banner (module: pivot parity): a persistent bar above the graph, not a
 * results card — each action moves the generation window in place, never a page navigation. */
export function PivotBanner({
  pivot,
  pending,
  onExpandAncestors,
  onExpandDescendants,
  onCollapseDescendants,
  onQuit,
}: PivotBannerProps) {
  const rangeLabel = `gen ${signed(-pivot.ancestors)} à ${signed(pivot.descendants)}`
  return (
    <div
      role="region"
      aria-label={`Pivot : ${pivot.memberName}`}
      aria-busy={pending || undefined}
      className="flex flex-col"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-violet-200 bg-violet-50 px-4 py-2 text-xs text-violet-800">
        <Icon name="lineage" size={13} className="shrink-0" />
        <span className="font-semibold">{pivot.memberName}</span>
        <span className="text-violet-500">·</span>
        <span className="text-violet-600">{rangeLabel}</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onExpandAncestors}
            disabled={pending || pivot.ancestors >= MAX_LINEAGE_GENERATIONS}
            className={BUTTON_CLASS_NAMES}
          >
            <Icon name="up" size={12} />
            ancêtres
          </button>
          <button
            type="button"
            onClick={onExpandDescendants}
            disabled={pending || pivot.descendants >= MAX_LINEAGE_GENERATIONS}
            className={BUTTON_CLASS_NAMES}
          >
            <Icon name="down" size={12} />
            +1 gen
          </button>
          <button
            type="button"
            onClick={onCollapseDescendants}
            disabled={pending || pivot.deepestDescendantShown <= 0}
            className={BUTTON_CLASS_NAMES}
          >
            <Icon name="up" size={12} />
            −1 gen
          </button>
          <button
            type="button"
            onClick={onQuit}
            disabled={pending}
            className="ml-1 flex items-center gap-0.5 rounded bg-violet-600 px-2 py-0.5 text-[11px] font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
          >
            <Icon name="close" size={10} />
            Quitter
          </button>
        </div>
      </div>
      {!pivot.hasDescendants && (
        <p className="border-b border-violet-100 bg-violet-50 py-1 text-center text-xs text-earth-bark italic">
          {pivot.memberName} n’a pas de descendants enregistrés dans cet arbre.
        </p>
      )}
    </div>
  )
}
