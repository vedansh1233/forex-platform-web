import type { ReactNode } from 'react'
import { Logo } from './Logo'
import { trackPointer } from '../lib/pointer'
import { Highlight } from './ui'

const HERO_ASSETS = ['USD', 'EUR', 'BTC', 'ETH']

/** Login and register layout: a hero panel beside the form card (stacked on small screens). */
export function AuthShell({ title, subtitle, children, footer }: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="mx-auto grid min-h-dvh max-w-6xl items-center gap-12 px-4 py-10 lg:grid-cols-[1.1fr_1fr] lg:px-10">
      <section className="stagger hidden lg:block" aria-label="About FX Desk">
        <Logo />
        <p className="eyebrow mt-12">Paper trading · Live prices · Zero risk</p>
        <h2 className="mt-4 font-display text-5xl leading-[1.1] font-semibold tracking-tight">
          Trade the world's <Highlight>markets</Highlight> without risking a cent.
        </h2>
        <p className="mt-6 max-w-md text-ink-300">
          Start with $10,000 in virtual USD. Trade 8 currencies and 5 cryptocurrencies, set limit orders and price alerts.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <div className="flex -space-x-2" aria-hidden>
            {HERO_ASSETS.map((code) => (
              <span
                key={code}
                className="grid size-9 place-items-center rounded-full border-2 border-ink-950 bg-ink-700 font-mono text-[10px] font-semibold text-ink-100"
              >
                {code}
              </span>
            ))}
          </div>
          <p className="text-sm text-ink-400">
            <span className="font-semibold text-accent-300">13 assets</span> streaming in real time
          </p>
        </div>
      </section>

      <div className="stagger mx-auto w-full max-w-sm">
        <div className="mb-8 flex justify-center lg:hidden">
          <Logo />
        </div>
        <div
          onPointerMove={trackPointer}
          className="glass spotlight rounded-2xl border border-ink-700 p-6 shadow-2xl shadow-black/40 sm:p-8"
        >
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-ink-400">{subtitle}</p>
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-ink-400">{footer}</p>
      </div>
    </div>
  )
}
