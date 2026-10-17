import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

export type Role = 'manager' | 'ops' | 'evaluator'

export interface DemoUser {
  email: string
  password: string
  role: Role
  name: string
  scope: string
  storeLock?: string
  startsTour?: boolean
}

/** Hard-coded demo accounts. There is no backend; nothing is sent anywhere. */
export const DEMO_USERS: DemoUser[] = [
  {
    email: 'judge@phantom.demo',
    password: 'demo2026',
    role: 'evaluator',
    name: 'Evaluator',
    scope: 'All 25 stores, starts the guided walkthrough',
    startsTour: true,
  },
  {
    email: 'manager.s14@phantom.demo',
    password: 'walk20',
    role: 'manager',
    name: 'Store manager',
    scope: 'Store 14, Koramangala only',
    storeLock: '14',
  },
  {
    email: 'ops.south@phantom.demo',
    password: 'zone25',
    role: 'ops',
    name: 'Regional operations',
    scope: 'All 25 stores',
  },
]

const KEY = 'phantom.session'

// Sign-in survives a refresh within the tab so deep links work; verify/dismiss state still resets.
function load(): DemoUser | null {
  try {
    const email = sessionStorage.getItem(KEY)
    return DEMO_USERS.find((u) => u.email === email) ?? null
  } catch {
    return null
  }
}

interface Auth {
  user: DemoUser | null
  login: (email: string, password: string) => DemoUser | null
  logout: () => void
}

const Ctx = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(load)

  const login = useCallback((email: string, password: string) => {
    const u = DEMO_USERS.find((d) => d.email === email.trim().toLowerCase() && d.password === password) ?? null
    if (u) {
      setUser(u)
      try {
        sessionStorage.setItem(KEY, u.email)
      } catch {
        /* private mode: session lasts until refresh */
      }
    }
    return u
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      /* nothing stored */
    }
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): Auth {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside AuthProvider')
  return v
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}
