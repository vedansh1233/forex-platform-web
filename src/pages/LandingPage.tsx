import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpenText,
  Calculator,
  Code2,
  Database,
  Globe2,
  Layers,
  Radio,
  ShieldCheck,
  Target,
  type LucideIcon,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router'
import { API_URL } from '../api/client'
import { api, queryKeys } from '../api/endpoints'
import { useAuth } from '../auth/useAuth'
import { CountUp } from '../components/CountUp'
import { DemoButton } from '../components/DemoButton'
import { LivePrice, StreamIndicator } from '../components/LivePrice'
import { LivePricesProvider } from '../components/LivePricesProvider'
import { Logo } from '../components/Logo'
import { RateChart } from '../components/RateChart'
import { SourceBadge } from '../components/SourceBadge'
import { Highlight } from '../components/ui'
import { useCryptoPrices } from '../hooks/useCryptoPrices'
import { useReveal } from '../hooks/useReveal'
import { formatPercent, formatRate } from '../lib/format'
import { resetTilt, tiltToPointer, trackPointer } from '../lib/pointer'

/** Public home page: live data up front, a one-click demo, and how the app is built. */
export function LandingPage() {
  const revealRef = useReveal<HTMLDivElement>()

  return (
    <LivePricesProvider>
      <div ref={revealRef} className="overflow-x-clip">
        <TopNav />
        <main>
          <Hero />
          <TickerStrip />
          <Stats />
          <Features />
          <Architecture />
          <FinalCta />
        </main>
        <footer className="border-t border-ink-800 py-8 text-center text-xs text-ink-400">
          FX Desk is a portfolio project: demo money only, nothing here is financial advice.
        </footer>
      </div>
    </LivePricesProvider>
  )
}

