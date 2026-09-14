import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadAuditLog } from '@/app/tree/[id]/history/load-audit-log'
import { loadTreeOverview } from '@/app/tree/[id]/load-tree-overview'
import type { GetAuditLogError } from '@/core/use-cases/get-audit-log'
import { toAuditLogViewModel } from '@/presentation/mappers/audit-log-view-models'
import { parseAuditLogRequest } from '@/presentation/schemas/audit-log-schema'
import { AuditLogView } from '@/presentation/views/audit-log-view'
import { ContributorsOnlyView } from '@/presentation/views/contributors-only-view'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'

type HistoryPageProps = Readonly<{
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>

export async function generateMetadata({ params }: HistoryPageProps): Promise<Metadata> {
  const { result } = await loadTreeOverview((await params).id)
  if (!result.ok) {
    const title = result.error.kind === 'TREE_NOT_FOUND' ? 'Arbre introuvable' : 'Arbre privé'
    return { title, robots: { index: false } }
  }
  return {
    title: `Journal — ${result.value.name}`,
    description: `Historique des modifications de l’arbre ${result.value.name}.`,
    robots: { index: false },
  }
}

export default async function HistoryPage({ params, searchParams }: HistoryPageProps) {
  const { id } = await params
  const request = parseAuditLogRequest(await searchParams)
  const { signedIn, result } = await loadAuditLog(id, request)

  if (result.ok) return <AuditLogView log={toAuditLogViewModel(result.value, request)} />
  return unreadableHistory(id, result.error, signedIn)
}

function unreadableHistory(treeId: string, error: GetAuditLogError, signedIn: boolean) {
  switch (error.kind) {
    case 'TREE_NOT_FOUND':
      notFound()
    case 'AUDIT_LOG_FORBIDDEN':
      return <ContributorsOnlyView treeHref={`/tree/${treeId}`} signedIn={signedIn} />
    default:
      return <PrivateTreeView signedIn={signedIn} />
  }
}
