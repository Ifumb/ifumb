import Link from 'next/link'
import { Icon } from '@/presentation/components/ui/icon'

type LandingPrimaryActionProps = Readonly<{ signedIn: boolean; closing?: boolean }>

export function LandingPrimaryAction({ signedIn, closing = false }: LandingPrimaryActionProps) {
  const label = signedIn
    ? 'Accéder à mes arbres'
    : closing
      ? 'Créer mon arbre gratuitement'
      : 'Commencer gratuitement'
  return (
    <Link href={signedIn ? '/dashboard' : '/register'} className="landing-primary-action">
      {label}
      <Icon name="next" size={18} />
    </Link>
  )
}
