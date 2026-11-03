import 'server-only'
import { NextResponse } from 'next/server'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { toKinshipResultViewModel } from '@/presentation/mappers/kinship-view-models'

type RouteParams = { readonly params: Promise<{ id: string }> }

/**
 * The kinship path between two members, computed server-side on every request (module: graph
 * tools parity) — mirrors `/api/tree/[id]/graph/lineage`: session checked here, never cached,
 * client-triggered from the floating "Chemin" panel instead of a page navigation.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id: treeId } = await params
  const currentUser = await currentUserOrNull()
  if (!currentUser) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const allowed = await container.allowsAttempt([
    { policy: 'graphKinshipByUser', subject: currentUser.id },
  ])
  if (!allowed) return NextResponse.json({ error: 'too_many_requests' }, { status: 429 })

  const searchParams = new URL(request.url).searchParams
  const firstId = searchParams.get('first')
  const secondId = searchParams.get('second')
  if (!firstId || !secondId) return NextResponse.json({ error: 'missing_member' }, { status: 400 })

  const result = await container
    .findKinship()
    .execute({ treeId, viewerId: currentUser.id, firstId, secondId })
  if (!result.ok) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json(
    { result: toKinshipResultViewModel(treeId, result.value) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
