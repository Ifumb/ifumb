import type { FormFieldConfig, SubmitLabels } from '@/presentation/forms/form-fields'

type FormConfig = { readonly fields: readonly FormFieldConfig[]; readonly submit: SubmitLabels }

const email: FormFieldConfig = {
  name: 'email',
  label: 'Email',
  type: 'email',
  autoComplete: 'email',
}

export const REGISTER_FORM: FormConfig = {
  fields: [
    { name: 'firstName', label: 'Prénom', autoComplete: 'given-name' },
    { name: 'lastName', label: 'Nom', autoComplete: 'family-name' },
    email,
    { name: 'password', label: 'Mot de passe', type: 'password', autoComplete: 'new-password' },
  ],
  submit: { label: 'Créer mon compte', pendingLabel: 'Création…' },
}

export const LOGIN_FORM: FormConfig = {
  fields: [
    email,
    { name: 'password', label: 'Mot de passe', type: 'password', autoComplete: 'current-password' },
  ],
  submit: { label: 'Se connecter', pendingLabel: 'Connexion…' },
}

export const FORGOT_PASSWORD_FORM: FormConfig = {
  fields: [email],
  submit: { label: 'Envoyer le lien', pendingLabel: 'Envoi…' },
}

export const RESET_PASSWORD_FORM: FormConfig = {
  fields: [
    {
      name: 'newPassword',
      label: 'Nouveau mot de passe',
      type: 'password',
      autoComplete: 'new-password',
    },
    {
      name: 'confirmPassword',
      label: 'Confirmer le mot de passe',
      type: 'password',
      autoComplete: 'new-password',
    },
  ],
  submit: { label: 'Réinitialiser', pendingLabel: 'Enregistrement…' },
}

export const CHANGE_PASSWORD_FORM: FormConfig = {
  fields: [
    {
      name: 'currentPassword',
      label: 'Mot de passe actuel',
      type: 'password',
      autoComplete: 'current-password',
    },
    {
      name: 'newPassword',
      label: 'Nouveau mot de passe',
      type: 'password',
      autoComplete: 'new-password',
    },
    {
      name: 'confirmPassword',
      label: 'Confirmer le nouveau mot de passe',
      type: 'password',
      autoComplete: 'new-password',
    },
  ],
  submit: { label: 'Modifier le mot de passe', pendingLabel: 'Enregistrement…' },
}
