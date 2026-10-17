import { useState } from 'react'
import { Button } from '../components/Basics'
import { Sparkline } from '../charts/Mini'
import { StoreMap } from '../charts/StoreMap'
import { checklists, getSeries, metrics, storeById } from '../lib/data'
import { dayLabel, inr } from '../lib/format'
import { statusOf } from '../lib/status'
import { useApp } from '../state'

export function Walks() {
  const { storeId, walked, toggleWalked } = useApp()
  const list = checklists[storeId]
  const store = storeById(storeId)
  const [flash, setFlash] = useState<number | null>(null)
  const n = list.money.length

  // the route visits aisles in floor order; cards stay in rupee order
  const stopOf = new Map([...list.walks].sort((a, b) => a.aisle - b.aisle).map((w, i) => [w.aisle, i + 1]))
  const done = new Map(list.walks.map((w) => [w.aisle, w.skus.every((s) => walked[`${storeId}:${s}`])]))
  const checkedCount = list.money.filter((s) => walked[`${storeId}:${s}`]).length
  const checkedValue = list.money.filter((s) => walked[`${storeId}:${s}`]).reduce((a, s) => a + list.items[s].ev, 0)

  const pick = (aisle: number) => {
    document.getElementById(`walk-card-${aisle}`)?.scrollIntoView({ block: 'center' })
    setFlash(aisle)
    window.setTimeout(() => setFlash(null), 1200)
  }

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
        <div className="walks-progress no-print">
          <div>
            <p className="tile-label">Walked</p>
            <p className="mono walks-progress-fig">
              {checkedCount}/{n} · {inr(checkedValue)}
            </p>
          </div>
          <span className="walks-progress-track" aria-hidden="true">
            <span style={{ width: `${(checkedValue / Math.max(1, list.moneyTotal)) * 100}%` }} />
          </span>
          <Button onClick={() => window.print()}>Print</Button>
        </div>
      </div>

      <div className="lp-card storemap-wrap" data-tour="walks">
        <StoreMap walks={list.walks} stopOf={stopOf} done={done} onPick={pick} />
      </div>

      <div className="walk-grid">
        {list.walks.map((w) => {
          const doneHere = w.skus.filter((s) => walked[`${storeId}:${s}`]).length
          return (
            <section key={w.id} id={`walk-card-${w.aisle}`} className={`walk${flash === w.aisle ? ' flash' : ''}`} aria-label={`Aisle ${w.aisle} walk`}>
              <div className="walk-title">
                <span className="walk-stop" aria-label={`Stop ${stopOf.get(w.aisle)}`}>
                  {stopOf.get(w.aisle)}
                </span>
                <div className="grow">
                  <h2 className="section">
                    Aisle <span className="mono">{w.aisle}</span> — {w.aisleName}
                  </h2>
                  <p className="meta">
                    <span className="mono">{doneHere}</span> of <span className="mono">{w.skus.length}</span> checked ·{' '}
                    <span className="mono">{Math.round((w.total / list.moneyTotal) * 100)}%</span> of today’s value
                  </p>
                </div>
                <span className="mono section">{inr(w.total)}</span>
              </div>
              <span className="walk-share" aria-hidden="true">
                <span style={{ width: `${(doneHere / w.skus.length) * 100}%` }} />
              </span>
              {w.skus.map((sku) => {
                const c = list.items[sku]
                const key = `${storeId}:${sku}`
                const id = `walk-${key}`
                const s = getSeries(storeId, sku)
                return (
                  <div key={sku} className={`walk-row${walked[key] ? ' done' : ''}`}>
                    <input id={id} type="checkbox" className="cbox" checked={!!walked[key]} onChange={() => toggleWalked(storeId, sku)} />
                    <label htmlFor={id} className="walk-item">
                      <span className="mono">{sku}</span>
                      <span className="wname">{c.name}</span>
                    </label>
                    <span className="walk-spark">
                      {s && (
                        <Sparkline values={s.sales.slice(-30)} width={96} height={24}
                          markDays={c.type === 'misplaced' ? 14 : Math.min(30, c.zeroDays)} tone={statusOf(c, undefined).tone} />
                      )}
                    </span>
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
