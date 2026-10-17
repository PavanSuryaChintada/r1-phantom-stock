import { useState } from 'react'
import { Button } from '../components/Basics'
import { VBars } from '../charts/Bars'
import { metrics } from '../lib/data'
import { inrShort } from '../lib/format'

interface Input {
  key: 'perDay' | 'days' | 'demand' | 'margin' | 'stores' | 'share'
  label: string
  min: number
  max: number
  step: number
  fmt: (v: number) => string
}

const INPUTS: Input[] = [
  { key: 'perDay', label: 'New phantoms per store per day', min: 0.1, max: 4, step: 0.01, fmt: (v) => v.toFixed(2) },
  { key: 'days', label: 'Days a phantom stays hidden', min: 1, max: 30, step: 0.1, fmt: (v) => v.toFixed(1) },
  { key: 'demand', label: 'Daily demand, units', min: 0.5, max: 40, step: 0.1, fmt: (v) => v.toFixed(1) },
  { key: 'margin', label: 'Unit margin', min: 1, max: 120, step: 0.1, fmt: (v) => `₹${v.toFixed(1)}` },
  { key: 'stores', label: 'Stores', min: 1, max: 500, step: 1, fmt: (v) => v.toFixed(0) },
  { key: 'share', label: 'Share of that value the 20 checks catch', min: 0.05, max: 1, step: 0.01, fmt: (v) => `${Math.round(v * 100)}%` },
]

const im = metrics.impact
const MEASURED = {
  perDay: im.phantomsPerStoreDay,
  days: im.daysHidden,
  demand: im.dailyDemand,
  margin: im.unitMargin,
  stores: im.stores,
  share: im.share,
}

function Slider({ input, value, onChange }: { input: Input; value: number; onChange: (v: number) => void }) {
  const id = `sl-${input.key}`
  const frac = (value - input.min) / (input.max - input.min)
  return (
    <div className="slider">
      <div className="slider-top">
        <label htmlFor={id} className="ink2">
          {input.label}
        </label>
        <span className="slider-val">{input.fmt(value)}</span>
      </div>
      <div className="range">
        <span className="range-track" />
        <span className="range-fill" style={{ width: `calc(${frac * 100}% - ${frac * 14 - 7}px)` }} />
        <input
          id={id}
          type="range"
          min={input.min}
          max={input.max}
          step={input.step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  )
}

export function Impact() {
  const [v, setV] = useState(MEASURED)
  const total = v.perDay * v.days * v.demand * v.margin * v.stores * 365 * v.share
  const bars = [5, 10, 20, 40].map((n) => {
    const value = (total * im.shareAt[String(n)]) / im.share
    return { label: `${n} checks/day`, value, display: inrShort(value), current: n === 20 }
  })
  const changed = (Object.keys(MEASURED) as (keyof typeof MEASURED)[]).some((k) => v[k] !== MEASURED[k])

  return (
    <div className="page">
      <h1 className="display">Rupees recovered</h1>
      <p className="meta" style={{ marginTop: 4, marginBottom: 24 }}>
        Defaults are measured on the simulated chain: {metrics.stores} stores, {metrics.skus} SKUs, the last year of
        history.
      </p>
      <div className="impact">
        <div>
          {INPUTS.map((input) => (
            <Slider key={input.key} input={input} value={v[input.key]} onChange={(x) => setV({ ...v, [input.key]: x })} />
          ))}
          <div style={{ marginTop: 24 }}>
            <Button variant="ghost" onClick={() => setV(MEASURED)} disabled={!changed}>
              Reset to measured values
            </Button>
          </div>
        </div>
        <div>
          <div className="total-fig">{inrShort(total)}</div>
          <div className="stat-label">margin recovered per year, all stores</div>
          <p className="arith">
            {v.perDay.toFixed(2)} phantoms/store/day × {v.days.toFixed(1)} days × {v.demand.toFixed(1)} units × ₹
            {v.margin.toFixed(1)} × {v.stores} stores × 365 × {Math.round(v.share * 100)}% = {inrShort(total)}
          </p>
          <h2 className="section" style={{ marginTop: 32, marginBottom: 4 }}>
            More checks, diminishing returns
          </h2>
          <p className="meta" style={{ marginBottom: 12 }}>
            Value caught at each list length. The first five checks carry most of it; past twenty the extra walking buys
            little.
          </p>
          <VBars bars={bars} label="Recovered per year at 5, 10, 20 and 40 checks per day" />
        </div>
      </div>
    </div>
  )
}
