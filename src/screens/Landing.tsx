import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../landing.css'
import { ArchitectureDiagram } from '../charts/ArchitectureDiagram'
import { SalesStockChart } from '../charts/SalesStockChart'
import { Brand } from '../components/Brand'
import { SegmentedControl } from '../components/SegmentedControl'
import { StatusBar } from '../components/StatusBar'
import { checklists, getSeries, metrics, seriesStart, stores } from '../lib/data'
import { conf, dayLabel, inr, inrShort, int, pct } from '../lib/format'
import { statusOf } from '../lib/status'
import { TOUR_STEPS } from '../tour/steps'

const REPO = 'https://github.com/PavanSuryaChintada/r1-phantom-stock'

// ---------------------------------------------------------------- figures, all computed from the fixtures
const s14 = checklists['14']
const lists = stores.map((s) => checklists[s.id])
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const moneyAll = sum(lists.map((l) => l.moneyTotal))
const confAll = sum(lists.map((l) => l.confidenceTotal))
const realShare = (pick: 'money' | 'confidence') =>
  sum(lists.map((l) => l[pick].filter((c) => l.items[c].truth).length)) / sum(lists.map((l) => l[pick].length))
const confPrecision = realShare('confidence')
const { rule, model } = metrics.comparison
const im = metrics.impact
const annual = im.phantomsPerStoreDay * im.daysHidden * im.dailyDemand * im.unitMargin * im.stores * 365 * im.share

const exampleSku = s14.money[0]
const example = s14.items[exampleSku]
const exampleSeries = getSeries('14', exampleSku)

