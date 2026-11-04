import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { ApiError, setToken } from '../api/client'
import { api, queryKeys } from '../api/endpoints'
import { useAuth } from '../auth/useAuth'

/** What the demo setup is doing right now, shown on the button that started it. */
export type DemoStep = 'account' | 'wallet' | 'trades' | 'orders'

export const DEMO_STEP_LABELS: Record<DemoStep, string> = {
  account: 'Creating a demo account…',
  wallet: 'Funding $10,000 wallet…',
  trades: 'Placing sample trades…',
  orders: 'Setting a limit order and alert…',
}

/** Starter portfolio bought from the $10,000, so the dashboard isn't empty on first look. */
const STARTER_TRADES = [
  { to: 'BTC', amount: 2500 },
  { to: 'ETH', amount: 1500 },
  { to: 'EUR', amount: 1200 },
  { to: 'SOL', amount: 600 },
]

function randomId(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => (b % 36).toString(36)).join('')
}

/**
 * One-click demo: registers a throwaway account (random email and password, never shown),
 * opens the wallet, buys a starter portfolio, then places one limit order and one price alert,
 * and lands on the dashboard. Each step updates `step` so the UI can narrate it.
 */
export function useDemoLogin() {
  const { startSession } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [step, setStep] = useState<DemoStep | null>(null)
  const [error, setError] = useState<string | null>(null)

  const start = useCallback(async () => {
    setError(null)
    try {
      setStep('account')
      const auth = await api.register({
        fullName: 'Demo Trader',
        email: `demo-${randomId(10)}@demo.fxdesk.app`,
        password: randomId(24),
      })
      // Authorize the setup calls below, but don't sign in yet: signing in redirects to the
      // dashboard, which should only appear once the portfolio is ready.
      setToken(auth.token)

      setStep('wallet')
      let wallet = await api.createWallet()

      setStep('trades')
      for (const trade of STARTER_TRADES) {
        wallet = (await api.convert({ from: 'USD', to: trade.to, amount: trade.amount })).wallet
      }
      queryClient.setQueryData(queryKeys.wallet, wallet)

      // Best effort: the account is usable even if these fail
      setStep('orders')
      try {
        const { rate: btcUsd } = await api.quote('BTC', 'USD')
        const btc = wallet.holdings.find((h) => h.currency === 'BTC')?.amount ?? 0
        await Promise.all([
          // Take profit: sell a fifth of the BTC if it rises 4%
          api.placeOrder({ from: 'BTC', to: 'USD', amount: Math.floor(btc * 0.2 * 1e8) / 1e8, targetRate: Math.round(btcUsd * 1.04 * 100) / 100 }),
          api.createAlert({ base: 'BTC', quote: 'USD', direction: 'ABOVE', targetRate: Math.round(btcUsd * 1.02 * 100) / 100 }),
        ])
      } catch {
        // Ignore: the starter trades are what matter
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
      startSession(auth)
      navigate('/', { replace: true })
    } catch (err) {
      setToken(null)
      setError(err instanceof ApiError ? err.message : 'Could not start the demo. Is the backend running?')
      setStep(null)
    }
  }, [startSession, queryClient, navigate])

  return { start, step, pending: step !== null, error }
}
