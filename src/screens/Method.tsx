import { MethodDiagram } from '../charts/MethodDiagram'
import { checklists, metrics, storeById } from '../lib/data'
import { conf, dayLabel, inr, inrPrecise, int, pct, rate } from '../lib/format'

const FORMULA = `expected_rate  = base × weekday × season × promo
p_zero_run     = P(k zero-sale days in a row | NegBin(expected_rate))
p_phantom      = prior / (prior + (1 − prior) × p_zero_run)
days_lost      = expected days until it would surface otherwise   (cap 30)
expected_value = p_phantom × expected_rate × unit_margin × days_lost

rank by expected_value, not by p_phantom`

function sci(x: number): string {
  if (x >= 0.001) return x.toPrecision(3)
  const [m, e] = x.toExponential(2).split('e')
  return `${m} × 10^${Number(e)}`
}

export function Method() {
  const storeId = '14'
  const list = checklists[storeId]
  // the first money-list check whose probability is not saturated makes the clearest example
  const ex = list.money.map((s) => list.items[s]).find((c) => c.type === 'phantom' && c.p < 0.99) ?? list.items[list.money[0]]
  const store = storeById(storeId)
  const { rule, model } = metrics.comparison
  const PAIRS: [string, number, number, (v: number) => string, string][] = [
    ['Alerts fired', rule.alerts, model.alerts, int, 'fewer is better'],
    ['True phantoms caught', rule.caught, model.caught, int, 'more is better'],
    ['False positives', rule.falsePositives, model.falsePositives, int, 'fewer is better'],
    ['Precision@20', rule.precisionAt20, model.precisionAt20, (v) => pct(v), 'higher is better'],
  ]

  return (
    <div className="page">
      <div className="prose">
        <div>
          <h1 className="display">How it works</h1>
          <p className="meta" style={{ marginTop: 4 }}>
            One question: which twenty shelves should the manager check this morning?
          </p>
        </div>

        <MethodDiagram />

        <section>
          <h2 className="section" style={{ marginBottom: 12 }}>The score</h2>
          <div className="formula">{FORMULA}</div>
          <p style={{ marginTop: 12 }}>
            A phantom stock-out is a shelf that is empty while the system says it is not. Nothing reorders, because the
            books show stock. The only trace is silence: sales stop. The question is whether this SKU's silence is
            unusual for this SKU — eleven quiet days mean nothing for a ₹400 tin of hing and everything for toothpaste.
          </p>
          <p>
            The prior is each store's share of SKU-days spent as a phantom over the last year, measured from cycle-count
            findings, so a tight store needs stronger evidence before a shelf earns a check. Days lost runs to the aisle's
            next cycle count, shortened by the chance that a shopper or picker reports the gap first.
          </p>
        </section>

        <section>
          <h2 className="section" style={{ marginBottom: 4 }}>Worked example</h2>
          <p className="meta" style={{ marginBottom: 12 }}>
            {store.name} · <span className="mono">{ex.sku}</span>, {ex.name}
          </p>
          <div className="evidence">
            <div>
              <span className="label">Silent</span>
              <span className="mono">{ex.zeroDays} {ex.zeroDays === 1 ? 'day' : 'days'}</span>
            </div>
            <span className="evidence-arrow" aria-hidden="true">→</span>
            <div>
              <span className="label">Chance if the shelf is fine</span>
              <span className="mono">{sci(ex.pZero)}</span>
            </div>
            <span className="evidence-arrow" aria-hidden="true">→</span>
            <div>
              <span className="label">With store prior {pct(list.prior, 1)}</span>
              <span className="mono">p = {conf(ex.p)}</span>
            </div>
          </div>
          <div className="equation" role="img"
            aria-label={`${conf(ex.p)} times ${rate(ex.rate)} a day times ${ex.daysLost.toFixed(1)} days times ${inrPrecise(ex.margin)} equals ${inr(ex.ev)}`}>
            <div className="eq-tile">
              <span className="eq-val">{conf(ex.p)}</span>
              <span className="eq-lbl">probability it is phantom</span>
            </div>
            <span className="eq-op">×</span>
            <div className="eq-tile">
              <span className="eq-val">{rate(ex.rate)}</span>
              <span className="eq-lbl">units a day</span>
            </div>
            <span className="eq-op">×</span>
            <div className="eq-tile">
              <span className="eq-val">{ex.daysLost.toFixed(1)}</span>
              <span className="eq-lbl">days hidden (count in {ex.daysToCount})</span>
            </div>
            <span className="eq-op">×</span>
            <div className="eq-tile">
              <span className="eq-val">{inrPrecise(ex.margin)}</span>
              <span className="eq-lbl">unit margin</span>
            </div>
            <span className="eq-op">=</span>
            <div className="eq-tile result">
              <span className="eq-val">{inr(ex.ev)}</span>
              <span className="eq-lbl">at risk</span>
            </div>
          </div>
        </section>

        <section data-tour="compare">
          <h2 className="section" style={{ marginBottom: 4 }}>Fixed rule vs per-SKU probability</h2>
          <p className="meta" style={{ marginBottom: 12 }}>
            All {metrics.stores} stores, morning of {dayLabel(metrics.listDate)}, scored against injected ground truth.
          </p>
          <div className="pairs">
            {PAIRS.map(([label, a, b, fmt, better]) => {
              const max = Math.max(a, b, 1e-9)
              return (
                <div key={label} className="pair">
                  <span className="pair-label">
                    {label}
                    <span className="meta">{better}</span>
                  </span>
                  <div className="pair-bars">
                    <span className="pair-row">
                      <span className="pair-name">Fixed 7-day rule</span>
                      <span className="pair-track"><span className="pair-fill rule" style={{ width: `${(a / max) * 100}%` }} /></span>
                      <span className="mono">{fmt(a)}</span>
                    </span>
                    <span className="pair-row">
                      <span className="pair-name"><strong>Per-SKU probability</strong></span>
                      <span className="pair-track"><span className="pair-fill" style={{ width: `${(b / max) * 100}%` }} /></span>
                      <span className="mono"><strong>{fmt(b)}</strong></span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="section" style={{ marginBottom: 12 }}>Why precision@20</h2>
          <p>
            A manager has time to walk about twenty shelves before the store fills up. The only number that matters is how
            many of those twenty turn out to be real — precision at twenty. A model tuned for AUC is rewarded for ordering
            thousands of quiet slow-movers correctly against each other, shelves nobody will ever walk to, and can score
            well while putting a cheap spice tin above a missing shampoo. Here, {pct(metrics.precisionAt20)} of the checks on
            today's lists find a real problem, and the list stops short of twenty when the evidence does.
          </p>
        </section>

        <section className="sunken">
          <h2 className="section">What is real and what is not</h2>
          <ul>
            <li>
              <strong>Real:</strong> the demand model, the probability calculation, the expected-value ranking, the aisle
              grouping, and the precision@20 figure measured against injected ground truth.
            </li>
            <li>
              <strong>Simulated:</strong> the sales and inventory history, generated to the brief's stated shape. No
              retailer data was used.
            </li>
            <li>
              <strong>Precomputed:</strong> scoring runs offline; the app replays committed results rather than computing
              in the browser.
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
