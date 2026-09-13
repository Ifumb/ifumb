import type { Metadata } from 'next'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'

export const metadata: Metadata = {
  title: 'Mes arbres',
  description: 'Retrouvez les arbres généalogiques que vous possédez ou qui vous sont partagés.',
}

export default async function DashboardPage() {
  await requireCurrentUser()

  return (
    <>
      <h1 className="text-3xl font-bold">Mes arbres</h1>
      <p>Vos arbres généalogiques apparaîtront ici.</p>
    </>
  )
}
