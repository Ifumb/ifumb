import 'server-only'
import { NextResponse } from 'next/server'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { configuredMemberPhotoSource } from '@/infrastructure/config/member-photos'
import { container } from '@/infrastructure/di/container'
import { toLineagePivotViewModel } from '@/presentation/graph/family-graph-view-models'
import { toFamilyGraphViewModel } from '@/presentation/graph/layout-family-graph'
import { MAX_LINEAGE_GENERATIONS } from '@/presentation/schemas/graph-view-schema'

type RouteParams = { readonly params: Promise<{ id: string }> }

/**
 * The graph scoped to one member's lineage, or the whole tree without `member`, already laid out —
 * mirrors `/api/tree/[id]/graph/branch`: session checked here, never cached, client-triggered.
 * reason: layout stays server-side only (the invariant the whole graph pipeline already relies
 * on), so moving the pivot's generation window means a fresh request here rather than relaying
 * out in the browser the way the legacy "pivot" view did.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id: treeId } = await params
  const currentUser = await currentUserOrNull()
  if (!currentUser) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const allowed = await container.allowsAttempt([
    { policy: 'graphLineageByUser', subject: currentUser.id },
  ])
  if (!allowed) return NextResponse.json({ error: 'too_many_requests' }, { status: 429 })

  const searchParams = new URL(request.url).searchParams
  const memberId = searchParams.get('member')
  const graphResult = await container.getFamilyGraph().execute({
    treeId,
    viewerId: currentUser.id,
    ...(memberId
      ? {
          lineage: {
            memberId,
            ancestors: generations(searchParams, 'up'),
            descendants: generations(searchParams, 'down'),
          },
        }
      : {}),
  })
  if (!graphResult.ok) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const linksResult = await container
    .listCrossTreeLinks()
    .execute({ treeId, viewerId: currentUser.id })
  const links = linksResult.ok ? linksResult.value : []

  const graph = toFamilyGraphViewModel(graphResult.value, configuredMemberPhotoSource(), links)
  const pivot = toLineagePivotViewModel(treeId, graphResult.value.lineage)
  return NextResponse.json({ graph, pivot }, { headers: { 'Cache-Control': 'no-store' } })
}

function generations(searchParams: URLSearchParams, key: 'up' | 'down'): number {
  const raw = Number.parseInt(searchParams.get(key) ?? '', 10)
  if (!Number.isInteger(raw) || raw < 0) return 0
  return Math.min(raw, MAX_LINEAGE_GENERATIONS)
}
