import type { Metadata } from 'next'
import { requestPasswordResetAction } from '@/app/actions/password-reset-actions'
import { ActionForm } from '@/presentation/components/forms/action-form'
import { FORGOT_PASSWORD_FORM } from '@/presentation/forms/auth-forms'
import { LinkList } from '@/presentation/views/link-list'

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  description:
    'Recevez par email un lien pour réinitialiser le mot de passe de votre compte IFUMB.',
}

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Mot de passe oublié</h1>
      <p>Indiquez l’email de votre compte : nous vous enverrons un lien de réinitialisation.</p>
      <ActionForm action={requestPasswordResetAction} {...FORGOT_PASSWORD_FORM} />
      <LinkList links={[{ href: '/login', label: 'Retour à la connexion' }]} />
    </>
  )
}
