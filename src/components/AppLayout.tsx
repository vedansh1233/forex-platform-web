import clsx from 'clsx'
import { LayoutDashboard, LogOut, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { initials } from '../lib/format'
import { Logo } from './Logo'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/profile', label: 'Profile', icon: UserRound, end: false },
]

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_1fr]">
      {/* Sidebar (desktop) / top bar (mobile) */}
      <aside className="flex items-center justify-between gap-4 border-b border-ink-800 bg-ink-900/60 px-4 py-3 md:flex-col md:items-stretch md:justify-start md:border-r md:border-b-0 md:px-4 md:py-6">
        <div className="md:mb-8 md:px-2">
          <Logo />
        </div>

        <nav className="flex gap-1 md:flex-col" aria-label="Main">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-ink-800 text-ink-100' : 'text-ink-400 hover:bg-ink-800/60 hover:text-ink-100',
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:mt-auto md:border-t md:border-ink-800 md:pt-4">
          {user && (
            <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-700 text-xs font-semibold">
                {initials(user.fullName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.fullName}</p>
                <p className="truncate text-xs text-ink-400">{user.email}</p>
              </div>
            </div>
          )}
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
  )
}
