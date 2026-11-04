import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { FullPageSpinner } from './ui'

/** Only signed-in users; others are sent to /login and returned afterwards. */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'anonymous') {
    // The home page sends visitors to the public landing page; deep links go to login and back
    if (location.pathname === '/') return <Navigate to="/welcome" replace />
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

/** Only signed-out users (login/register); signed-in users go to the dashboard. */
export function RequireGuest() {
  const { status } = useAuth()

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'authenticated') return <Navigate to="/" replace />
  return <Outlet />
}
