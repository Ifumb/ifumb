import Page from '@/app/(app)/notifications/page'
import { RouteOverlay } from '@/presentation/components/navigation/route-overlay'

export default function OverlayPage() {
  return (
    <RouteOverlay title="Notifications" variant="notifications">
      <Page />
    </RouteOverlay>
  )
}

export { metadata } from '@/app/(app)/notifications/page'
