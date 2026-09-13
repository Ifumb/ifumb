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
const LOGIN_LINKS = [
  { href: '/forgot-password', label: 'Mot de passe oublié ?' },
  { href: '/register', label: 'Créer un compte' },
] as const

type LoginPageProps = Readonly<{ searchParams: Promise<{ reset?: string }> }>

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reset } = await searchParams
  const resetNotice = reset === PASSWORD_RESET_DONE ? PASSWORD_RESET_DONE_MESSAGE : undefined

  return (
    <>
      <h1 className="text-3xl font-bold">Connexion</h1>
      <p>Accédez à votre réseau généalogique.</p>
      <StatusMessage message={resetNotice} />
      <ActionForm action={loginAction} {...LOGIN_FORM} />
      <LinkList links={LOGIN_LINKS} />
    </>
  )
}
