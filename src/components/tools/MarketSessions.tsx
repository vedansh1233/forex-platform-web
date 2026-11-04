import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { Card } from '../ui'
import { SESSIONS, formatDuration, sessionStatus } from '../../lib/fx'

/** Which major FX centres are open right now, with their local time and a countdown. */
export function MarketSessions() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const statuses = SESSIONS.map((s) => sessionStatus(s, now))
  const openNames = statuses.filter((s) => s.isOpen).map((s) => s.session.name)
  const overlap = openNames.includes('London') && openNames.includes('New York')

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-semibold">Market sessions</h2>
        <p className="mt-0.5 text-sm text-ink-400">
          {overlap
            ? 'London and New York overlap: usually the busiest, most liquid hours of the day.'
            : openNames.length > 0
              ? `Open now: ${openNames.join(', ')}.`
              : 'All major centres are closed right now.'}
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {statuses.map(({ session, isOpen, localTime, minutesToChange }) => (
          <li key={session.name} className="flex items-center gap-3 rounded-xl bg-ink-800/60 px-4 py-3">
            <span
              className={clsx('size-2.5 shrink-0 rounded-full', isOpen ? 'bg-accent-400 shadow-[0_0_0_4px] shadow-accent-500/20' : 'bg-ink-600')}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{session.name}</p>
              <p className="text-xs text-ink-400">
                {String(session.open).padStart(2, '0')}:00–{session.close}:00 local · now {localTime}
              </p>
            </div>
            <div className="text-right">
              <p className={clsx('text-xs font-semibold', isOpen ? 'text-accent-300' : 'text-ink-400')}>{isOpen ? 'Open' : 'Closed'}</p>
              <p className="text-xs whitespace-nowrap text-ink-400">
                {isOpen ? 'closes' : 'opens'} in {formatDuration(minutesToChange)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-400">Typical local business hours, Monday to Friday. Forex trades 24 hours a day on weekdays as the sessions hand over.</p>
    </Card>
  )
}
