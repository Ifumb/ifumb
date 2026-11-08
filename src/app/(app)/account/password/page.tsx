import type { Metadata } from 'next'
import { changePasswordAction } from '@/app/actions/account-actions'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { ActionForm } from '@/presentation/components/forms/action-form'
import { CHANGE_PASSWORD_FORM } from '@/presentation/forms/auth-forms'
import { LinkList } from '@/presentation/views/link-list'

export const metadata: Metadata = {
  title: 'Changer le mot de passe',
  description: 'Modifiez le mot de passe de votre compte IFUMB.',
}

export default async function ChangePasswordPage() {
  await requireCurrentUser()

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-3xl font-bold">Changer le mot de passe</h1>
      <ActionForm action={changePasswordAction} {...CHANGE_PASSWORD_FORM} />
      <LinkList
        links={[{ href: '/account/death-directive', label: 'Souhaits après mon décès' }]}
      />
    </div>
  )
}
