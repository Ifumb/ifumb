import 'server-only'
import { NextResponse } from 'next/server'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { toCrossTreeLinkItems } from '@/presentation/mappers/cross-tree-link-view-models'
import { toSuggestionItems } from '@/presentation/mappers/suggestion-view-models'

type RouteParams = { readonly params: Promise<{ id: string }> }

/**
 * Suggestions and established links for the floating "Connexions" panel (module: graph tools
 * parity) — mirrors the legacy app's `loadCrossTreeData`: both lists are read together every time
 * the panel opens, independently of whether a computation has just run.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id: treeId } = await params
  const currentUser = await currentUserOrNull()
  if (!currentUser) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const allowed = await container.allowsAttempt([
    { policy: 'graphConnectionsByUser', subject: currentUser.id },
  ])
  if (!allowed) return NextResponse.json({ error: 'too_many_requests' }, { status: 429 })

  const reader = { treeId, viewerId: currentUser.id }
  const [suggestions, links] = await Promise.all([
    container.getSuggestions().execute(reader),
    container.listCrossTreeLinks().execute(reader),
  ])
  if (!suggestions.ok) return NextResponse.json({ error: suggestions.error.kind }, { status: 403 })
  if (!links.ok) return NextResponse.json({ error: links.error.kind }, { status: 403 })

  return NextResponse.json(
    {
      suggestions: toSuggestionItems(suggestions.value),
      links: toCrossTreeLinkItems(treeId, links.value),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
