import type { Metadata } from 'next'
import { updateDeathDirectiveAction } from '@/app/actions/death-directive-actions'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { DeathDirectiveForm } from '@/presentation/components/forms/death-directive-form'
import { LinkList } from '@/presentation/views/link-list'

export const metadata: Metadata = {
  title: 'Souhaits après mon décès',
  description: 'Indiquez ce que vous souhaitez pour vos arbres après votre décès.',
}

export default async function DeathDirectivePage() {
  const currentUser = await requireCurrentUser()
  const directive = await container.getDeathDirective().execute(currentUser.id)

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-3xl font-bold">Souhaits après mon décès</h1>
      <p className="text-gray-600">
        Indiquez ce que vous souhaitez pour les arbres dont vous êtes propriétaire après votre
        décès. Ce message reste informatif : en son absence, vos arbres restent accessibles comme
        aujourd’hui.
      </p>
      <DeathDirectiveForm action={updateDeathDirectiveAction} initialDirective={directive ?? ''} />
      <LinkList links={[{ href: '/account/password', label: 'Changer le mot de passe' }]} />
    </div>
  )
}
