import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadMemberProfile } from '@/app/tree/[id]/member/[memberId]/load-member-profile'
import { toMemberProfileViewModel } from '@/presentation/mappers/member-view-models'
import { MemberProfileView } from '@/presentation/views/member-profile-view'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'

type MemberPageProps = Readonly<{ params: Promise<{ id: string; memberId: string }> }>

const NOT_FOUND_KINDS = new Set(['TREE_NOT_FOUND', 'MEMBER_NOT_FOUND'])

export async function generateMetadata({ params }: MemberPageProps): Promise<Metadata> {
  const { id, memberId } = await params
  const { result } = await loadMemberProfile(id, memberId)
  if (!result.ok) {
    // Neither the member nor the tree of a page the visitor may not read is ever named.
    const title = NOT_FOUND_KINDS.has(result.error.kind) ? 'Fiche introuvable' : 'Arbre privé'
    return { title, robots: { index: false } }
  }
  const { member, tree } = result.value
  const culture = [member.tribe, member.ethnicity].filter(Boolean).join(', ')
  return {
    title: toMemberProfileViewModel(result.value).name,
    description: `Fiche généalogique dans l’arbre ${tree.name}${culture ? ` — ${culture}` : ''}.`,
    robots: { index: tree.isPublic },
  }
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { id, memberId } = await params
  const { signedIn, result } = await loadMemberProfile(id, memberId)

  if (result.ok) return <MemberProfileView profile={toMemberProfileViewModel(result.value)} />
  if (NOT_FOUND_KINDS.has(result.error.kind)) notFound()
  return <PrivateTreeView signedIn={signedIn} />
}
