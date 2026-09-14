'use client'

import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { LabelledSelect } from '@/presentation/components/ui/labelled-select'
import { isMemberNode, type PositionedNode } from '@/presentation/graph/family-graph-types'

type GraphToolbarProps = Readonly<{
  nodes: readonly PositionedNode[]
  visible: ReadonlySet<string>
  onCentre: (nodeId: string) => void
  onReset: () => void
}>

const collator = new Intl.Collator('fr', { sensitivity: 'base' })

export function GraphToolbar({ nodes, visible, onCentre, onReset }: GraphToolbarProps) {
  const members = useMemo(() => visibleMemberOptions(nodes, visible), [nodes, visible])
  const { selected, setSelected, selectRef, centre, reset } = useCentreSelection(onCentre, onReset)

  return (
    <form onSubmit={centre} className="flex flex-wrap items-end gap-3">
      <LabelledSelect
        id="graph-centre-member"
        label="Centrer sur un membre"
        ref={selectRef}
        placeholder="Choisir un membre"
        value={selected}
        options={members}
        onChange={setSelected}
      />
      <CentreButtons onReset={reset} />
    </form>
  )
}

function CentreButtons({ onReset }: Readonly<{ onReset: () => void }>) {
  return (
    <>
      <Button type="submit" variant="secondary">
        Centrer
      </Button>
      <Button type="button" variant="secondary" onClick={onReset}>
        Réinitialiser la vue
      </Button>
    </>
  )
}

function visibleMemberOptions(nodes: readonly PositionedNode[], visible: ReadonlySet<string>) {
  return nodes
    .filter(isMemberNode)
    .filter((node) => visible.has(node.id))
    .map((node) => ({ value: node.id, label: node.data.name }))
    .sort((a, b) => collator.compare(a.label, b.label))
}

/** The member picked for centring; after a reset the focus returns to the picker. */
function useCentreSelection(onCentre: (nodeId: string) => void, onReset: () => void) {
  const [selected, setSelected] = useState('')
  const selectRef = useRef<HTMLSelectElement>(null)
  const centre = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selected !== '') onCentre(selected)
  }
  const reset = () => {
    onReset()
    setSelected('')
    selectRef.current?.focus()
  }
  return { selected, setSelected, selectRef, centre, reset }
}
