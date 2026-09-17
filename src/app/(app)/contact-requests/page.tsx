import type { Metadata } from 'next'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { toContactRequestsViewModel } from '@/presentation/mappers/contact-request-view-models'
import { ContactRequestsView } from '@/presentation/views/contact-requests-view'

export const metadata: Metadata = { title: 'Demandes de contact', robots: { index: false } }

export default async function ContactRequestsPage() {
  const currentUser = await requireCurrentUser()
  const list = await container.listContactRequests().execute(currentUser.id)
  return <ContactRequestsView list={toContactRequestsViewModel(list)} />
}
