import clsx from 'clsx'
import { ArrowLeftRight, Calculator, CandlestickChart, History, LayoutDashboard, ListChecks, LogOut, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { initials } from '../lib/format'
import { AlertBell } from './AlertBell'
import { LivePricesProvider } from './LivePricesProvider'
import { Logo } from './Logo'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/markets', label: 'Markets', icon: CandlestickChart, end: false },
  { to: '/trade', label: 'Trade', icon: ArrowLeftRight, end: false },
  { to: '/orders', label: 'Orders', icon: ListChecks, end: false },
  { to: '/tools', label: 'Tools', icon: Calculator, end: false },
  { to: '/history', label: 'History', icon: History, end: false },
  { to: '/profile', label: 'Profile', icon: UserRound, end: false },
]

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <LivePricesProvider>
      <div className="min-h-dvh md:grid md:grid-cols-[15rem_1fr]">
        {/* Sidebar (desktop) / top bar (mobile) */}
        <aside className="glass sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-ink-800 px-3 py-3 md:h-dvh md:flex-col md:items-stretch md:justify-start md:border-r md:border-b-0 md:px-4 md:py-6">
          <div className="shrink-0 md:mb-8 md:px-2">
            <Logo compact />
          </div>

          <nav
            className="flex min-w-0 gap-0.5 overflow-x-auto [scrollbar-width:none] md:flex-col md:gap-1 md:overflow-visible"
            aria-label="Main"
          >
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                aria-label={label}
                title={label}
                className={({ isActive }) =>
                  clsx(
                    'group relative flex shrink-0 items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors md:px-3',
                    isActive
                      ? 'bg-accent-500/10 text-ink-100 ring-1 ring-accent-500/25 ring-inset'
                      : 'text-ink-400 hover:bg-ink-800/60 hover:text-ink-100',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Glowing rail on the active item (desktop sidebar only) */}
                    <span
                      className={clsx(
                        'absolute top-1/2 -left-4 hidden h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent-400 shadow-[0_0_12px_2px_rgb(52_211_153/0.6)] transition-opacity md:block',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                      aria-hidden
                    />
                    <Icon
                      className={clsx('size-4 transition-transform duration-300 group-hover:scale-110', isActive && 'text-accent-300')}
                      aria-hidden
                    />
                    {/* Icons only in the mobile top bar; labels in the desktop sidebar */}
                    <span className="hidden transition-transform duration-300 group-hover:translate-x-0.5 md:inline">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 md:mt-auto md:border-t md:border-ink-800 md:pt-4">
            {user && (
              <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-xs font-semibold text-ink-950 ring-2 ring-accent-500/20">
                  {initials(user.fullName)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.fullName}</p>
                  <p className="truncate text-xs text-ink-400">{user.email}</p>
                </div>
              </div>
            )}
            <AlertBell />
            <button
              type="button"
              onClick={logout}
              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        </aside>

        <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
          <Outlet />
        </main>
      </div>
    </LivePricesProvider>
  )
}
