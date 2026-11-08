import type { UpdateDeathDirectiveError } from '@/core/use-cases/update-death-directive'

export const DEATH_DIRECTIVE_SAVED_MESSAGE = 'Vos souhaits ont été enregistrés.'

export const DEATH_DIRECTIVE_ERRORS: Readonly<Record<UpdateDeathDirectiveError['kind'], string>> = {
  USER_NOT_FOUND: 'Votre session a expiré. Reconnectez-vous puis réessayez.',
  DIRECTIVE_TOO_LONG: 'Ce texte est trop long.',
}
