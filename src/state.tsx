import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_STORE } from './lib/data'

export type Decision = 'verified' | 'dismissed'

interface AppState {
  storeId: string
  setStoreId: (id: string) => void
  decisions: Record<string, Decision>
  decide: (storeId: string, sku: string, d: Decision | null) => void
  walked: Record<string, boolean>
  toggleWalked: (storeId: string, sku: string) => void
}

const Ctx = createContext<AppState | null>(null)

// Deliberately React state only — no localStorage, so a refresh resets the demo for a clean re-record.
export function AppProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreId] = useState(DEFAULT_STORE)
  const [decisions, setDecisions] = useState<Record<string, Decision>>({})
  const [walked, setWalked] = useState<Record<string, boolean>>({})

  const decide = useCallback((s: string, sku: string, d: Decision | null) => {
    setDecisions((prev) => {
      const next = { ...prev }
      if (d) next[`${s}:${sku}`] = d
      else delete next[`${s}:${sku}`]
      return next
    })
  }, [])

  const toggleWalked = useCallback((s: string, sku: string) => {
    setWalked((prev) => ({ ...prev, [`${s}:${sku}`]: !prev[`${s}:${sku}`] }))
  }, [])

  const value = useMemo(
    () => ({ storeId, setStoreId, decisions, decide, walked, toggleWalked }),
    [storeId, decisions, decide, walked, toggleWalked],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp outside AppProvider')
  return v
}
