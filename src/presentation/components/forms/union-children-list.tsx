'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { FormErrorSummary } from '@/presentation/components/forms/form-error-summary'
import { StatusMessage } from '@/presentation/components/forms/status-message'
import { Button } from '@/presentation/components/ui/button'
import type { FormAction } from '@/presentation/forms/form-action'
import { INITIAL_FORM_STATE } from '@/presentation/forms/form-state'
import type { UnionChildViewModel } from '@/presentation/mappers/union-page-view-models'

type UnionChildrenListProps = Readonly<{
  removeAction: FormAction
  childLinks: readonly UnionChildViewModel[]
}>

/**
 * The children of a union, each with a button unlinking it. One form holds every button, so the
 * outcome is announced in a status region that stays on the page when the child's row goes away.
 */
export function UnionChildrenList({ removeAction, childLinks }: UnionChildrenListProps) {
  const [state, formAction, pending] = useActionState(removeAction, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="space-y-3">
      <FormErrorSummary state={state} fields={[]} />
      <StatusMessage message={state.status === 'success' ? state.message : undefined} />
      {childLinks.length === 0 ? (
        <p>Aucun enfant rattaché.</p>
      ) : (
        <ul className="space-y-2">
          {childLinks.map((child) => (
            <ChildRow key={child.id} child={child} pending={pending} />
          ))}
        </ul>
      )}
    </form>
  )
}

function ChildRow({ child, pending }: Readonly<{ child: UnionChildViewModel; pending: boolean }>) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-earth-sand bg-white p-3">
      <span>
        <Link href={child.href}>{child.name}</Link> ({child.filiationLabel})
      </span>
      <Button type="submit" name="childId" value={child.id} variant="secondary" disabled={pending}>
        Retirer<span className="sr-only"> {child.name} de cette union</span>
      </Button>
    </li>
  )
}
