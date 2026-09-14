/** A field's error message, linked to its input through `aria-describedby`. */
export function FieldError({ id, message }: Readonly<{ id: string; message: string }>) {
  return (
    <p id={id} className="flex items-start gap-1 text-sm font-medium text-brand-dark">
      <span aria-hidden="true">⚠</span>
      {message}
    </p>
  )
}
