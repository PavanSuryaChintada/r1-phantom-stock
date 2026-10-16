import { NavLink, Outlet } from 'react-router-dom'
import { checklists, metrics, stores } from '../lib/data'
import { dayLabel } from '../lib/format'
import { useApp } from '../state'
import { Dropdown } from './Dropdown'

const NAV = [
  { to: '/', label: 'Checks', end: true },
  { to: '/walks', label: 'Walks' },
  { to: '/method', label: 'Method' },
  { to: '/impact', label: 'Impact' },
]

export function Shell() {
  const { storeId, setStoreId } = useApp()
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
        <div className="rail-name">
          <strong>Phantom</strong>
          <span>Stock-out detector</span>
        </div>
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
      </aside>
      <header className="topbar no-print">
        <Dropdown label="Store" options={options} value={storeId} onChange={setStoreId} />
        <span className="crumb-sep" aria-hidden="true">
          /
        </span>
        <span className="mono">{dayLabel(metrics.listDate)}</span>
        <span className="meta">
          data through <span className="mono">{dayLabel(metrics.lastDataDay)}</span>
        </span>
        <span className="spacer" />
        <span className="chip">Prototype · simulated dataset</span>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </>
  )
}
