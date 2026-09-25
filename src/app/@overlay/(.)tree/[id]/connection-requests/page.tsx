import type { ComponentProps } from 'react'
import Page from '@/app/tree/[id]/connection-requests/page'
import { RouteOverlay } from '@/presentation/components/navigation/route-overlay'

export default function OverlayPage(props: ComponentProps<typeof Page>) {
  return (
    <RouteOverlay title="Demandes de connexion" variant="drawer">
      <Page {...props} />
    </RouteOverlay>
  )
}

export { generateMetadata } from '@/app/tree/[id]/connection-requests/page'