// ---------------------------------------------------------------- hero preview: the argument, live
function Preview() {
  const [rank, setRank] = useState<'money' | 'confidence'>('money')
  const codes = (rank === 'money' ? s14.money : s14.confidence).slice(0, 7)
  return (
    <div className="lp-preview" aria-label="Live preview of the morning check list for Store 14">
      <div className="lp-preview-head">
        <div>
          <strong>Store 14, Koramangala</strong>
          <p className="meta">
            Morning check list · <span className="mono">{dayLabel(metrics.listDate)}</span>
          </p>
        </div>
        <SegmentedControl
          label="Rank by"
          value={rank}
          onChange={setRank}
          segments={[
            { value: 'money', label: '₹ recovered' },
            { value: 'confidence', label: 'Confidence' },
          ]}
        />
      </div>
      <table className="tbl compact">
        <colgroup>
          <col style={{ width: 3 }} />
          <col style={{ width: 32 }} />
          <col />
          <col style={{ width: 64 }} />
          <col style={{ width: 88 }} />
          <col style={{ width: 156 }} />
        </colgroup>
        <thead>
          <tr>
            <th aria-label="Status bar" />
            <th className="r">#</th>
            <th>SKU</th>
            <th className="r">Conf.</th>
            <th className="r">₹ at risk</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((code, i) => {
            const c = s14.items[code]
            const st = statusOf(c, undefined)
            return (
              <tr key={code} style={{ cursor: 'default' }}>
                <td className={`bar tone-${st.tone}`} aria-hidden="true" />
                <td className="r mono">{i + 1}</td>
                <td className="sku">{code}</td>
                <td className="r mono">{conf(c.p)}</td>
                <td className="r ev">{inr(c.ev)}</td>
                <td>
                  <StatusBar tone={st.tone} label={st.label} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="lp-preview-cap" aria-live="polite">
        {rank === 'money' ? (
          <>
            Ranked by money — the 20 checks cover <strong className="mono">{inr(s14.moneyTotal)}</strong>
          </>
        ) : (
          <>
            Ranked by confidence — the same 20 slots cover <strong className="mono">{inr(s14.confidenceTotal)}</strong>.{' '}
            <strong className="mono">{inr(s14.dropped)}</strong> drops out.
          </>
        )}
      </p>
    </div>
  )
}

const FLOW = [
  { time: '23:00', title: 'Stores close', body: 'POS sales and end-of-day stock land for every SKU in every store.', where: 'Simulated in the prototype' },
  { time: '02:00', title: 'Scoring runs', body: `${int(metrics.seriesTotal)} SKU-store series get a demand estimate, a silence test and a rupee value.`, where: 'tools/generate.py' },
  { time: '06:30', title: 'Lists published', body: 'Each store gets at most twenty checks, grouped into aisle walks.', where: 'Committed JSON' },
  { time: '07:00', title: 'Manager scans', body: 'Ninety seconds on the morning list. Every row says why it is there.', where: 'In the app' },
  { time: '07:15', title: 'Aisles walked', body: 'The printed walk plan goes onto the floor, richest aisle first.', where: 'In the app' },
  { time: '08:00', title: 'Verify or dismiss', body: 'Outcomes measure precision and, in production, update each store’s prior.', where: 'In the app' },
]

const STACK = [
  {
    title: 'Client',
    items: [
      ['React', '18.3'],
      ['TypeScript', '5.6'],
      ['Vite', '5.4'],
      ['react-router', '6.26'],
      ['CSS custom properties', ''],
      ['Hand-written SVG charts', ''],
      ['IBM Plex Sans and Mono', 'bundled'],
    ],
  },
  {
    title: 'Modelling',
    items: [
      ['Python', '3.11'],
      ['NumPy', '2.1'],
      ['SciPy', '1.14'],
      ['Negative binomial demand', ''],
      ['Bayesian store prior', ''],
      ['Fixed random seed', 'reproducible'],
    ],
  },
  {
    title: 'Data',
    items: [
      ['stores.json', '4 KB'],
      ['checklist.json', '396 KB'],
      ['series.json', '356 KB'],
      ['metrics.json', '2 KB'],
      ['Imported at build time', 'no fetch'],
    ],
  },
  {
    title: 'Delivery',
    items: [
      ['Vercel static hosting', ''],
      ['SPA rewrites', 'deep links'],
      ['Immutable asset cache', '1 year'],
      ['Environment variables', 'none'],
      ['Works offline', 'after first load'],
    ],
  },
]

const DIFF: [string, string, string, string][] = [
  ['Flags a shelf when', '7 days pass without a sale', 'its score clears a cut-off', 'the silence is improbable for this SKU in this store'],
  ['Ranks the list by', 'days silent', 'probability', 'rupees a check recovers'],
  ['Slow movers', 'flagged constantly', 'long quiet runs look certain', 'need a proportionally longer silence'],
  ['Misplaced or delisted', 'same alert', 'same alert', 'own test, own label'],
  ['When evidence is thin', 'pads the list', 'pads the list', 'stops short of twenty'],
  ['Explains a row with', 'the rule', 'a score', 'four numbers that multiply to rupees'],
]

export function Landing() {
  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <Brand />
          <nav className="lp-links" aria-label="Sections">
            <a href="#problem">Problem</a>
            <a href="#difference">Difference</a>
            <a href="#architecture">Architecture</a>
            <a href="#flow">Flow</a>
            <a href="#stack">Stack</a>
            <a href="#walkthrough">Walkthrough</a>
          </nav>
          <span className="spacer" />
          <Link to="/login" className="btn">
            Sign in
          </Link>
          <Link to="/login" className="btn primary lp-hide-sm">
            Open the demo
          </Link>
        </div>
      </header>

      {/* ------------------------------------------------------------ hero */}
      <section className="lp-wrap lp-hero">
        <div>
          <span className="chip">Prototype · simulated dataset</span>
          <h1 className="lp-h1">Find the empty shelves your system thinks are full.</h1>
          <p className="lp-lede">
            Phantom reads the sales and stock data a store already has and hands the manager twenty shelf checks each
            morning, ranked by the rupees each check recovers — not by how confident a model feels.
          </p>
          <div className="lp-cta">
            <Link to="/login" className="btn primary lg">
              Open the demo
            </Link>
            <a href="#architecture" className="btn lg">
              See the architecture
            </a>
          </div>
          <p className="meta" style={{ marginTop: 12 }}>
            Three demo accounts, no sign-up. A guided walkthrough takes three minutes.
          </p>
        </div>
        <Preview />
      </section>

      <section className="lp-metrics" aria-label="Key results">
        <div className="lp-wrap lp-metrics-in">
          <div className="lp-metric">
            <div className="lp-metric-fig">{pct(metrics.precisionAt20)}</div>
            <div className="lp-metric-label">of checks find a real problem</div>
            <div className="meta">precision@20, against {pct(rule.precisionAt20)} for a fixed 7-day rule</div>
          </div>
          <div className="lp-metric">
            <div className="lp-metric-fig">{int(model.alerts)}</div>
            <div className="lp-metric-label">alerts on one morning, 25 stores</div>
            <div className="meta">the fixed rule fires {int(rule.alerts)}</div>
          </div>
          <div className="lp-metric">
            <div className="lp-metric-fig accent">+{inr(moneyAll - confAll)}</div>
            <div className="lp-metric-label">more value in the same list slots</div>
            <div className="meta">ranking by rupees vs by confidence, all stores, one morning</div>
          </div>
          <div className="lp-metric">
            <div className="lp-metric-fig">{metrics.medianDetectionLag ?? 1} day</div>
            <div className="lp-metric-label">median from phantom to flag</div>
            <div className="meta">a cycle count finds it up to {metrics.cycleDays} days later</div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ problem */}
      <section id="problem" className="lp-sec">
        <div className="lp-wrap lp-two">
          <div>
            <p className="lp-kicker">01 · The problem</p>
            <h2 className="lp-h2">The shelf is empty. The books say it is not. Nothing reorders.</h2>
            <p className="lp-p">
              A phantom stock-out happens when stock is stolen, damaged or stuck in the backroom while the inventory
              system still counts it. Replenishment trusts the books, so no order fires. The only trace is that sales
              stop.
            </p>
            <ul className="lp-list">
              <li>
                <strong>Invisible to replenishment.</strong> System stock stays positive, so the reorder point is never
                crossed.
              </li>
              <li>
                <strong>Found late.</strong> A rotating cycle count reaches each aisle every {metrics.cycleDays} days.
                Until then, every shopper who wanted it walks away.
              </li>
              <li>
                <strong>Hard to see in the noise.</strong> Eleven quiet days mean nothing for a slow spice and everything
                for toothpaste.
              </li>
            </ul>
          </div>
          {exampleSeries && (
            <figure className="lp-card lp-fig">
              <figcaption>
                <strong className="mono">{exampleSku}</strong>
                <span className="meta">
                  {' '}
                  · {example.name} · Store 14
                </span>
              </figcaption>
              <SalesStockChart
                sales={exampleSeries.sales}
                stock={exampleSeries.stock}
                start={seriesStart}
                detected={example.detected}
                zeroDays={example.zeroDays}
                truthStart={example.truthStart}
              />
              <p className="meta" style={{ marginTop: 8 }}>
                Sales stop on {example.truthStart ? dayLabel(example.truthStart) : 'the marked day'}; system stock stays
                frozen at <span className="mono">{example.stock}</span>. Phantom flags it on {dayLabel(example.detected)}{' '}
                with <span className="mono">{inr(example.ev)}</span> at risk.
              </p>
            </figure>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------ difference */}
      <section id="difference" className="lp-sec lp-alt">
        <div className="lp-wrap">
          <p className="lp-kicker">02 · How we differ</p>
          <h2 className="lp-h2">Most approaches ask “is this shelf empty?” We ask “which check is worth the walk?”</h2>
          <p className="lp-p lp-narrow">
            A manager can walk about twenty shelves before the store fills up. So the list has twenty slots, and the job
            is to fill them with the checks that recover the most money — not the ones the model is most sure about.
          </p>

          <div className="lp-scroll">
            <table className="lp-diff">
              <thead>
                <tr>
                  <th />
                  <th>Fixed rule</th>
                  <th>Same model, ranked by confidence</th>
                  <th className="ours">Phantom</th>
                </tr>
              </thead>
              <tbody>
                {DIFF.map(([k, a, b, c]) => (
                  <tr key={k}>
                    <th scope="row">{k}</th>
                    <td>{a}</td>
                    <td>{b}</td>
                    <td className="ours">{c}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">Precision@20, 25 stores</th>
                  <td className="mono">{pct(rule.precisionAt20)}</td>
                  <td className="mono">{pct(confPrecision)}</td>
                  <td className="ours mono">{pct(metrics.precisionAt20)}</td>
                </tr>
                <tr>
                  <th scope="row">Value in the list slots</th>
                  <td className="ink3">not ranked by value</td>
                  <td className="mono">{inr(confAll)}</td>
                  <td className="ours mono">
                    <strong>{inr(moneyAll)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="meta" style={{ marginTop: 12 }}>
            Measured on one morning across all 25 simulated stores against injected ground truth. Ranking by confidence
            is right slightly more often — {pct(confPrecision)} — because it fills up with old, certain, cheap phantoms.
            Ranking by rupees recovers {pct(moneyAll / confAll - 1)} more value from the same slots.
          </p>

          <div className="lp-bars" aria-label="Value covered by the same list slots">
            <div className="lp-bar-row">
              <span>Ranked by confidence</span>
              <span className="lp-bar-track">
                <span className="lp-bar-fill muted" style={{ width: `${(confAll / moneyAll) * 100}%` }} />
              </span>
              <span className="mono">{inr(confAll)}</span>
            </div>
            <div className="lp-bar-row">
              <span>
                <strong>Ranked by rupees</strong>
              </span>
              <span className="lp-bar-track">
                <span className="lp-bar-fill" style={{ width: '100%' }} />
              </span>
              <span className="mono">
                <strong>{inr(moneyAll)}</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ architecture */}
      <section id="architecture" className="lp-sec">
        <div className="lp-wrap">
          <p className="lp-kicker">03 · Architecture</p>
          <h2 className="lp-h2">Heavy maths offline. A client that never calls home.</h2>
          <p className="lp-p lp-narrow">
            Scoring is a batch job; the store needs one answer per morning, not a live service. The browser only renders
            committed results, so the app loads instantly and keeps working on a poor connection.
          </p>
          <div className="lp-card lp-scroll lp-arch">
            <ArchitectureDiagram />
          </div>
          <div className="lp-three">
            <div>
              <h3 className="lp-h3">Offline scoring</h3>
              <p className="lp-p">
                Per-SKU demand, the probability of the current silence, a store-level prior, and rupees at risk. In this
                prototype <span className="mono">tools/generate.py</span> simulates the inputs and runs the engine once.
              </p>
            </div>
            <div>
              <h3 className="lp-h3">Static artefacts</h3>
              <p className="lp-p">
                Four JSON files, about 760 KB, imported at build time. No fetch, no loading states, nothing to fail on
                the day.
              </p>
            </div>
            <div>
              <h3 className="lp-h3">Feedback loop</h3>
              <p className="lp-p">
                Every verify or dismiss is a labelled outcome. In production these update each store’s prior, so a tight
                store needs stronger evidence and a leaky one gets checked sooner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ flow */}
      <section id="flow" className="lp-sec lp-alt">
        <div className="lp-wrap">
          <p className="lp-kicker">04 · End to end</p>
          <h2 className="lp-h2">One night, one morning.</h2>
          <ol className="lp-flow">
            {FLOW.map((f) => (
              <li key={f.time}>
                <span className="lp-flow-node" aria-hidden="true" />
                <span className="mono lp-flow-time">{f.time}</span>
                <strong>{f.title}</strong>
                <p className="lp-p">{f.body}</p>
                <span className={`tag ${f.where === 'In the app' ? 'ok' : 'muted'}`}>{f.where}</span>
              </li>
            ))}
          </ol>
          <div className="lp-formula">
            <p className="label">The score</p>
            <pre className="formula">{`expected_rate  = base × weekday × season × promo
p_zero_run     = P(k zero-sale days in a row | NegBin(expected_rate))
p_phantom      = prior / (prior + (1 − prior) × p_zero_run)
expected_value = p_phantom × expected_rate × unit_margin × days_lost

rank by expected_value, not by p_phantom`}</pre>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ stack */}
      <section id="stack" className="lp-sec">
        <div className="lp-wrap">
          <p className="lp-kicker">05 · Tech stack</p>
          <h2 className="lp-h2">Small, boring, dependable.</h2>
          <div className="lp-stack">
            {STACK.map((g) => (
              <div key={g.title} className="lp-card">
                <h3 className="lp-h3">{g.title}</h3>
                <ul>
                  {g.items.map(([name, v]) => (
                    <li key={name}>
                      <span>{name}</span>
                      {v && <span className="mono ink3">{v}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="lp-principles">
            {['No backend', 'No API calls', 'No chart library', 'Bundled fonts', 'Keyboard accessible', 'Status never colour-only'].map((p) => (
              <span key={p} className="lp-principle">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ walkthrough */}
      <section id="walkthrough" className="lp-sec lp-alt">
        <div className="lp-wrap lp-two">
          <div>
            <p className="lp-kicker">06 · Walkthrough</p>
            <h2 className="lp-h2">See the whole idea in three minutes.</h2>
            <p className="lp-p">
              Sign in as <strong>Evaluator</strong> and a guided tour starts by itself. It highlights each part of the
              screen, explains it in two sentences, and moves through every page. Restart it any time from the top bar.
            </p>
            <div className="lp-cta">
              <Link to="/login" className="btn primary lg">
                Start the guided demo
              </Link>
              <a href={REPO} className="btn lg" target="_blank" rel="noreferrer">
                Source on GitHub
              </a>
            </div>
          </div>
          <ol className="lp-steps">
            {TOUR_STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                <span>{s.title}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------ honesty */}
      <section className="lp-sec">
        <div className="lp-wrap">
          <div className="sunken lp-honest">
            <h2 className="section">What is real and what is not</h2>
            <ul>
              <li>
                <strong>Real:</strong> the demand model, the probability calculation, the expected-value ranking, the
                aisle grouping, and the precision@20 figure measured against injected ground truth.
              </li>
              <li>
                <strong>Simulated:</strong> the sales and inventory history, generated to the brief’s stated shape. No
                retailer data was used.
              </li>
              <li>
                <strong>Precomputed:</strong> scoring runs offline; the app replays committed results rather than
                computing in the browser.
              </li>
            </ul>
            <p className="meta" style={{ marginTop: 12 }}>
              Annual figure on the impact page, {inrShort(annual)}, uses measured inputs from the same simulated chain.
            </p>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-wrap lp-foot-in">
          <Brand />
          <span className="meta">Round 1 prototype · {metrics.stores} stores · {int(metrics.skus)} SKUs · 18 months simulated</span>
          <span className="spacer" />
          <a href={REPO} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <Link to="/login">Sign in</Link>
        </div>
      </footer>
    </div>
  )
}
