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
      <ControlButton onClick={() => void flow.zoomIn()} aria-label="Zoom avant" title="Zoom avant">
        <Icon name="zoomIn" />
      </ControlButton>
      <ControlButton
        onClick={() => void flow.zoomOut()}
        aria-label="Zoom arrière"
        title="Zoom arrière"
      >
        <Icon name="zoomOut" />
      </ControlButton>
      <ControlButton
        onClick={() => void flow.fitView({ padding: 0.2 })}
        aria-label="Ajuster la vue"
        title="Ajuster la vue"
      >
        <Icon name="fit" />
      </ControlButton>
      <ControlButton
        onClick={onToggle}
        aria-label={locked ? 'Déverrouiller le graphe' : 'Verrouiller le graphe'}
        title={locked ? 'Déverrouiller le graphe' : 'Verrouiller le graphe'}
        aria-pressed={locked}
      >
        <Icon name={locked ? 'lock' : 'unlock'} />
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
