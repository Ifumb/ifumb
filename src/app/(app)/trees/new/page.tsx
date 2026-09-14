import type { Metadata } from 'next'
import Link from 'next/link'
import { createTreeAction } from '@/app/actions/tree-actions'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { TreeForm } from '@/presentation/components/forms/tree-form'
import { CREATE_TREE_SUBMIT, NEW_TREE_VALUES } from '@/presentation/forms/tree-form'

export const metadata: Metadata = {
  title: 'Créer un arbre',
  description: 'Créez un nouvel arbre généalogique sur IFUMB.',
  robots: { index: false },
}

export default async function NewTreePage() {
  await requireCurrentUser()

  return (
    <section aria-labelledby="new-tree-title" className="space-y-6">
      <p>
        <Link href="/dashboard">Retour à mes arbres</Link>
      </p>
      <h1 id="new-tree-title" className="text-3xl font-bold">
        Créer un arbre
      </h1>
      <TreeForm
        action={createTreeAction}
        initialValues={NEW_TREE_VALUES}
        submit={CREATE_TREE_SUBMIT}
      />
    </section>
  )
}
