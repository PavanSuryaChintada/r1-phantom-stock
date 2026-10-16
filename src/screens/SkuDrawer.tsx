import { Button } from '../components/Basics'
import { Drawer } from '../components/Drawer'
import { StatusBar } from '../components/StatusBar'
import { HBars } from '../charts/Bars'
import { SalesStockChart } from '../charts/SalesStockChart'
import { checklists, getSeries, seriesStart, type Check } from '../lib/data'
import { conf, dayLabel, daysBetween, inr, inrPrecise, rate } from '../lib/format'
import { statusOf } from '../lib/status'
import { useApp } from '../state'

interface Props {
  check: Check
  storeId: string
  onClose: () => void
}

function TruthTag({ c }: { c: Check }) {
  if (c.truth === 'phantom' && c.truthStart) {
    const lag = daysBetween(c.truthStart, c.detected)
    return (
      <p>
        <span className="tag ok">Confirmed phantom</span>{' '}
        <span className="meta">
          began <span className="mono">{dayLabel(c.truthStart)}</span>, flagged{' '}
          {lag <= 0 ? 'the same day' : <><span className="mono">{lag}</span> {lag === 1 ? 'day' : 'days'} later</>}
        </span>
      </p>
    )
  }
  if (c.truth === 'misplaced') return <p><span className="tag warn">Ground truth: misplaced</span></p>
  if (c.truth === 'delisted') return <p><span className="tag unknown">Ground truth: delisted</span></p>
  return (
    <p>
      <span className="tag muted">Ground truth: no issue</span>{' '}
      <span className="meta">a normal quiet spell. One of the false alarms counted in precision@20.</span>
    </p>
  )
}

export function SkuDrawer({ check: c, storeId, onClose }: Props) {
  const { decisions, decide } = useApp()
  const d = decisions[`${storeId}:${c.sku}`]
  const s = statusOf(c, d)
  const series = getSeries(storeId, c.sku)
  const items = Object.values(checklists[storeId].items)
  const maxRate = Math.max(...items.map((i) => i.rate))
  const maxMargin = Math.max(...items.map((i) => i.margin))
  const what = c.type === 'misplaced' ? 'misplaced' : c.type === 'delisted' ? 'not selling' : 'phantom'

  return (
    <Drawer
      label={`${c.sku} detail`}
      onClose={onClose}
      footer={
        d ? (
          <>
            <StatusBar tone={s.tone} label={d === 'verified' ? 'Confirmed after check' : 'Dismissed'} />
            <span className="spacer" />
            <Button variant="ghost" onClick={() => decide(storeId, c.sku, null)}>
              Undo
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" onClick={() => decide(storeId, c.sku, 'verified')}>
              Verify
            </Button>
            <Button onClick={() => decide(storeId, c.sku, 'dismissed')}>Dismiss</Button>
            <span className="spacer" />
            <span className="meta">Esc to close</span>
          </>
        )
      }
    >
      <section className="drawer-sec">
        <div className="drawer-head">
          <div className="grow">
            <h2 className="drawer-sku">{c.sku}</h2>
            <p className="ink2">{c.name}</p>
            <p style={{ marginTop: 8 }}>
              <StatusBar tone={s.tone} label={s.label} bar />
            </p>
          </div>
          <Button variant="ghost" icon aria-label="Close" onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Button>
        </div>
        <dl className="kv">
          <dt>Aisle</dt>
          <dd>
            {c.aisle} · <span style={{ fontFamily: 'var(--sans)' }}>{c.aisleName}</span>
            {c.walk && <> · walk {c.walk}</>}
          </dd>
          <dt>System stock</dt>
          <dd>{c.stock} units</dd>
          <dt>Last sale</dt>
          <dd>{c.lastSale ? dayLabel(c.lastSale) : '—'}</dd>
          <dt>Last delivery</dt>
          <dd>{c.lastReceipt ? dayLabel(c.lastReceipt) : 'none in 120 days'}</dd>
        </dl>
      </section>

      {series && (
        <section className="drawer-sec">
          <h3 className="section" style={{ marginBottom: 8 }}>
            Sales vs system stock, <span className="mono">120</span> days
          </h3>
          <SalesStockChart
            sales={series.sales}
            stock={series.stock}
            start={seriesStart}
            detected={c.detected}
            truthStart={d === 'verified' ? c.truthStart : null}
          />
        </section>
      )}

      <section className="drawer-sec">
        <h3 className="section" style={{ marginBottom: 12 }}>
          Why this ranks here
        </h3>
        <HBars
          rows={[
            { label: `Probability it is ${what}`, display: conf(c.p), frac: c.p },
            {
              label: c.type === 'misplaced' ? 'Daily sales lost' : 'Daily demand',
              display: `${rate(c.rate)}/day`,
              frac: c.rate / maxRate,
            },
            { label: 'Days hidden', display: `${c.daysLost.toFixed(1)} d`, frac: c.daysLost / 30 },
            { label: 'Unit margin', display: inrPrecise(c.margin), frac: c.margin / maxMargin },
          ]}
        />
        <p style={{ marginTop: 12 }}>
          <span className="mono meta">
            {conf(c.p)} × {rate(c.rate)} × {c.daysLost.toFixed(1)} × {inrPrecise(c.margin)}
          </span>
          <br />
          <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: 'var(--action)' }}>
            = {inr(c.ev)} at risk
          </span>
        </p>
      </section>

      <section className="drawer-sec">
        <h3 className="section" style={{ marginBottom: 8 }}>
          Reason
        </h3>
        <p className="ink2">{c.detail}</p>
      </section>

      {d === 'verified' && (
        <section className="drawer-sec">
          <TruthTag c={c} />
        </section>
      )}
    </Drawer>
  )
}
