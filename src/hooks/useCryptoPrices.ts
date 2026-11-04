import { useQuery } from '@tanstack/react-query'
import { useContext } from 'react'
import { api, queryKeys } from '../api/endpoints'
import { LivePricesContext } from './livePricesContext'

/**
 * Latest crypto prices. Kept fresh by the WebSocket in `LivePricesProvider`; while the socket is
 * down, the query polls the REST endpoint instead. `stream` tells the UI which is happening.
 */
export function useCryptoPrices() {
  const stream = useContext(LivePricesContext)
  const live = stream === 'live'
  const query = useQuery({
    queryKey: queryKeys.crypto,
    queryFn: api.cryptoPrices,
    staleTime: live ? Infinity : 10_000,
    refetchInterval: live ? false : 15_000,
  })
  return { ...query, stream }
}
