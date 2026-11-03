import 'server-only'
import { NextResponse } from 'next/server'
import { whenWritesEnabled, withinWriteBudget } from '@/app/actions/write-guards'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'

type RouteParams = { readonly params: Promise<{ id: string; suggestionId: string }> }

/** Rejects a suggestion from the floating "Connexions" panel — mirrors the accept route. */
export async function POST(_request: Request, { params }: RouteParams) {
  const { id: treeId, suggestionId } = await params
  const currentUser = await currentUserOrNull()
  if (!currentUser) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  if (!(await withinWriteBudget(currentUser.id))) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 })
  }

  const result = await whenWritesEnabled(() =>
    container.rejectSuggestion().execute({ treeId, suggestionId, viewerId: currentUser.id }),
  )
  if (!result) return NextResponse.json({ error: 'writes_disabled' }, { status: 503 })
  if (!result.ok) return NextResponse.json({ error: result.error.kind }, { status: 403 })

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