function TopNav() {
  const { status } = useAuth()
  return (
    <header className="sticky top-3 z-30 mx-auto mt-3 flex max-w-6xl items-center justify-between gap-3 px-4">
      <div className="glass flex w-full items-center justify-between gap-4 rounded-2xl border border-ink-700/70 px-4 py-2.5">
        <Link to="/welcome" aria-label="FX Desk home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 text-sm text-ink-300 md:flex" aria-label="Sections">
          {[
            ['#features', 'Features'],
            ['#markets', 'Live markets'],
            ['#stack', 'How it’s built'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-lg px-3 py-1.5 transition-colors hover:bg-ink-800 hover:text-ink-100">
              {label}
            </a>
          ))}
        </nav>
        {status === 'authenticated' ? (
          <Link to="/" className="btn-glow inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-ink-950">
            Open dashboard <ArrowRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <div className="flex items-center gap-1">
            <Link to="/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-300 hover:text-ink-100">
              Log in
            </Link>
            <Link to="/register" className="hidden h-9 items-center rounded-lg bg-ink-700 px-4 text-sm font-semibold hover:bg-ink-600 sm:inline-flex">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

function Hero() {
  const { status } = useAuth()
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-12 px-4 pt-16 pb-12 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
      <div className="stagger text-center lg:text-left">
        <p className="eyebrow">Paper trading · Live prices · Zero risk</p>
        <h1 className="mt-5 text-4xl leading-[1.08] font-semibold tracking-tight sm:text-6xl">
          Trade the world’s <Highlight>markets</Highlight> <span className="text-shine">in real time.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-300 lg:mx-0">
          A full-stack forex and crypto trading desk: live WebSocket prices, limit orders that fill on their own, price alerts and a
          pro toolkit, all on a $10,000 demo wallet.
        </p>
        <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:items-start lg:justify-start">
          {status === 'authenticated' ? (
            <Link to="/" className="btn-glow inline-flex h-13 items-center gap-2 rounded-xl px-7 text-base font-semibold text-ink-950">
              Open your dashboard <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <DemoButton size="lg" />
          )}
          <a
            href="#stack"
            className="inline-flex h-13 items-center gap-2 rounded-xl border border-ink-700 px-6 text-base font-semibold text-ink-100 transition-colors hover:border-ink-600 hover:bg-ink-800/60"
          >
            <Code2 className="size-4" aria-hidden />
            See how it’s built
          </a>
        </div>
      </div>
      <HeroPriceCard />
    </section>
  )
}

/** Live BTC card with a 30-day chart; leans toward the pointer. */
function HeroPriceCard() {
  const prices = useCryptoPrices()
  const history = useQuery({ queryKey: queryKeys.cryptoHistory('BTC', 30), queryFn: () => api.cryptoHistory('BTC', 30) })
  const btc = prices.data?.prices.find((p) => p.symbol === 'BTC')

  return (
    <div className="animate-fade-up [animation-delay:250ms]" onPointerMove={tiltToPointer} onPointerLeave={resetTilt}>
      <div
        className="tilt spotlight relative rounded-3xl border border-ink-700 bg-ink-900/80 p-6 shadow-[0_30px_80px_-20px_rgb(16_185_129/0.25)]"
        onPointerMove={trackPointer}
      >
        <div className="pointer-events-none absolute -inset-px -z-10 rounded-3xl bg-gradient-to-br from-accent-400/30 via-transparent to-transparent" aria-hidden />
        <div className="flex flex-wrap-reverse items-start justify-between gap-x-4 gap-y-2">
          <div>
            <p className="flex items-center gap-2 text-sm text-ink-400">
              <span className="font-mono font-semibold text-ink-100">BTC/USD</span> Bitcoin
            </p>
            <div className="mt-2 flex items-baseline gap-3">
              {btc ? <LivePrice price={btc.priceUsd} className="text-3xl font-semibold" /> : <span className="h-9 w-40 animate-pulse rounded bg-ink-800" />}
              {btc && (
                <span className={btc.change24h >= 0 ? 'font-mono text-sm text-accent-300' : 'font-mono text-sm text-rose-300'}>
                  {formatPercent(btc.change24h)} 24h
                </span>
              )}
            </div>
          </div>
          <StreamIndicator status={prices.stream} />
        </div>
        <div className="mt-4">
          {history.data ? (
            <RateChart points={history.data.points} pair="BTC/USD" height={220} />
          ) : (
            <div className="h-[220px] animate-pulse rounded-xl bg-ink-800/60" aria-label="Loading chart" />
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          {prices.data && <SourceBadge source={prices.data.source} />}
          <span className="text-xs text-ink-400">30-day daily closes</span>
        </div>
      </div>
    </div>
  )
}

/** Every crypto price plus the major FX rates against USD, scrolling in a loop. */
function TickerStrip() {
  const prices = useCryptoPrices()
  const rates = useQuery({ queryKey: queryKeys.rates('USD'), queryFn: () => api.rates('USD') })

  const items: { key: string; label: string; value: ReactNode; change?: number }[] = [
    ...(prices.data?.prices.map((p) => ({
      key: p.symbol,
      label: `${p.symbol}/USD`,
      value: <LivePrice price={p.priceUsd} className="text-sm" />,
      change: p.change24h,
    })) ?? []),
    ...Object.entries(rates.data?.rates ?? {}).map(([code, rate]) => ({
      key: code,
      label: `USD/${code}`,
      value: <span className="font-mono text-sm tabular-nums">{formatRate(rate)}</span>,
    })),
  ]

  return (
    <section id="markets" aria-label="Live market prices" className="scroll-mt-24 border-y border-ink-800 bg-ink-900/50 py-4">
      {items.length === 0 ? (
        <div className="mx-auto h-6 max-w-6xl animate-pulse rounded bg-ink-800/60" />
      ) : (
        <div className="marquee">
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0" aria-hidden={copy > 0 || undefined}>
                {items.map((item) => (
                  <li key={item.key} className="flex shrink-0 items-baseline gap-2 border-r border-ink-700/70 px-6">
                    <span className="font-mono text-xs font-semibold text-ink-400">{item.label}</span>
                    {item.value}
                    {item.change !== undefined && (
                      <span className={item.change >= 0 ? 'font-mono text-xs text-accent-300' : 'font-mono text-xs text-rose-300'}>
                        {formatPercent(item.change)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

const STATS: { value: number; format: (n: number) => string; label: string }[] = [
  { value: 13, format: (n) => Math.round(n).toString(), label: 'tradable assets: 8 currencies, 5 crypto' },
  { value: 5, format: (n) => `${Math.round(n)}s`, label: 'live price refresh over WebSocket' },
  { value: 10000, format: (n) => `$${Math.round(n).toLocaleString('en-US')}`, label: 'demo balance to start trading' },
  { value: 21, format: (n) => Math.round(n).toString(), label: 'documented REST endpoints' },
]

function Stats() {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-16 md:grid-cols-4">
      {STATS.map((stat, i) => (
        <div key={stat.label} data-reveal style={{ '--reveal-delay': `${i * 90}ms` } as CSSProperties} className="text-center">
          <CountUp value={stat.value} format={stat.format} className="font-display text-4xl font-semibold tracking-tight text-ink-100 sm:text-5xl" />
          <p className="mx-auto mt-2 max-w-[14rem] text-sm text-ink-400">{stat.label}</p>
        </div>
      ))}
    </section>
  )
}

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Radio, title: 'Live prices, streamed', body: 'Coinbase prices pushed over a WebSocket every 5 seconds, with ECB reference rates for currencies and automatic fallback.' },
  { icon: Target, title: 'Limit orders', body: 'Set a target rate and walk away. A background matcher fills orders under a row lock, so a cancel can never race a fill.' },
  { icon: Bell, title: 'Price alerts', body: 'Above or below any pair. Alerts fire exactly once and show up as live notifications while you browse.' },
  { icon: Calculator, title: 'Pro toolkit', body: 'Pip and position-size calculators, a cross-rate matrix, currency strength, correlation and market sessions.' },
  { icon: BookOpenText, title: 'Immutable ledger', body: 'Every deposit and conversion is an append-only transaction, with amounts in BigDecimal and exact per-asset precision.' },
  { icon: ShieldCheck, title: 'Secure by default', body: 'Stateless JWT auth, BCrypt passwords, validated inputs and one consistent JSON error shape across the API.' },
]

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16">
      <div data-reveal className="text-center">
        <p className="eyebrow">Features</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything a <Highlight>trading desk</Highlight> needs
        </h2>
      </div>
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }, i) => (
          <li
            key={title}
            data-reveal
            style={{ '--reveal-delay': `${(i % 3) * 90}ms` } as CSSProperties}
            onPointerMove={trackPointer}
            className="spotlight group rounded-2xl border border-ink-700 bg-ink-900/70 p-6 transition-[border-color,translate] duration-300 hover:-translate-y-1 hover:border-accent-500/40"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-accent-500/10 text-accent-300 ring-1 ring-accent-500/20 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
              <Icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-5 font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-400">{body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function StackNode({ icon: Icon, title, items, className }: { icon: LucideIcon; title: string; items: string[]; className?: string }) {
  return (
    <div
      onPointerMove={trackPointer}
      className={`spotlight rounded-2xl border border-ink-700 bg-ink-900/80 p-5 transition-colors duration-300 hover:border-accent-500/40 ${className ?? ''}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-lg bg-accent-500/10 text-accent-300">
          <Icon className="size-4.5" aria-hidden />
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li key={item} className="rounded-md border border-ink-700 bg-ink-800/70 px-2 py-0.5 font-mono text-[11px] text-ink-300">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Architecture diagram: browser ⇄ API ⇄ data sources, with flowing connectors. */
function Architecture() {
  return (
    <section id="stack" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16">
      <div data-reveal className="text-center">
        <p className="eyebrow">How it’s built</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          A real <Highlight>full-stack</Highlight> system
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-ink-400">
          A React single-page app talks to a Spring Boot API over REST and a WebSocket. The API owns the money rules, prices every pair
          and runs the background matching jobs.
        </p>
      </div>

      <div data-reveal className="mt-12 grid items-center gap-4 lg:grid-cols-[1fr_auto_1.15fr_auto_1fr]">
        <StackNode icon={Globe2} title="Web app" items={['React 19', 'TypeScript', 'TanStack Query', 'Tailwind v4', 'Vite']} />
        <Connector label="REST + JWT · WebSocket" />
        <StackNode
          icon={Layers}
          title="Spring Boot API"
          items={['Java 21', 'Spring Boot 3.5', 'Spring Security', 'JPA', 'Scheduled jobs', 'OpenAPI']}
          className="ring-1 ring-accent-500/30"
        />
        <Connector label="SQL · HTTPS" />
        <div className="grid gap-4">
          <StackNode icon={Database} title="PostgreSQL" items={['Flyway migrations', 'Row locks']} />
          <StackNode icon={Radio} title="Market data" items={['Coinbase Exchange', 'ECB via Frankfurter']} />
        </div>
      </div>

      <div data-reveal className="mt-10 flex flex-wrap justify-center gap-3">
        <a
          href={`${API_URL}/swagger-ui.html`}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-900/70 px-4 py-2.5 text-sm font-medium transition-colors hover:border-accent-500/40"
        >
          Explore the API in Swagger
          <ArrowUpRight className="size-4 text-accent-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </a>
      </div>
    </section>
  )
}

function Connector({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center" aria-hidden>
      <div className="wire-v h-10 lg:hidden" />
      <div className="wire hidden w-24 lg:block" />
      <span className="max-w-[8rem] font-mono text-[10px] leading-tight text-ink-400">{label}</span>
    </div>
  )
}

function FinalCta() {
  const { status } = useAuth()
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div
        data-reveal
        onPointerMove={trackPointer}
        className="spotlight relative overflow-hidden rounded-3xl border border-accent-500/30 bg-gradient-to-br from-accent-500/15 via-ink-900 to-ink-900 px-6 py-14 text-center"
      >
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">See it running in under 5 seconds</h2>
        <p className="mx-auto mt-3 max-w-lg text-ink-300">One click opens a funded account with a starter portfolio, an open limit order and a live price alert.</p>
        <div className="mt-8 flex justify-center">
          {status === 'authenticated' ? (
            <Link to="/" className="btn-glow inline-flex h-13 items-center gap-2 rounded-xl px-7 text-base font-semibold text-ink-950">
              Open your dashboard <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <DemoButton size="lg" />
          )}
        </div>
      </div>
    </section>
  )
}
