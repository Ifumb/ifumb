import { Icon } from '@/presentation/components/ui/icon'
import Form from 'next/form'
import { CommonAncestorsPanel } from '@/presentation/components/family-graph/common-ancestors-panel'
import { KinshipPanel } from '@/presentation/components/family-graph/kinship-panel'
import { Button } from '@/presentation/components/ui/button'
import { LabelledSelect } from '@/presentation/components/ui/labelled-select'
import type { GraphToolsViewModel } from '@/presentation/mappers/graph-tools-view-models'
import { GRAPH_VIEW_PARAMS as P } from '@/presentation/schemas/graph-view-schema'

type ToolsProps = Readonly<{ tools: GraphToolsViewModel }>

/** The graph tools: Chemin and Ancêtres are floating popovers (module: graph tools parity) —
 * Descendance is still a plain GET form, whose result is a URL, readable and shareable. */
export function GraphToolsView({ treeId, tools }: ToolsProps & Readonly<{ treeId: string }>) {
  return (
    <div className="graph-mode-tools">
      <details
        open={tools.active === 'lineage'}
        className="rounded-lg border border-earth-sand bg-white p-3"
      >
        <summary
          id="tour-btn-lineage"
          aria-label="Descendance"
          className="flex cursor-pointer items-center gap-1 font-semibold"
        >
          <Icon name="lineage" />
          Descendance
        </summary>
        <LineageForm tools={tools} />
      </details>
      <KinshipPanel treeId={treeId} people={tools.people} />
      <CommonAncestorsPanel treeId={treeId} people={tools.people} />
    </div>
  )
}

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
function LineageForm({ tools }: ToolsProps) {
  const errorId = tools.problem?.tool === 'lineage' ? 'lineage-problem' : undefined
  return (
    <Form action={tools.action} className="mt-3 flex flex-wrap items-end gap-3">
      <input type="hidden" name={P.view} value="lineage" />
      <LabelledSelect
        id="lineage-member"
        name={P.member}
        label="Membre"
        placeholder="Choisir un membre"
        options={tools.people}
        defaultValue={tools.selected.member}
        describedBy={errorId}
      />
      <Button type="submit" variant="secondary">
        Voir la descendance
      </Button>
      {tools.problem?.tool === 'lineage' && (
        <p id={errorId} role="alert" className="w-full font-semibold text-brand-dark">
          {tools.problem.message}
        </p>
      )}
    </Form>
  )
}
