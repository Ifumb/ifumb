import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="border-b border-earth-sand bg-white">
      <div className="mx-auto flex max-w-5xl items-center px-4 py-3">
        <Link href="/" className="text-xl font-bold text-brand-dark no-underline">
          IFUMB
        </Link>
      </div>
    </header>
  )
}
