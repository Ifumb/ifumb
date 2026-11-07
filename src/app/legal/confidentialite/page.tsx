import type { Metadata } from 'next'
import { PrivacyPolicyView } from '@/presentation/views/legal/privacy-policy-view'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Quelles données IFUMB traite, pourquoi, et comment exercer vos droits.',
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyView />
}
