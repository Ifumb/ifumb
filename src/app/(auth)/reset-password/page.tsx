import type { Metadata } from 'next'
import { resetPasswordAction } from '@/app/actions/password-reset-actions'
import { ActionForm } from '@/presentation/components/forms/action-form'
import { RESET_PASSWORD_FORM } from '@/presentation/forms/auth-forms'
import { LinkList } from '@/presentation/views/link-list'

export const metadata: Metadata = { title: 'Nouveau mot de passe' }

type ResetPasswordPageProps = Readonly<{ searchParams: Promise<{ token?: string }> }>

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams

  return (
    <>
      <h1 className="text-3xl font-bold">Nouveau mot de passe</h1>
      {token ? (
        <ActionForm
          action={resetPasswordAction}
          {...RESET_PASSWORD_FORM}
          hiddenValues={{ token }}
        />
      ) : (
        <p>Ce lien de réinitialisation est incomplet.</p>
      )}
      <LinkList links={[{ href: '/forgot-password', label: 'Demander un nouveau lien' }]} />
    </>
  )
}
