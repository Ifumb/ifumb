import type { ComponentProps } from 'react'
import Page from '@/app/tree/[id]/pending/page'
import { RouteOverlay } from '@/presentation/components/navigation/route-overlay'

export default function OverlayPage(props: ComponentProps<typeof Page>) {
  return (
    <RouteOverlay title="Modifications en attente" variant="drawer">
      <Page {...props} />
    </RouteOverlay>
  )
}

export { generateMetadata } from '@/app/tree/[id]/pending/page'
