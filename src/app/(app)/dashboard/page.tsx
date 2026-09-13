import type { Metadata } from 'next'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { toTreeViewModel } from '@/presentation/mappers/tree-view-models'
import { TreeListView } from '@/presentation/views/tree-list-view'

export const metadata: Metadata = {
  title: 'Mes arbres',
  description: 'Retrouvez les arbres généalogiques que vous possédez ou qui vous sont partagés.',
}

export default async function DashboardPage() {
  const currentUser = await requireCurrentUser()
  const trees = await container.listUserTrees().execute({ userId: currentUser.id })

  return (
    <section aria-labelledby="dashboard-title" className="space-y-6">
      <div>
        <h1 id="dashboard-title" className="text-3xl font-bold">
          Mes arbres
        </h1>
        <p>Gérez vos réseaux généalogiques.</p>
      </div>
      <TreeListView trees={trees.map(toTreeViewModel)} />
    </section>
  )
}
