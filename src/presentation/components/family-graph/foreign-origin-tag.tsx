const TAG_CLASS_NAMES = [
  'absolute -top-3 left-1 z-10 whitespace-nowrap rounded-full px-2 shadow-sm',
  'bg-forest-light text-xs leading-5 font-semibold text-earth-ivory',
]

/** Which tree a merged-in node comes from, in text — never a colour alone (module 3.3). */
export function ForeignOriginTag({ treeName }: Readonly<{ treeName: string }>) {
  return (
    <span className={TAG_CLASS_NAMES.join(' ')}>
      <span aria-hidden="true">↗ </span>
      {treeName}
    </span>
  )
}
