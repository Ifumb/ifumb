'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useRef, Suspense } from 'react'
import { NotificationBadge } from '@/presentation/components/navigation/notification-badge'
import { Icon } from '@/presentation/components/ui/icon'

type HeaderNavigationProps = Readonly<{
  userName: string | null
  signedIn: boolean
  unreadCount: number
  logoutAction: () => Promise<void>
}>

// reason: le JSX garde la structure sémantique de la navigation desktop et mobile dans un composant.
export function HeaderNavigation(props: HeaderNavigationProps) {
  const menu = useRef<HTMLDetailsElement>(null)
  const closeMenu = () => menu.current?.removeAttribute('open')
  return (
    <>
      <nav aria-label="Site" className="hidden items-center gap-6 text-sm md:flex">
        <PrimaryLinks signedIn={props.signedIn} />
      </nav>
      <div className="hidden items-center gap-3 text-sm md:flex">
        <AccountLinks {...props} />
      </div>
      <details ref={menu} className="mobile-navigation md:hidden">
        <summary aria-label="Menu" className="icon-button">
          <Icon name="menu" />
        </summary>
        <nav aria-label="Navigation mobile" className="mobile-navigation-panel">
          <PrimaryLinks signedIn={props.signedIn} onNavigate={closeMenu} />
          <AccountLinks {...props} onNavigate={closeMenu} />
        </nav>
      </details>
    </>
  )
}

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
function PrimaryLinks({
  signedIn,
  onNavigate,
}: Readonly<{ signedIn: boolean; onNavigate?: () => void }>) {
  const pathname = usePathname()
  return (
    <>
      <Link
        href="/explore"
        prefetch={false}
        onClick={onNavigate}
        aria-current={pathname.startsWith('/explore') ? 'page' : undefined}
      >
        Explorer
      </Link>
      {signedIn && (
        <Link
          href="/dashboard"
          prefetch={false}
          onClick={onNavigate}
          aria-current={pathname === '/dashboard' ? 'page' : undefined}
        >
          Mes arbres
        </Link>
      )}
    </>
  )
}

// reason: un même groupe de liens rend les deux navigations sans dupliquer les droits.
function AccountLinks({
  userName,
  signedIn,
  unreadCount,
  logoutAction,
  onNavigate,
}: HeaderNavigationProps & Readonly<{ onNavigate?: () => void }>) {
  if (!signedIn)
    return (
      <Suspense>
        <GuestLinks />
      </Suspense>
    )
  return (
    <>
      <span className="text-gray-700">{userName}</span>
      <NotificationBadge
        key={unreadCount}
        initialUnreadCount={unreadCount}
        onNavigate={onNavigate}
      />
      <Link
        href="/contact-requests"
        onClick={onNavigate}
        className="icon-button"
        aria-label="Demandes de contact"
        title="Demandes de contact"
      >
        <Icon name="people" />
      </Link>
      <Link
        href="/account/password"
        aria-label="Changer le mot de passe"
        onClick={onNavigate}
        className="header-action"
      >
        <Icon name="key" />
        Mot de passe
      </Link>
      <form action={logoutAction}>
        <button className="header-action" type="submit" aria-label="Se déconnecter">
          <Icon name="logout" />
          Déconnexion
        </button>
      </form>
    </>
  )
}

function GuestLinks() {
  const pathname = usePathname()
  const query = useSearchParams().toString()
  const suffix = `?redirect=${encodeURIComponent(pathname + (query ? `?${query}` : ''))}`
  return (
    <>
      <Link href={`/login${suffix}`} className="header-action">
        Se connecter
      </Link>
      <Link href={`/register${suffix}`} className="rounded-lg bg-brand px-3 py-2 text-white">
        Créer un compte
      </Link>
    </>
  )
}
