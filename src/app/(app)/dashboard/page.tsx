import { GuidedTour } from '@/presentation/components/navigation/guided-tour'
import type { Metadata } from 'next'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { toTreeViewModel } from '@/presentation/mappers/tree-view-models'
import { CreateTreeLink, TreeListView } from '@/presentation/views/tree-list-view'

export const metadata: Metadata = {
  title: 'Mes arbres',
  description: 'Retrouvez les arbres généalogiques que vous possédez ou qui vous sont partagés.',
}

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
export default async function DashboardPage() {
  const currentUser = await requireCurrentUser()
  const trees = await container.listUserTrees().execute({ userId: currentUser.id })

  return (
    <section
      aria-labelledby="dashboard-title"
      className="dashboard-shell mx-auto max-w-5xl space-y-6 sm:space-y-8"
    >
      <div className="flex items-start justify-between gap-3 sm:items-center">
        <div>
          <h1 id="dashboard-title" className="text-2xl font-bold text-brand sm:text-3xl">
            Mes arbres
          </h1>
          <p className="mt-0.5 text-sm text-gray-600 sm:text-base">
            Gérez vos réseaux généalogiques
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GuidedTour tourId="dashboard" />
          <CreateTreeLink />
        </div>
      </div>
      <div id="tour-tree-list">
        <TreeListView trees={trees.map(toTreeViewModel)} />
      </div>
    </section>
  )
}
