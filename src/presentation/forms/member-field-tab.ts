const FIELD_TABS: Readonly<Record<string, number>> = {
  birthDate: 1,
  birthDay: 1,
  birthMonth: 1,
  birthYear: 1,
  birthDateApprox: 1,
  deathDate: 1,
  deathDay: 1,
  deathMonth: 1,
  deathYear: 1,
  birthPlace: 1,
  tribe: 2,
  clan: 2,
  ethnicity: 2,
  originRegion: 2,
  biography: 3,
}

export function memberFieldTab(name: string): number {
  return FIELD_TABS[name] ?? 0
}
