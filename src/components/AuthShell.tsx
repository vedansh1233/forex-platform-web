import type { ReactNode } from 'react'
import { Logo } from './Logo'

/** Centered card layout shared by the login and register pages. */
export function AuthShell({ title, subtitle, children, footer }: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-ink-700 bg-ink-900 p-6 shadow-2xl shadow-black/40 sm:p-8">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-ink-400">{subtitle}</p>
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-ink-400">{footer}</p>
      </div>
    </div>
  )
}
