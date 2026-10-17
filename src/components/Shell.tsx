import { useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { checklists, metrics, storeById, stores } from '../lib/data'
import { dayLabel } from '../lib/format'
import { useApp } from '../state'
import { TourOverlay, useTour } from '../tour/Tour'
import { Button } from './Basics'
import { Dropdown } from './Dropdown'

const NAV = [
  { to: '/app', label: 'Checks', end: true },
  { to: '/app/walks', label: 'Walks' },
  { to: '/app/method', label: 'Method' },
  { to: '/app/impact', label: 'Impact' },
]

export function Shell() {
  const { storeId, setStoreId } = useApp()
  const { user, logout } = useAuth()
  const tour = useTour()
  const navigate = useNavigate()
  const lock = user?.storeLock

  useEffect(() => {
    if (lock && storeId !== lock) setStoreId(lock)
  }, [lock, storeId, setStoreId])

  const options = stores.map((s) => ({
    value: s.id,
    label: s.name,
    meta: (
      <>
        {s.format} · <span className="mono">{checklists[s.id].money.length}</span> checks
      </>
    ),
  }))

  return (
    <>
      <aside className="rail no-print">
        <Link to="/" className="rail-name" aria-label="Phantom, back to overview">
          <strong>Phantom</strong>
          <span>Stock-out detector</span>
        </Link>
        <nav aria-label="Primary">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="rail-foot meta">
          <span className="mono">{metrics.stores}</span> stores · <span className="mono">{metrics.skus}</span> SKUs
        </div>
        {user && (
          <div className="rail-user" style={{ marginTop: 12 }}>
            <strong>{user.name}</strong>
            <span className="meta mono">{user.email}</span>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </aside>
      <header className="topbar no-print">
        <span data-tour="store">
          {lock ? (
            <span className="store-fixed">
              {storeById(lock).name}
              <span className="meta">your store</span>
            </span>
          ) : (
            <Dropdown label="Store" options={options} value={storeId} onChange={setStoreId} />
          )}
        </span>
        <span className="crumb-sep" aria-hidden="true">
          /
        </span>
        <span className="mono">{dayLabel(metrics.listDate)}</span>
        <span className="meta">
          data through <span className="mono">{dayLabel(metrics.lastDataDay)}</span>
        </span>
        <span className="spacer" />
        <Button variant="ghost" onClick={tour.start}>
          Walkthrough
        </Button>
        <span className="chip">Prototype · simulated dataset</span>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <TourOverlay />
    </>
  )
}
