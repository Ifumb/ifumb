import 'server-only'
import { NextResponse } from 'next/server'
import { whenWritesEnabled } from '@/app/actions/write-guards'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'

type RouteParams = { readonly params: Promise<{ id: string }> }

/**
 * Runs the cross-tree matching algorithm for this tree (module: graph tools parity) — triggered
 * from the floating "Connexions" panel's "Chercher des connexions" button, in place of the full
 * page's `computeSuggestionsAction`. The client reloads `/connections` right after to pick up the
 * freshly written suggestions, exactly like the legacy app's `handleCompute`.
 */
export async function POST(_request: Request, { params }: RouteParams) {
  const { id: treeId } = await params
  const currentUser = await currentUserOrNull()
  if (!currentUser) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const allowed = await container.allowsAttempt([
    { policy: 'computeSuggestionsByUser', subject: currentUser.id },
  ])
  if (!allowed) return NextResponse.json({ error: 'too_many_requests' }, { status: 429 })

  const result = await whenWritesEnabled(() =>
    container.computeSuggestions().execute({ treeId, viewerId: currentUser.id }),
  )
  if (!result) return NextResponse.json({ error: 'writes_disabled' }, { status: 503 })
  if (!result.ok) return NextResponse.json({ error: result.error.kind }, { status: 403 })

  return NextResponse.json(
    { computed: result.value.computed },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
