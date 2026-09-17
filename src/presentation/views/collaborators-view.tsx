import Link from 'next/link'
import { changeCollaboratorRoleAction } from '@/app/actions/invitation-actions'
import { ChangeRoleForm } from '@/presentation/components/forms/change-role-form'
import { InviteForm } from '@/presentation/components/forms/invite-form'
import type {
  CollaboratorItemViewModel,
  CollaboratorsViewModel,
} from '@/presentation/mappers/collaborator-view-models'
import type { FormAction } from '@/presentation/forms/form-action'

type CollaboratorsProps = Readonly<{
  list: CollaboratorsViewModel
  sendInvitationAction: FormAction
}>

export function CollaboratorsView({ list, sendInvitationAction }: CollaboratorsProps) {
  return (
    <section aria-labelledby="collaborators-title" className="space-y-8">
      <p>
        <Link href={`/tree/${list.treeId}`}>Retour à {list.treeName}</Link>
      </p>
      <h1 id="collaborators-title" className="text-3xl font-bold">
        Collaborateurs — {list.treeName}
      </h1>
      <InviteForm action={sendInvitationAction} />
      {list.collaborators.length > 0 ? (
        <ol className="space-y-3">
          {list.collaborators.map((collaborator) => (
            <CollaboratorItem key={collaborator.id} treeId={list.treeId} collaborator={collaborator} />
          ))}
        </ol>
      ) : (
        <p>Aucun collaborateur pour l’instant.</p>
      )}
    </section>
  )
}

type CollaboratorItemProps = Readonly<{ treeId: string; collaborator: CollaboratorItemViewModel }>

function CollaboratorItem({ treeId, collaborator }: CollaboratorItemProps) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-earth-sand bg-white p-4">
      <div>
        <p className="font-medium">{collaborator.displayName}</p>
        <p className="text-sm text-muted-foreground">
          {collaborator.statusLabel} · {collaborator.roleLabel}
        </p>
      </div>
      <div className="flex items-center gap-4">
        {collaborator.canChangeRole && (
          <ChangeRoleForm
            action={changeCollaboratorRoleAction.bind(null, { treeId, invitationId: collaborator.id })}
            role={collaborator.role}
            collaboratorName={collaborator.displayName}
          />
        )}
        <Link href={collaborator.revokeHref}>{`Révoquer l’accès de ${collaborator.displayName}`}</Link>
      </div>
    </li>
  )
}
