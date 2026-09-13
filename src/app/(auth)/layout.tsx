import type { ReactNode } from 'react'

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="mx-auto max-w-md space-y-6">{children}</div>
}
