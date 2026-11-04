import { createContext } from 'react'

/** State of the shared `/ws/prices` WebSocket. */
export type StreamStatus = 'connecting' | 'live' | 'reconnecting'

export const LivePricesContext = createContext<StreamStatus>('connecting')
