import type { Metadata } from 'next'
import { registerAction } from '@/app/actions/auth-actions'
import { RegisterForm } from '@/presentation/components/forms/register-form'
import { LinkList } from '@/presentation/views/link-list'

export const metadata: Metadata = {
  title: 'Créer un compte',
  description:
    'Créez gratuitement votre compte IFUMB et commencez votre arbre généalogique familial.',
}

type RegisterPageProps = Readonly<{ searchParams: Promise<{ redirect?: string }> }>

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { redirect } = await searchParams
  const login = redirect
    ? (`/login?redirect=${encodeURIComponent(redirect)}` as const)
    : ('/login' as const)

  return (
    <>
      <h1 className="text-3xl font-bold">Créer un compte</h1>
      <p>Rejoignez IFUMB et construisez votre réseau familial.</p>
      <RegisterForm action={registerAction} hiddenValues={redirect ? { redirect } : {}} />
      <LinkList links={[{ href: login, label: 'Déjà inscrit ? Se connecter' }]} />
    </>
  )
}
