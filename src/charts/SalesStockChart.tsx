import { addDays, daysBetween, shortDate } from '../lib/format'

interface Props {
  sales: number[]
  stock: number[]
  start: string
  detected: string
  zeroDays?: number
  truthStart?: string | null
}

const W = 420
const H = 180
const M = { l: 32, r: 84, t: 28, b: 20 }
const PW = W - M.l - M.r
const PH = H - M.t - M.b

/** Scale top that splits into three even, readable steps (four ticks). */
function niceTop(max: number): number {
  const raw = Math.max(max, 1) / 3
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag
  return Math.max(3, step * 3)
}

export function SalesStockChart({ sales, stock, start, detected, zeroDays = 0, truthStart }: Props) {
  const n = sales.length
  const x = (i: number) => M.l + (i / (n - 1)) * PW
  const sTop = niceTop(Math.max(...sales))
  const kTop = niceTop(Math.max(...stock))
  const ys = (v: number) => M.t + PH - (v / sTop) * PH
  const yk = (v: number) => M.t + PH - (v / kTop) * PH

  const salesPath = sales.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${ys(v).toFixed(1)}`).join('')
  let stockPath = `M${x(0).toFixed(1)} ${yk(stock[0]).toFixed(1)}`
  for (let i = 1; i < n; i++) stockPath += `H${x(i).toFixed(1)}V${yk(stock[i]).toFixed(1)}`

  const ticks = [0, 1, 2, 3].map((k) => (sTop / 3) * k)
  const xticks = [0, 30, 60, 90, n - 1]

  // inline end labels, pushed apart if they collide
  let ySalesLbl = ys(sales[n - 1])
  let yStockLbl = yk(stock[n - 1])
  if (Math.abs(ySalesLbl - yStockLbl) < 24) {
    const mid = (ySalesLbl + yStockLbl) / 2
    const up = ySalesLbl < yStockLbl
    ySalesLbl = mid + (up ? -12 : 12)
    yStockLbl = mid + (up ? 12 : -12)
  }
  const clampY = (y: number) => Math.max(M.t + 8, Math.min(M.t + PH, y))

  const di = daysBetween(start, detected)
  const ti = truthStart ? daysBetween(start, truthStart) : -1
  const flagRight = di > (n - 1) * 0.6

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`Daily sales and system stock for 120 days, flagged ${shortDate(detected)}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid" x1={M.l} x2={M.l + PW} y1={ys(t)} y2={ys(t)} />
          <text className="mono" x={M.l - 6} y={ys(t) + 4} textAnchor="end">
            {Number.isInteger(t) ? t : t.toFixed(1)}
          </text>
        </g>
      ))}
      {xticks.map((i) => (
        <text key={i} className="mono" x={x(i)} y={H - 4} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>
          {shortDate(addDays(start, i))}
        </text>
      ))}

      <path d={stockPath} fill="none" stroke="var(--ink-3)" strokeWidth="1.25" strokeDasharray="4 3" />
      <path d={salesPath} fill="none" stroke="var(--action)" strokeWidth="1.5" strokeLinejoin="round" />
      {zeroDays > 0 && (
        // the silence: the current run of zero-sale days, marked on the baseline
        <line x1={x(Math.max(0, n - zeroDays - 0.5))} x2={x(n - 1)} y1={ys(0)} y2={ys(0)} stroke="var(--critical)" strokeWidth="3" />
      )}

      {ti >= 0 && ti < n && (
        <g>
          <line x1={x(ti)} x2={x(ti)} y1={M.t - 2} y2={M.t + PH} stroke="var(--ink-3)" strokeWidth="1" strokeDasharray="2 2" />
          <text x={x(ti) - 4} y={M.t - 4} textAnchor="end">
            Began {shortDate(truthStart!)}
          </text>
        </g>
      )}
      {di >= 0 && di < n && (
        <g>
          <line x1={x(di)} x2={x(di)} y1={M.t - 14} y2={M.t + PH} stroke="var(--critical)" strokeWidth="1" />
          <text x={flagRight ? x(di) - 4 : x(di) + 4} y={M.t - 16} textAnchor={flagRight ? 'end' : 'start'}
            style={{ fill: 'var(--critical)' }}>
            Flagged {shortDate(detected)}
          </text>
        </g>
      )}

      <text x={M.l + PW + 6} y={clampY(ySalesLbl) + 4} style={{ fill: 'var(--action)' }}>
        Sales/day
      </text>
      <text x={M.l + PW + 6} y={clampY(yStockLbl) + 4}>
        Stock <tspan className="mono">{stock[n - 1]}</tspan>
      </text>
    </svg>
  )
}
