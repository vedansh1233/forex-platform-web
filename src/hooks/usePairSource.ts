import { useQuery } from '@tanstack/react-query'
import { api, queryKeys } from '../api/endpoints'
import type { RatesSource } from '../api/types'
import { isCrypto } from '../lib/currencies'
import { useCryptoPrices } from './useCryptoPrices'

/**
 * Where the rate for a pair comes from, for the SourceBadge: crypto pairs use the crypto feed,
 * currency pairs the ECB; if either side is simulated, the pair is labelled simulated.
 */
export function usePairSource(from: string, to: string): RatesSource | undefined {
  const crypto = isCrypto(from) || isCrypto(to)
  const fiat = (!isCrypto(from) && from !== 'USD') || (!isCrypto(to) && to !== 'USD') || !crypto
  const ratesQuery = useQuery({ queryKey: queryKeys.rates('USD'), queryFn: () => api.rates('USD'), enabled: fiat })
  const cryptoPrices = useCryptoPrices()

  const sources: (RatesSource | undefined)[] = []
  if (fiat) sources.push(ratesQuery.data?.source)
  if (crypto) sources.push(cryptoPrices.data?.source)
  if (sources.some((s) => s === undefined)) return undefined
  if (sources.includes('SIMULATED')) return 'SIMULATED'
  return crypto ? 'COINBASE' : 'ECB'
}
