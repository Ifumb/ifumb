import { acceptInvitationAction, rejectInvitationAction } from '@/app/actions/invitation-actions'
import { AcceptInvitationForm } from '@/presentation/components/forms/accept-invitation-form'
import { RejectInvitationForm } from '@/presentation/components/forms/reject-invitation-form'
import type { InvitationPreviewViewModel } from '@/presentation/mappers/invitation-preview-view-models'
import { LinkList } from '@/presentation/views/link-list'

type AcceptInvitationProps = Readonly<{
  preview: InvitationPreviewViewModel
  token: string
  signedIn: boolean
}>

export function AcceptInvitationView({ preview, token, signedIn }: AcceptInvitationProps) {
  return (
    <section aria-labelledby="invitation-title" className="max-w-prose space-y-4">
      <h1 id="invitation-title" className="text-3xl font-bold">
        Invitation à collaborer
      </h1>
      <p>
        <strong>{preview.inviterName}</strong> vous invite à rejoindre l’arbre «&nbsp;
        {preview.treeName}&nbsp;» en tant que <strong>{preview.roleLabel}</strong>.
      </p>
      {signedIn ? (
        <div className="flex flex-wrap gap-4">
          <AcceptInvitationForm action={acceptInvitationAction.bind(null, token)} />
          <RejectInvitationForm action={rejectInvitationAction.bind(null, token)} />
        </div>
      ) : (
        <>
          <p>Connectez-vous ou créez un compte pour répondre à cette invitation.</p>
          <LinkList links={authLinks(token)} />
        </>
      )}
    </section>
  )
}

function authLinks(token: string) {
  const redirect = encodeURIComponent(`/invitations/accept?token=${token}`)
  return [
    { href: `/login?redirect=${redirect}` as const, label: 'Se connecter' },
    { href: `/register?redirect=${redirect}` as const, label: 'Créer un compte' },
  ]
}
