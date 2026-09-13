import type { Metadata } from 'next'
import { changePasswordAction } from '@/app/actions/account-actions'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { ActionForm } from '@/presentation/components/forms/action-form'
import { CHANGE_PASSWORD_FORM } from '@/presentation/forms/auth-forms'

export const metadata: Metadata = { title: 'Changer le mot de passe' }

export default async function ChangePasswordPage() {
  await requireCurrentUser()

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-3xl font-bold">Changer le mot de passe</h1>
      <ActionForm action={changePasswordAction} {...CHANGE_PASSWORD_FORM} />
    </div>
  )
}
