import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { API_URL } from '../api/client'
import { queryKeys } from '../api/endpoints'
import type { CryptoPricesResponse } from '../api/types'
import { LivePricesContext, type StreamStatus } from '../hooks/livePricesContext'

const WS_URL = `${API_URL.replace(/^http/, 'ws')}/ws/prices`

/**
 * Opens the one WebSocket to `/ws/prices` for the whole app and writes every message into the
 * `queryKeys.crypto` query cache, so anything reading that query updates in real time.
 * Reconnects with exponential backoff (1s, 2s, 4s ... 30s).
 */
export function LivePricesProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<StreamStatus>('connecting')

  useEffect(() => {
    let socket: WebSocket | null = null
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let attempt = 0
    let disposed = false

    const connect = () => {
      socket = new WebSocket(WS_URL)
      socket.onopen = () => {
        attempt = 0
        setStatus('live')
      }
      socket.onmessage = (event) => {
        try {
          queryClient.setQueryData<CryptoPricesResponse>(queryKeys.crypto, JSON.parse(event.data as string))
        } catch {
          // Ignore malformed messages
        }
      }
      socket.onclose = () => {
        if (disposed) return
        setStatus('reconnecting')
        retryTimer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** attempt++))
      }
    }
    connect()

    return () => {
      disposed = true
      clearTimeout(retryTimer)
      socket?.close()
    }
  }, [queryClient])

  return <LivePricesContext.Provider value={status}>{children}</LivePricesContext.Provider>
}
