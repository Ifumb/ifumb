import type { ComponentProps } from 'react'
import Page from '@/app/tree/[id]/union/[unionId]/delete/page'
import { RouteOverlay } from '@/presentation/components/navigation/route-overlay'

export default function OverlayPage(props: ComponentProps<typeof Page>) {
  return (
    <RouteOverlay title="Supprimer l’union" variant="modal">
      <Page {...props} />
    </RouteOverlay>
  )
}

export { metadata } from '@/app/tree/[id]/union/[unionId]/delete/page'
