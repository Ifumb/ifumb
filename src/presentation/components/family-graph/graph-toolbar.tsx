'use client'

import { useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { Icon } from '@/presentation/components/ui/icon'
import { isMemberNode, type PositionedNode } from '@/presentation/graph/family-graph-types'

type GraphToolbarProps = Readonly<{
  nodes: readonly PositionedNode[]
  visible: ReadonlySet<string>
  onCentre: (nodeId: string) => void
  onReset: () => void
}>

const collator = new Intl.Collator('fr', { sensitivity: 'base' })

// reason: la liste native permet recherche et sélection au clavier sans widget ARIA personnalisé.
export function GraphToolbar({ nodes, visible, onCentre, onReset }: GraphToolbarProps) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const members = useMemo(() => visibleMemberOptions(nodes, visible), [nodes, visible])
  const centre = (event: FormEvent) => {
    event.preventDefault()
    const chosen = members.find((member) => member.label === query)
    if (chosen) {
      onCentre(chosen.id)
      setFocused(true)
    }
  }
  const select = (value: string) => {
    setQuery(value)
    const chosen = members.find((member) => member.label === value)
    if (chosen) {
      onCentre(chosen.id)
      setFocused(true)
    }
  }
  const reset = () => {
    onReset()
    setQuery('')
    setFocused(false)
    input.current?.focus()
  }
  return (
    <>
      <form onSubmit={centre} className="graph-centre">
        <Icon name="search" />
        <label htmlFor={id}>Centrer sur un membre</label>
        <input
          id={id}
          ref={input}
          list={`${id}-options`}
          value={query}
          placeholder="Centrer sur un membre…"
          autoComplete="off"
          onChange={(event) => select(event.target.value)}
        />
        <datalist id={`${id}-options`}>
          {members.map((member) => (
            <option key={member.id} value={member.label} />
          ))}
        </datalist>
      </form>
      {focused && (
        <button type="button" className="graph-reset" onClick={reset}>
          <Icon name="close" />
          Réinitialiser la vue
        </button>
      )}
    </>
  )
}

function visibleMemberOptions(nodes: readonly PositionedNode[], visible: ReadonlySet<string>) {
  const members = nodes.filter(isMemberNode).filter((node) => visible.has(node.id))
  return members
    .map((node) => {
      const duplicate = members.filter((other) => other.data.name === node.data.name).length > 1
      return {
        id: node.id,
        label: duplicate ? `${node.data.name} — ${members.indexOf(node) + 1}` : node.data.name,
      }
    })
    .sort((a, b) => collator.compare(a.label, b.label))
}
