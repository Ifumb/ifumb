import { isMemberNode, type PositionedNode } from '@/presentation/graph/family-graph-types'

type GraphStatusProps = Readonly<{
  nodes: readonly PositionedNode[]
  visible: ReadonlySet<string>
  total: number
}>

/** Announces, politely, how many members the filters leave on the graph. */
export function GraphStatus({ nodes, visible, total }: GraphStatusProps) {
  const shown = nodes.filter((node) => isMemberNode(node) && visible.has(node.id)).length
  return (
    <p role="status" className="text-sm">
      {statusText(shown, total)}
    </p>
  )
}

function statusText(shown: number, total: number): string {
  if (total === 0) return 'Cet arbre ne contient encore aucun membre.'
  if (shown === 0) return 'Aucun membre ne correspond aux filtres.'
  const plural = total > 1 ? 's' : ''
  if (shown === total) return `${total} membre${plural} affiché${plural}.`
  return `${shown} membre${shown > 1 ? 's' : ''} affiché${shown > 1 ? 's' : ''} sur ${total}.`
}
