import type { Walk } from '../lib/data'
import { inr } from '../lib/format'

const W = 1000
const H = 272
const X0 = 56
const X1 = W - 24
const TOP = 52
const BOTTOM = 196
const WALKWAY = 226
const N = 18

interface Props {
  walks: Walk[]
  stopOf: Map<number, number>
  done: Map<number, boolean>
  onPick: (aisle: number) => void
}

/** Store floor plan: 18 aisles shaded by rupees at risk, and the walking route in floor order. */
export function StoreMap({ walks, stopOf, done, onPick }: Props) {
  const slot = (X1 - X0) / N
  const lane = slot * 0.62
  const cx = (a: number) => X0 + (a - 1) * slot + slot / 2
  const byAisle = new Map(walks.map((w) => [w.aisle, w]))
  const max = Math.max(1, ...walks.map((w) => w.total))
  const route = [...walks].sort((a, b) => a.aisle - b.aisle)

  let d = `M24 ${H - 16} V${WALKWAY}`
  for (const w of route) d += ` H${cx(w.aisle)} V${TOP + 44} V${WALKWAY}`
  d += ` H${X1 - 4}`

  return (
    <svg className="chart storemap" viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`Store floor plan with ${walks.length} aisles to walk, in floor order`}>
      <defs>
        <marker id="route-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0L8 4L0 8z" fill="var(--action)" />
        </marker>
      </defs>
      <rect x={8.5} y={8.5} width={W - 17} height={H - 17} fill="var(--canvas)" stroke="var(--hairline-firm)" />
      <text x={24} y={30} style={{ fill: 'var(--ink-3)' }}>Back wall</text>

      {Array.from({ length: N }, (_, i) => i + 1).map((a) => {
        const w = byAisle.get(a)
        const x = cx(a) - lane / 2
        const stop = stopOf.get(a)
        return (
          <g key={a} className={w ? 'storemap-aisle' : undefined} onClick={w ? () => onPick(a) : undefined}
            role={w ? 'button' : undefined} tabIndex={w ? 0 : undefined}
            onKeyDown={w ? (e) => (e.key === 'Enter' || e.key === ' ') && onPick(a) : undefined}
            aria-label={w ? `Aisle ${a}, ${w.aisleName}, ${inr(w.total)}, stop ${stop}` : undefined}>
            <title>{w ? `Aisle ${a} · ${w.aisleName} · ${inr(w.total)}` : `Aisle ${a}`}</title>
            <rect x={x + 0.5} y={TOP + 0.5} width={lane - 1} height={BOTTOM - TOP} fill="var(--paper)" stroke="var(--hairline-firm)" />
            {w && (
              <rect x={x + 1} y={TOP + 1} width={lane - 2} height={BOTTOM - TOP - 1} fill="var(--action)"
                fillOpacity={done.get(a) ? 0.08 : 0.16 + 0.7 * (w.total / max)} />
            )}
            <text className="mono" x={cx(a)} y={TOP - 8} textAnchor="middle"
              style={{ fill: w ? 'var(--ink)' : 'var(--ink-3)', fontWeight: w ? 500 : 400 }}>
              {a}
            </text>
            {w && stop !== undefined && (
              <g>
                <rect x={cx(a) - 10} y={TOP + 12} width={20} height={20} fill={done.get(a) ? 'var(--ok)' : 'var(--ink)'} />
                <text className="mono" x={cx(a)} y={TOP + 26} textAnchor="middle" style={{ fill: '#fff', fontWeight: 600, fontSize: 11 }}>
                  {stop}
                </text>
              </g>
            )}
          </g>
        )
      })}

      <path d={d} fill="none" stroke="var(--action)" strokeWidth="2" strokeLinejoin="miter" markerEnd="url(#route-arrow)" />
      <rect x={14} y={H - 24} width={20} height={8} fill="var(--action)" />
      <text x={40} y={H - 16} style={{ fill: 'var(--ink-2)' }}>Entrance</text>
      <text x={X1} y={H - 16} textAnchor="end">Darker aisle = more ₹ at risk · line = suggested route, floor order</text>
    </svg>
  )
}
