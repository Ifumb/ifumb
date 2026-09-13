import type { Metadata } from 'next'
import { registerAction } from '@/app/actions/auth-actions'
import { ActionForm } from '@/presentation/components/forms/action-form'
import { REGISTER_FORM } from '@/presentation/forms/auth-forms'
import { LinkList } from '@/presentation/views/link-list'

export const metadata: Metadata = { title: 'Créer un compte' }

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Créer un compte</h1>
      <p>Rejoignez IFUMB et construisez votre réseau familial.</p>
      <ActionForm action={registerAction} {...REGISTER_FORM} />
      <LinkList links={[{ href: '/login', label: 'Déjà inscrit ? Se connecter' }]} />
    </>
  )
}
