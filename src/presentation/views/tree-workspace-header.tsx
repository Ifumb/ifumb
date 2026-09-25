import { CopyTreeLink } from '@/presentation/components/navigation/copy-tree-link'
import Link from 'next/link'
import type { Route } from 'next'
import { Icon, type IconName } from '@/presentation/components/ui/icon'
import type { TreeViewModel } from '@/presentation/mappers/tree-view-models'

type TreeProps = Readonly<{ tree: TreeViewModel }>

// reason: le header regroupe les liens autorisés, leurs contrôles réels restent dans les use cases.
export function TreeWorkspaceHeader({
  tree,
  signedIn,
  pendingCount,
  connectionCount,
}: TreeProps & Readonly<{ signedIn: boolean; pendingCount: number; connectionCount: number }>) {
  return (
    <header className="tree-header">
      <Link
        href={signedIn ? '/dashboard' : '/'}
        aria-label={signedIn ? 'Mes arbres' : 'Accueil'}
        className="flex min-h-6 min-w-6 items-center gap-1 text-sm text-gray-500"
      >
        <Icon name="back" />
        <span className="hidden sm:inline">{signedIn ? 'Mes arbres' : 'Accueil'}</span>
      </Link>
      <span className="text-gray-300" aria-hidden="true">
        /
      </span>
      <h1
        id="tree-title"
        className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800 sm:text-base"
      >
        {tree.name}
      </h1>
      {tree.settingsHref && (
        <TreeAction
          href={tree.settingsHref}
          icon="edit"
          label="Modifier"
          accessibleLabel="Modifier l’arbre"
        />
      )}
      {tree.settingsHref ? (
        <TreeAction
          href={tree.settingsHref}
          icon={tree.visibilityLabel === 'Public' ? 'globe' : 'lock'}
          label={tree.visibilityLabel}
        />
      ) : (
        <span className="text-xs text-gray-500">{tree.visibilityLabel}</span>
      )}
      {tree.settingsHref && <OwnerActions tree={tree} connectionCount={connectionCount} />}
      {tree.visibilityLabel === 'Public' && <CopyTreeLink href={tree.href} />}
      {tree.historyHref && (
        <TreeAction
          href={tree.historyHref}
          icon="history"
          label="Journal"
          accessibleLabel="Journal de l’arbre"
        />
      )}
      {pendingCount > 0 && (
        <TreeAction href={`${tree.href}/pending`} icon="edit" label={`Réviser (${pendingCount})`} />
      )}
    </header>
  )
}

function OwnerActions({
  tree,
  connectionCount,
}: TreeProps & Readonly<{ connectionCount: number }>) {
  return (
    <>
      <Link
        href={`${tree.href}/collaborators?invite=1`}
        className="primary-action !min-h-7 !px-2 !py-1 !text-xs"
      >
        <Icon name="invite" />
        <span>Inviter</span>
      </Link>
      <TreeAction href={`${tree.href}/collaborators`} icon="people" label="Collaborateurs" />
      {connectionCount > 0 && tree.connectionRequestsHref && (
        <TreeAction href={tree.connectionRequestsHref} icon="network" label="Demandes" />
      )}
    </>
  )
}

export function TreeAction<T extends string>({
  href,
  icon,
  label,
  accessibleLabel,
}: Readonly<{ href: Route<T>; icon: IconName; label: string; accessibleLabel?: string }>) {
  return (
    <Link
      href={href}
      className="tree-header-action"
      aria-label={accessibleLabel ?? label}
      title={accessibleLabel ?? label}
    >
      <Icon name={icon} />
      <span>{label}</span>
    </Link>
  )
}

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
export function TreeGraphActions({ tree }: TreeProps) {
  return (
    <div className="graph-actions">
      {tree.newMemberHref && (
        <Link
          id="tour-btn-add-member"
          href={tree.newMemberHref}
          className="bg-brand hover:bg-brand-dark"
          aria-label="Ajouter un membre"
        >
          <Icon name="plus" />
          Membre
        </Link>
      )}
      {tree.newUnionHref && (
        <Link
          id="tour-btn-add-union"
          href={tree.newUnionHref}
          className="bg-forest hover:bg-forest-light"
          aria-label="Ajouter une union"
        >
          <Icon name="union" />
          Union
        </Link>
      )}
    </div>
  )
}

export function TreeConnections({ tree }: TreeProps) {
  return (
    <details>
      <summary id="tour-btn-connections" className="flex items-center gap-1">
        <Icon name="network" />
        Connexions
      </summary>
      <nav aria-label="Connexions inter-arbres" className="flex flex-col gap-3">
        {tree.suggestionsHref && (
          <Link href={`${tree.href}/pending`}>Modifications en attente</Link>
        )}
        <Link href={tree.linksHref}>Liaisons inter-arbres</Link>
        {tree.suggestionsHref && <Link href={tree.suggestionsHref}>Suggestions inter-arbres</Link>}
        {tree.connectionRequestsHref && (
          <Link href={tree.connectionRequestsHref}>Demandes de connexion</Link>
        )}
      </nav>
    </details>
  )
}
