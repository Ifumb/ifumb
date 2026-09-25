import Page from '@/app/(app)/trees/new/page'
import { RouteOverlay } from '@/presentation/components/navigation/route-overlay'

export default function OverlayPage() {
  return (
    <RouteOverlay title="Créer un arbre" variant="modal">
      <Page />
    </RouteOverlay>
  )
}

export { metadata } from '@/app/(app)/trees/new/page'
