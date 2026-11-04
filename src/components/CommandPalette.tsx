import clsx from 'clsx'
import { ArrowDownLeft, ArrowUpRight, Bell, CandlestickChart, CornerDownLeft, Globe2, LogOut, Search, type LucideIcon } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { useCryptoPrices } from '../hooks/useCryptoPrices'
import { ASSETS } from '../lib/currencies'
import { formatPercent, formatUsdPrice } from '../lib/format'
import { NAV_ITEMS } from '../lib/nav'

interface Command {
  id: string
  group: 'Pages' | 'Trade' | 'Alerts' | 'Account'
  label: string
  /** Extra words that match the search but aren't shown */
  keywords: string
  icon: LucideIcon
  /** Crypto symbol whose live price is shown on the right */
  priceOf?: string
  run: () => void
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const SHORTCUT = isMac ? '⌘K' : 'Ctrl K'

/**
 * Ctrl/⌘+K command palette: jump to any page, start a buy or sell of any asset, set an alert,
 * or log out, from the keyboard. Renders its own trigger button (sidebar search field).
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Search and commands (${SHORTCUT})`}
        title={`Search and commands (${SHORTCUT})`}
        className="flex shrink-0 items-center gap-2 rounded-lg p-2 text-sm text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100 md:mb-4 md:border md:border-ink-700 md:bg-ink-900/60 md:px-3"
      >
        <Search className="size-4" aria-hidden />
        <span className="hidden flex-1 text-left md:inline">Search…</span>
        <kbd className="kbd hidden md:inline">{SHORTCUT}</kbd>
      </button>
      {/* Portal: the sidebar's backdrop-filter would otherwise trap this fixed overlay inside it */}
      {open && createPortal(<PaletteDialog onClose={() => setOpen(false)} />, document.body)}
    </>
  )
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const prices = useCryptoPrices()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()

  // Focus the search box on open; give focus back to where it was on close
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    inputRef.current?.focus()
    return () => previous?.focus?.()
  }, [])

  const commands = useMemo<Command[]>(() => {
    const go = (to: string) => () => navigate(to)
    const list: Command[] = NAV_ITEMS.map((item) => ({
      id: `page-${item.to}`,
      group: 'Pages',
      label: item.label,
      keywords: `go open page ${item.keywords}`,
      icon: item.icon,
      run: go(item.to),
    }))
    list.push(
      { id: 'page-crypto', group: 'Pages', label: 'Crypto markets', keywords: 'go prices bitcoin charts', icon: CandlestickChart, run: go('/markets?view=crypto') },
      { id: 'page-welcome', group: 'Pages', label: 'Landing page', keywords: 'home welcome about', icon: Globe2, run: go('/welcome') },
    )
    for (const asset of ASSETS) {
      if (asset.code === 'USD') continue
      const crypto = asset.type === 'CRYPTO'
      list.push({
        id: `buy-${asset.code}`,
        group: 'Trade',
        label: `Buy ${asset.code}`,
        keywords: `${asset.name} purchase long trade`,
        icon: ArrowDownLeft,
        priceOf: crypto ? asset.code : undefined,
        run: go(`/trade?from=USD&to=${asset.code}`),
      })
      list.push({
        id: `sell-${asset.code}`,
        group: 'Trade',
        label: `Sell ${asset.code}`,
        keywords: `${asset.name} short trade`,
        icon: ArrowUpRight,
        priceOf: crypto ? asset.code : undefined,
        run: go(`/trade?from=${asset.code}&to=USD`),
      })
      list.push({
        id: `alert-${asset.code}`,
        group: 'Alerts',
        label: `Set a price alert on ${asset.code}`,
        keywords: `${asset.name} notify watch`,
        icon: Bell,
        run: go(`/orders?alert=${asset.code}`),
      })
    }
    list.push({ id: 'logout', group: 'Account', label: 'Log out', keywords: 'sign out exit', icon: LogOut, run: logout })
    return list
  }, [navigate, logout])

  // Every typed word must appear in the label or keywords
  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (words.length === 0) return commands.filter((c) => c.group !== 'Alerts' && !c.id.startsWith('sell-'))
    return commands.filter((c) => {
      const haystack = `${c.label} ${c.keywords}`.toLowerCase()
      return words.every((w) => haystack.includes(w))
    })
  }, [commands, query])

  const activeIndex = Math.min(active, Math.max(0, results.length - 1))

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const runCommand = (command: Command | undefined) => {
    if (!command) return
    onClose()
    command.run()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((activeIndex + 1) % Math.max(1, results.length))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((activeIndex - 1 + results.length) % Math.max(1, results.length))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      runCommand(results[activeIndex])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  const priceBySymbol = new Map(prices.data?.prices.map((p) => [p.symbol, p]))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" role="presentation">
      <div className="absolute inset-0 animate-[fade-up_0.2s_ease-out_both] bg-ink-950/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="glass relative w-full max-w-xl animate-fade-up overflow-hidden rounded-2xl border border-ink-700 shadow-[0_30px_80px_-10px_rgb(0_0_0/0.7),0_0_0_1px_rgb(16_185_129/0.15)]"
      >
        <div className="flex items-center gap-3 border-b border-ink-800 px-4">
          <Search className="size-4 shrink-0 text-accent-400" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Search pages, buy BTC, alert on EUR…"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[activeIndex] ? `${listId}-${results[activeIndex].id}` : undefined}
            aria-autocomplete="list"
            className="h-14 flex-1 bg-transparent text-base text-ink-100 placeholder:text-ink-400 focus:outline-none"
          />
          <kbd className="kbd">Esc</kbd>
        </div>

        <ul ref={listRef} id={listId} role="listbox" aria-label="Commands" className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-ink-400">No matches for “{query}”</li>}
          {results.map((command, index) => {
            const Icon = command.icon
            const selected = index === activeIndex
            const price = command.priceOf ? priceBySymbol.get(command.priceOf) : undefined
            const firstOfGroup = index === 0 || results[index - 1]!.group !== command.group
            return (
              <li key={command.id} role="presentation">
                {firstOfGroup && (
                  <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold tracking-[0.16em] text-ink-400 uppercase" aria-hidden>
                    {command.group}
                  </p>
                )}
                <div
                  id={`${listId}-${command.id}`}
                  role="option"
                  aria-selected={selected}
                  onPointerMove={() => setActive(index)}
                  onClick={() => runCommand(command)}
                  className={clsx(
                    'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    selected ? 'bg-accent-500/12 text-ink-100 ring-1 ring-accent-500/25 ring-inset' : 'text-ink-300',
                  )}
                >
                  <Icon className={clsx('size-4 shrink-0', selected ? 'text-accent-300' : 'text-ink-400')} aria-hidden />
                  <span className="flex-1 truncate">{command.label}</span>
                  {price && (
                    <span className="flex items-baseline gap-2 font-mono text-xs tabular-nums">
                      <span className="text-ink-300">{formatUsdPrice(price.priceUsd)}</span>
                      <span className={price.change24h >= 0 ? 'text-accent-300' : 'text-rose-300'}>{formatPercent(price.change24h)}</span>
                    </span>
                  )}
                  {selected && <CornerDownLeft className="size-3.5 text-ink-400" aria-hidden />}
                </div>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-4 border-t border-ink-800 px-4 py-2.5 text-[11px] text-ink-400">
          <span className="flex items-center gap-1.5">
            <kbd className="kbd">↑</kbd>
            <kbd className="kbd">↓</kbd> move
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="kbd">Enter</kbd> open
          </span>
          <span className="ml-auto">
            <kbd className="kbd">{SHORTCUT}</kbd> anytime
          </span>
        </div>
      </div>
    </div>
  )
}
