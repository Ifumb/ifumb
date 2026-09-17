import 'server-only'
import { NextResponse } from 'next/server'
import type { CrossTreeBranch } from '@/core/use-cases/get-cross-tree-branch'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { configuredMemberPhotoSource } from '@/infrastructure/config/member-photos'
import { container } from '@/infrastructure/di/container'
import { toMergedFamilyGraphViewModel } from '@/presentation/graph/layout-family-graph'

type RouteParams = { readonly params: Promise<{ id: string }> }

/**
 * The local graph plus every requested foreign branch, already merged and laid out (module 3.3) —
 * mirrors `/api/notifications/unread-count`: session checked here, never cached, client-triggered.
 * reason: layout stays server-side only (the invariant the whole graph pipeline already relies
 * on), so toggling a branch means a fresh request here rather than relaying out in the browser.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id: treeId } = await params
  const currentUser = await currentUserOrNull()
  if (!currentUser) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const allowed = await container.allowsAttempt([
    { policy: 'crossTreeBranchByUser', subject: currentUser.id },
  ])
  if (!allowed) return NextResponse.json({ error: 'too_many_requests' }, { status: 429 })

  const linkIds = new URL(request.url).searchParams.getAll('linkId')
  const graphResult = await container
    .getFamilyGraph()
    .execute({ treeId, viewerId: currentUser.id })
  if (!graphResult.ok) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const branches: CrossTreeBranch[] = []
  for (const linkId of linkIds) {
    const branchResult = await container
      .getCrossTreeBranch()
      .execute({ treeId, viewerId: currentUser.id, linkId })
    if (!branchResult.ok) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    branches.push(branchResult.value)
  }

  const linksResult = await container
    .listCrossTreeLinks()
    .execute({ treeId, viewerId: currentUser.id })
  const links = linksResult.ok ? linksResult.value : []

  const merged = toMergedFamilyGraphViewModel(
    graphResult.value,
    links,
    branches,
    configuredMemberPhotoSource(),
  )
  return NextResponse.json(merged, { headers: { 'Cache-Control': 'no-store' } })
}
