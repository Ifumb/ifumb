import type { ComponentProps } from 'react'
import Page from '@/app/tree/[id]/collaborators/page'
import { RouteOverlay } from '@/presentation/components/navigation/route-overlay'

export default async function OverlayPage(props: ComponentProps<typeof Page>) {
  const inviting = (await props.searchParams).invite === '1'
  return (
    <RouteOverlay
      title={inviting ? 'Inviter un collaborateur' : 'Collaborateurs'}
      variant={inviting ? 'modal' : 'drawer'}
    >
      <Page {...props} />
    </RouteOverlay>
  )
}

export { generateMetadata } from '@/app/tree/[id]/collaborators/page'
