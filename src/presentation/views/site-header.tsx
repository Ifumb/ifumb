import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="border-b border-earth-sand bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-brand-dark no-underline">
          IFUMB
        </Link>
        <nav aria-label="Site">
          {/* Shown on every page: prefetching it everywhere would cost a search each time. */}
          <Link href="/explore" prefetch={false}>
            Explorer
          </Link>
        </nav>
      </div>
    </header>
  )
}
