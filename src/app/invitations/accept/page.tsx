import type { Metadata } from 'next'
import type { GetInvitationByTokenError } from '@/core/use-cases/get-invitation-by-token'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { toInvitationPreviewViewModel } from '@/presentation/mappers/invitation-preview-view-models'
import { AcceptInvitationView } from '@/presentation/views/accept-invitation-view'

type AcceptInvitationPageProps = Readonly<{ searchParams: Promise<{ token?: string }> }>

export const metadata: Metadata = { title: 'Invitation à collaborer', robots: { index: false } }

export default async function AcceptInvitationPage({ searchParams }: AcceptInvitationPageProps) {
  const { token } = await searchParams
  if (!token) return <InvitationMessage text="Ce lien d’invitation est incomplet." />

  const [result, currentUser] = await Promise.all([
    container.getInvitationByToken().execute(token),
    currentUserOrNull(),
  ])
  if (!result.ok) return <InvitationMessage text={messageFor(result.error)} />

  return (
    <AcceptInvitationView
      preview={toInvitationPreviewViewModel(result.value)}
      token={token}
      signedIn={currentUser !== null}
    />
  )
}

function messageFor(error: GetInvitationByTokenError): string {
  return error.kind === 'INVITATION_EXPIRED'
    ? 'Ce lien d’invitation a expiré. Demandez une nouvelle invitation au propriétaire de l’arbre.'
    : 'Cette invitation est introuvable ou a déjà été traitée.'
}

function InvitationMessage({ text }: Readonly<{ text: string }>) {
  return (
    <section aria-labelledby="invitation-title" className="max-w-prose space-y-4">
      <h1 id="invitation-title" className="text-3xl font-bold">
        Invitation à collaborer
      </h1>
      <p>{text}</p>
    </section>
  )
}
