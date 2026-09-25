import Page from '@/app/(app)/account/password/page'
import { RouteOverlay } from '@/presentation/components/navigation/route-overlay'

export default function OverlayPage() {
  return (
    <RouteOverlay title="Changer le mot de passe" variant="modal">
      <Page />
    </RouteOverlay>
  )
}

export { metadata } from '@/app/(app)/account/password/page'
