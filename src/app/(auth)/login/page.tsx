import type { Metadata } from 'next'
import { loginAction } from '@/app/actions/auth-actions'
import { ActionForm } from '@/presentation/components/forms/action-form'
import { StatusMessage } from '@/presentation/components/forms/status-message'
import { LOGIN_FORM } from '@/presentation/forms/auth-forms'
import { LinkList } from '@/presentation/views/link-list'

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous à IFUMB pour accéder à vos arbres généalogiques.',
}

const PASSWORD_RESET_DONE = 'success'
const PASSWORD_RESET_DONE_MESSAGE = 'Mot de passe réinitialisé. Vous pouvez vous connecter.'

type LoginPageProps = Readonly<{ searchParams: Promise<{ reset?: string; redirect?: string }> }>

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reset, redirect } = await searchParams
  const resetNotice = reset === PASSWORD_RESET_DONE ? PASSWORD_RESET_DONE_MESSAGE : undefined

  return (
    <>
      <h1 className="text-3xl font-bold">Connexion</h1>
      <p>Accédez à votre réseau généalogique.</p>
      <StatusMessage message={resetNotice} />
      <ActionForm action={loginAction} {...LOGIN_FORM} hiddenValues={redirect ? { redirect } : {}} />
      <LinkList links={loginLinks(redirect)} />
    </>
  )
}

function loginLinks(redirect: string | undefined) {
  const register = redirect
    ? (`/register?redirect=${encodeURIComponent(redirect)}` as const)
    : ('/register' as const)
  return [
    { href: '/forgot-password' as const, label: 'Mot de passe oublié ?' },
    { href: register, label: 'Créer un compte' },
  ]
}
