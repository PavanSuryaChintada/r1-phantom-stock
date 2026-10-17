import { Button } from '../components/Basics'
import { checklists, metrics, storeById } from '../lib/data'
import { dayLabel, inr } from '../lib/format'
import { useApp } from '../state'

export function Walks() {
  const { storeId, walked, toggleWalked } = useApp()
  const list = checklists[storeId]
  const store = storeById(storeId)
  const n = list.money.length

  return (
    <div className="page">
      <div className="walks-head">
        <div>
          <h1 className="display">Aisle walk plan</h1>
          <p className="meta">
            {store.name} · {dayLabel(metrics.listDate)} · <span className="mono">{n}</span> checks in{' '}
            <span className="mono">{list.walks.length}</span> walks · <span className="mono">{inr(list.moneyTotal)}</span> at risk
          </p>
        </div>
        <Button className="no-print" onClick={() => window.print()}>
          Print
        </Button>
      </div>

      <div className="walk-grid">
        {list.walks.map((w) => {
          const done = w.skus.filter((s) => walked[`${storeId}:${s}`]).length
          return (
            <section key={w.id} className="walk" aria-label={`Aisle ${w.aisle} walk`}>
              <div className="walk-title">
                <div>
                  <h2 className="section">
                    Aisle <span className="mono">{w.aisle}</span> — {w.aisleName}
                  </h2>
                  <p className="meta">
                    <span className="mono">{w.skus.length}</span> {w.skus.length === 1 ? 'SKU' : 'SKUs'}
                    {done > 0 && (
                      <>
                        {' '}· <span className="mono">{done}</span> checked
                      </>
                    )}
                  </p>
                </div>
                <span className="mono section">{inr(w.total)}</span>
              </div>
              {w.skus.map((sku) => {
                const c = list.items[sku]
                const key = `${storeId}:${sku}`
                const id = `walk-${key}`
                return (
                  <div key={sku} className={`walk-row${walked[key] ? ' done' : ''}`}>
                    <input id={id} type="checkbox" className="cbox" checked={!!walked[key]} onChange={() => toggleWalked(storeId, sku)} />
                    <label htmlFor={id} className="mono" style={{ fontWeight: 500, cursor: 'pointer' }}>
                      {sku}
                    </label>
                    <span className="wname">{c.name}</span>
                    <span className="num">{inr(c.ev)}</span>
                  </div>
                )
              })}
            </section>
          )
        })}
      </div>
    </div>
  )
}
