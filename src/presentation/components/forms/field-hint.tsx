/** Help shown under a label, linked to its input through `aria-describedby`. */
export function FieldHint({ id, hint }: Readonly<{ id: string; hint: string }>) {
  return (
    <p id={id} className="text-sm text-earth-bark">
      {hint}
    </p>
  )
}
