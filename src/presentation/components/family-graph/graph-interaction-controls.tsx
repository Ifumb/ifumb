'use client'

import { ControlButton, useReactFlow } from '@xyflow/react'
import { Icon } from '@/presentation/components/ui/icon'

type GraphInteractionControlsProps = Readonly<{
  locked: boolean
  onToggle: () => void
  onResetLayout: () => void
}>

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
export function GraphInteractionControls({
  locked,
  onToggle,
  onResetLayout,
}: GraphInteractionControlsProps) {
  const flow = useReactFlow()
  const arrange = () => {
    onResetLayout()
    requestAnimationFrame(() => void flow.fitView({ padding: 0.2 }))
  }
  return (
    <>
      <ControlButton
        onClick={onToggle}
        aria-label={locked ? 'Déverrouiller le graphe' : 'Verrouiller le graphe'}
        title={locked ? 'Déverrouiller le graphe' : 'Verrouiller le graphe'}
        aria-pressed={locked}
      >
        <Icon name="lock" />
      </ControlButton>
      <ControlButton
        onClick={arrange}
        aria-label="Réorganiser le graphe"
        title="Réorganiser le graphe"
      >
        <Icon name="map" />
      </ControlButton>
    </>
  )
}
