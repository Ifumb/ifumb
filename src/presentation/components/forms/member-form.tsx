'use client'

import { useActionState, type ReactNode } from 'react'
import { CheckboxField } from '@/presentation/components/forms/checkbox-field'
import { FormErrorSummary } from '@/presentation/components/forms/form-error-summary'
import { PartialDateField } from '@/presentation/components/forms/partial-date-field'
import { SelectField } from '@/presentation/components/forms/select-field'
import { StatusMessage } from '@/presentation/components/forms/status-message'
import { TextAreaField } from '@/presentation/components/forms/text-area-field'
import { TextField } from '@/presentation/components/forms/text-field'
import { Button } from '@/presentation/components/ui/button'
import type { FormAction } from '@/presentation/forms/form-action'
import type { SubmitLabels } from '@/presentation/forms/form-fields'
import { INITIAL_FORM_STATE } from '@/presentation/forms/form-state'
import {
  BIOGRAPHY_FIELD,
  BIRTH_APPROX_FIELD,
  BIRTH_DATE_FIELD,
  CERTAINTY_FIELD,
  CERTAINTY_OPTIONS,
  DEATH_DATE_FIELD,
  GENDER_FIELD,
  GENDER_OPTIONS,
  MEMBER_FIELD_SPECS as TEXT,
  MEMBER_FORM_FIELDS,
  type MemberFormValues,
  type TextFieldSpec,
} from '@/presentation/forms/member-form'
import { DATE_HINT, MONTH_OPTIONS } from '@/presentation/forms/partial-date-options'

type MemberFormProps = Readonly<{
  action: FormAction
  initialValues: MemberFormValues
  submit: SubmitLabels
}>

type SectionProps = Readonly<{
  values: MemberFormValues
  errorOf: (name: string) => string | undefined
}>

/** Adds or edits a member, in sections; after an error, the form keeps what was typed. */
export function MemberForm({ action, initialValues, submit }: MemberFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  const section = {
    values: { ...initialValues, ...state.values },
    errorOf: (name: string) => state.fieldErrors?.[name]?.[0],
  }
  return (
    <form action={formAction} noValidate className="max-w-2xl space-y-6">
      <FormErrorSummary state={state} fields={MEMBER_FORM_FIELDS} />
      <StatusMessage message={state.status === 'success' ? state.message : undefined} />
      <IdentitySection {...section} />
      <DatesAndPlacesSection {...section} />
      <CultureSection {...section} />
      <BiographyField {...section} />
      <Button type="submit" loading={pending}>
        {pending ? submit.pendingLabel : submit.label}
      </Button>
    </form>
  )
}

function IdentitySection({ values, errorOf }: SectionProps) {
  const text = (spec: TextFieldSpec) => <TextInput key={spec.name} {...{ spec, values, errorOf }} />
  return (
    <Section title="Identité">
      {[TEXT.firstName, TEXT.lastName, TEXT.nickname].map(text)}
      <SelectField
        {...GENDER_FIELD}
        options={GENDER_OPTIONS}
        error={errorOf('gender')}
        defaultValue={values.gender}
      />
      <SelectField
        {...CERTAINTY_FIELD}
        options={CERTAINTY_OPTIONS}
        error={errorOf('certainty')}
        defaultValue={values.certainty}
      />
    </Section>
  )
}

function DatesAndPlacesSection({ values, errorOf }: SectionProps) {
  const date = { hint: DATE_HINT, months: MONTH_OPTIONS, values }
  return (
    <Section title="Dates et lieux">
      <PartialDateField {...BIRTH_DATE_FIELD} {...date} error={errorOf('birthDate')} />
      <CheckboxField {...BIRTH_APPROX_FIELD} defaultChecked={values.birthDateApprox === 'on'} />
      <PartialDateField {...DEATH_DATE_FIELD} {...date} error={errorOf('deathDate')} />
      <TextInput spec={TEXT.birthPlace} {...{ values, errorOf }} />
    </Section>
  )
}

function CultureSection({ values, errorOf }: SectionProps) {
  const fields = [TEXT.tribe, TEXT.clan, TEXT.ethnicity, TEXT.originRegion]
  return (
    <Section title="Culture">
      {fields.map((spec) => (
        <TextInput key={spec.name} {...{ spec, values, errorOf }} />
      ))}
    </Section>
  )
}

function BiographyField({ values, errorOf }: SectionProps) {
  return (
    <TextAreaField
      {...BIOGRAPHY_FIELD}
      error={errorOf('biography')}
      defaultValue={values.biography}
    />
  )
}

function TextInput({ spec, values, errorOf }: SectionProps & Readonly<{ spec: TextFieldSpec }>) {
  return <TextField {...spec} error={errorOf(spec.name)} defaultValue={values[spec.name]} />
}

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-earth-sand bg-white p-4">
      <legend className="px-1 text-xl font-bold">{title}</legend>
      {children}
    </fieldset>
  )
}
