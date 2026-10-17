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
          <h2 className="section" style={{ marginBottom: 12 }}>Worked example</h2>
          <table className="plain">
            <tbody>
              <tr><td>Store, SKU</td><td className="num r">{store.name} · {ex.sku}</td></tr>
              <tr><td>Expected demand</td><td className="num r">{rate(ex.expected)} a day</td></tr>
              <tr><td>Zero-sale days in a row</td><td className="num r">{ex.zeroDays}</td></tr>
              <tr><td>p_zero_run — chance of that silence if the shelf is fine</td><td className="num r">{sci(ex.pZero)}</td></tr>
              <tr><td>Store prior</td><td className="num r">{pct(list.prior, 1)}</td></tr>
              <tr><td>p_phantom</td><td className="num r">{conf(ex.p)}</td></tr>
              <tr><td>Unit margin</td><td className="num r">{inrPrecise(ex.margin)}</td></tr>
              <tr><td>Days until aisle {ex.aisle} is counted → days lost</td><td className="num r">{ex.daysToCount} → {ex.daysLost.toFixed(1)}</td></tr>
              <tr><td><strong>Expected value</strong></td><td className="num r"><strong>{inr(ex.ev)}</strong></td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="section" style={{ marginBottom: 4 }}>Fixed rule vs per-SKU probability</h2>
          <p className="meta" style={{ marginBottom: 12 }}>
            All {metrics.stores} stores, morning of {dayLabel(metrics.listDate)}, scored against injected ground truth.
          </p>
          <table className="plain">
            <thead>
              <tr>
                <th />
                <th className="r">Fixed 7-day rule</th>
                <th className="r">Per-SKU probability</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Alerts fired</td><td className="num r">{int(rule.alerts)}</td><td className="num r">{int(model.alerts)}</td></tr>
              <tr><td>True phantoms caught</td><td className="num r">{int(rule.caught)}</td><td className="num r">{int(model.caught)}</td></tr>
              <tr><td>False positives</td><td className="num r">{int(rule.falsePositives)}</td><td className="num r">{int(model.falsePositives)}</td></tr>
              <tr><td>Precision@20</td><td className="num r">{pct(rule.precisionAt20)}</td><td className="num r"><strong>{pct(model.precisionAt20)}</strong></td></tr>
            </tbody>
          </table>
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
