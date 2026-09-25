import type { ComponentProps } from 'react'
import Page from '@/app/tree/[id]/unions/new/page'
import { RouteOverlay } from '@/presentation/components/navigation/route-overlay'

export default function OverlayPage(props: ComponentProps<typeof Page>) {
  return (
    <RouteOverlay title="Ajouter une union" variant="modal">
      <Page {...props} />
    </RouteOverlay>
  )
}

export { metadata } from '@/app/tree/[id]/unions/new/page'
