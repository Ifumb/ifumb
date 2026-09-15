import type { Metadata } from 'next'
import Link from 'next/link'
import { cache } from 'react'
import { memberPhotoAction } from '@/app/actions/member-photo-actions'
import { MemberWriteRefusal } from '@/app/tree/[id]/member/[memberId]/member-write-refusal'
import type { MemberPhotoForm as MemberPhotoFormData } from '@/core/use-cases/get-member-photo-form'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { configuredMemberPhotoSource } from '@/infrastructure/config/member-photos'
import { container } from '@/infrastructure/di/container'
import { MemberPhotoForm } from '@/presentation/components/forms/member-photo-form'
import { MemberPortrait } from '@/presentation/components/ui/member-portrait'
import { PHOTO_STORAGE_UNAVAILABLE_MESSAGE } from '@/presentation/errors/member-photo-messages'
import { toPortrait } from '@/presentation/mappers/portrait'
import { memberLink } from '@/presentation/mappers/union-view-models'

type MemberPhotoPageProps = Readonly<{ params: Promise<{ id: string; memberId: string }> }>

const loadPhotoForm = cache(async (treeId: string, memberId: string) => {
  const currentUser = await requireCurrentUser()
  return container.getMemberPhotoForm().execute({ treeId, memberId, viewerId: currentUser.id })
})

export async function generateMetadata({ params }: MemberPhotoPageProps): Promise<Metadata> {
  const { id, memberId } = await params
  const result = await loadPhotoForm(id, memberId)
  const name = result.ok ? memberLink(id, result.value.member).name : null
  return { title: name ? `Photo — ${name}` : 'Photo d’un membre', robots: { index: false } }
}

export default async function MemberPhotoPage({ params }: MemberPhotoPageProps) {
  const { id, memberId } = await params
  const result = await loadPhotoForm(id, memberId)
  if (!result.ok) return <MemberWriteRefusal treeId={id} error={result.error} />
  return <MemberPhoto form={result.value} />
}

function MemberPhoto({ form }: Readonly<{ form: MemberPhotoFormData }>) {
  const { href, name } = memberLink(form.tree.id, form.member)
  const portrait = toPortrait(form.member, form.member.photoUrl, configuredMemberPhotoSource())
  return (
    <section aria-labelledby="member-photo-title" className="space-y-6">
      <p>
        <Link href={href}>Retour à la fiche de {name}</Link>
      </p>
      <h1 id="member-photo-title" className="text-3xl font-bold">
        Photo de {name}
      </h1>
      <MemberPortrait portrait={portrait} size="lg" priority />
      <PhotoControls form={form} />
    </section>
  )
}

/** The form, where a photo storage is configured; otherwise, why photos cannot be changed. */
function PhotoControls({ form }: Readonly<{ form: MemberPhotoFormData }>) {
  if (!form.storageAvailable) {
    return <p className="max-w-prose">{PHOTO_STORAGE_UNAVAILABLE_MESSAGE}</p>
  }
  const target = { treeId: form.tree.id, memberId: form.member.id }
  return (
    <MemberPhotoForm
      action={memberPhotoAction.bind(null, target)}
      hasPhoto={form.member.photoUrl !== null}
    />
  )
}
