import { useAuth } from '../auth/useAuth'
import { Button, Card } from '../components/ui'
import { formatDate, initials } from '../lib/format'

export function ProfilePage() {
  const { user, logout } = useAuth()
  if (!user) return null

  const rows: [string, string][] = [
    ['Full name', user.fullName],
    ['Email', user.email],
    ['Role', user.role],
    ['Member since', formatDate(user.createdAt)],
    ['Account ID', `#${user.id}`],
  ]

  return (
    <div className="stagger flex flex-col gap-8">
      <header>
        <p className="eyebrow">Account</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Profile</h1>
      </header>

      <Card>
        <div className="mb-6 flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-ink-700 text-lg font-semibold">
            {initials(user.fullName)}
          </span>
          <div>
            <p className="text-lg font-semibold">{user.fullName}</p>
            <p className="text-sm text-ink-400">{user.email}</p>
          </div>
        </div>

        <dl className="divide-y divide-ink-800 border-t border-ink-800">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
              <dt className="text-sm text-ink-400">{label}</dt>
              <dd className="text-sm font-medium break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div>
        <Button variant="secondary" onClick={logout}>
          Log out
        </Button>
      </div>
    </div>
  )
}
