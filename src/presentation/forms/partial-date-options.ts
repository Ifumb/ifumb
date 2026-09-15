/** Help shown with every date typed as day, month and year. */
export const DATE_HINT = 'Laissez vides les parties inconnues : l’année seule suffit.'

/** The months, named in French, for the month part of a date. */
export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: new Intl.DateTimeFormat('fr-FR', { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2000, index, 1)),
  ),
}))
