'use client'

import { useEffect, useRef } from 'react'
import { fieldId } from '@/presentation/components/forms/text-field'
import type { FormFieldConfig } from '@/presentation/forms/form-fields'
import type { FormState } from '@/presentation/forms/form-state'

type FormErrorSummaryProps = Readonly<{
  state: FormState
  onFieldFocus?: (name: string) => void
  fields: readonly Pick<FormFieldConfig, 'name' | 'label'>[]
}>

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
export function FormErrorSummary({ state, fields, onFieldFocus }: FormErrorSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null)
  const fieldItems = fields.flatMap(({ name, label }) => {
    const message = state.fieldErrors?.[name]?.[0]
    return message ? [{ name, label, message }] : []
  })
  const count = fieldItems.length + (state.message ? 1 : 0)
  const hasErrors = state.status === 'error' && count > 0

  useEffect(() => {
    if (hasErrors) summaryRef.current?.focus()
  }, [state, hasErrors])

  if (!hasErrors) return null

  return (
    <div
      ref={summaryRef}
      tabIndex={-1}
      role="alert"
      className="space-y-2 rounded-md border-2 border-brand-dark bg-white p-4"
    >
      <p className="font-semibold">
        <span aria-hidden="true">⚠ </span>
        Le formulaire contient {count} erreur{count > 1 ? 's' : ''}
      </p>
      <ul className="list-disc space-y-1 pl-5">
        {state.message && <li>{state.message}</li>}
        {fieldItems.map(({ name, label, message }) => (
          <li key={name}>
            <a
              href={`#${fieldId(name)}`}
              onClick={
                onFieldFocus
                  ? (event) => {
                      event.preventDefault()
                      onFieldFocus(name)
                      requestAnimationFrame(() => document.getElementById(fieldId(name))?.focus())
                    }
                  : undefined
              }
            >{`${label} : ${message}`}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
