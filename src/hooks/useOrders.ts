import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { api, queryKeys } from '../api/endpoints'

/**
 * The user's limit orders, polled every 10 seconds (the backend matches orders every 10 seconds).
 * When an order fills or fails, the wallet and history are refetched so balances stay in sync.
 */
export function useOrders() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: queryKeys.orders, queryFn: api.orders, refetchInterval: 10_000 })

  const closedKey = query.data
    ?.filter((o) => o.status !== 'OPEN')
    .map((o) => `${o.id}:${o.status}`)
    .join()
  const previous = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (closedKey === undefined) return
    if (previous.current !== undefined && previous.current !== closedKey) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallet })
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
    }
    previous.current = closedKey
  }, [closedKey, queryClient])

  return query
}
