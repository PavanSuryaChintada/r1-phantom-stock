export interface HBarRow {
  label: string
  display: string
  frac: number
}

export function HBars({ rows }: { rows: HBarRow[] }) {
  return (
    <div className="hbar">
      {rows.map((r) => (
        <div key={r.label} style={{ display: 'contents' }}>
          <span className="ink2">{r.label}</span>
          <span className="hbar-track" aria-hidden="true">
            <span className="hbar-fill" style={{ width: `${Math.max(1, Math.min(1, r.frac) * 100)}%` }} />
          </span>
          <span className="hbar-val">{r.display}</span>
        </div>
      ))}
    </div>
  )
}

export interface VBar {
  label: string
  value: number
  display: string
  current?: boolean
}

const W = 520
const H = 220
const M = { l: 8, r: 8, t: 24, b: 28 }

export function VBars({ bars, label }: { bars: VBar[]; label: string }) {
  const max = Math.max(...bars.map((b) => b.value), 1)
  const slot = (W - M.l - M.r) / bars.length
  const bw = Math.min(72, slot * 0.56)
  const ph = H - M.t - M.b
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }} role="img" aria-label={label}>
      <line className="axis" x1={M.l} x2={W - M.r} y1={M.t + ph} y2={M.t + ph} />
      {bars.map((b, i) => {
        const h = (b.value / max) * ph
        const cx = M.l + slot * i + slot / 2
        return (
          <g key={b.label}>
            <rect x={cx - bw / 2} y={M.t + ph - h} width={bw} height={h}
              fill={b.current ? 'var(--action)' : 'var(--hairline-firm)'} />
            <text className="mono" x={cx} y={M.t + ph - h - 8} textAnchor="middle"
              style={{ fill: b.current ? 'var(--action)' : 'var(--ink-2)', fontWeight: b.current ? 600 : 400 }}>
              {b.display}
            </text>
            <text x={cx} y={H - 8} textAnchor="middle">
              {b.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
