type SubmitButtonProps = Readonly<{
  label: string
  pendingLabel: string
  pending: boolean
}>

export function SubmitButton({ label, pendingLabel, pending }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="min-h-11 w-full rounded-md bg-brand-dark px-4 py-2 font-semibold text-earth-ivory disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}
