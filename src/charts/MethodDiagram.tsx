const STEPS = [
  { title: 'Expected demand', lines: ['Per SKU, per store:', 'base × weekday ×', 'season × promo'] },
  { title: 'Odds of the silence', lines: ['How unlikely is this', 'run of zero-sale days', 'for this SKU?'] },
  { title: 'Rupees at risk', lines: ['probability × demand', '× margin × days the', 'gap would stay hidden'] },
  { title: 'Aisle walks', lines: ['Top 20 by rupees,', 'grouped by aisle,', 'printed for 7am'] },
]

const W = 680
const H = 128
const GAP = 24
const BW = (W - GAP * 3) / 4

export function MethodDiagram() {
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label="Four steps: expected demand, odds of the silence, rupees at risk, aisle walks">
      <defs>
        <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M0 0L8 4L0 8z" fill="var(--ink-3)" />
        </marker>
      </defs>
      {STEPS.map((s, i) => {
        const x = i * (BW + GAP)
        const last = i === STEPS.length - 1
        return (
          <g key={s.title}>
            <rect x={x + 0.5} y={0.5} width={BW - 1} height={H - 1}
              fill={last ? 'var(--action-weak)' : 'var(--paper)'} stroke={last ? 'var(--action)' : 'var(--hairline-firm)'} />
            <text className="mono" x={x + 12} y={24} style={{ fill: 'var(--action)', fontWeight: 500 }}>
              {i + 1}
            </text>
            <text x={x + 12} y={46} style={{ fill: 'var(--ink)', fontSize: 13, fontWeight: 600 }}>
              {s.title}
            </text>
            {s.lines.map((l, j) => (
              <text key={j} x={x + 12} y={72 + j * 16} style={{ fill: 'var(--ink-2)', fontSize: 12 }}>
                {l}
              </text>
            ))}
            {!last && (
              <line x1={x + BW + 2} x2={x + BW + GAP - 3} y1={H / 2} y2={H / 2} stroke="var(--ink-3)" markerEnd="url(#arrow)" />
            )}
          </g>
        )
      })}
    </svg>
  )
}
