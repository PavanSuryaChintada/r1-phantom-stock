const W = 1120
const H = 520
const X0 = 168          // content starts after the tier gutter
const X1 = 1076         // content ends before the feedback lane
const CW = X1 - X0

interface Box {
  title: string
  sub: string[]
  mono?: boolean
  key?: boolean
  step?: number
}

const SOURCES: Box[] = [
  { title: 'POS sales', sub: ['units per SKU, per day'] },
  { title: 'System stock', sub: ['end-of-day on hand'] },
  { title: 'Deliveries', sub: ['receipts, lead times'] },
  { title: 'Calendar', sub: ['weekday, festival, promo'] },
  { title: 'Cycle counts', sub: ['past findings, store prior'] },
]

const ENGINE: Box[] = [
  { step: 1, title: 'Demand model', sub: ['base × weekday', '× season × promo'] },
  { step: 2, title: 'Silence test', sub: ['P(k zero days)', 'under NegBin'] },
  { step: 3, title: 'Posterior', sub: ['store prior ×', 'likelihood'] },
  { step: 4, title: 'Rupees at risk', sub: ['p × demand ×', 'margin × days'], key: true },
  { step: 5, title: 'Rank, abstain', sub: ['top 20 by ₹,', 'stop when unsure'] },
  { step: 6, title: 'Aisle walks', sub: ['group checks', 'by aisle'] },
]

const FIXTURES: Box[] = [
  { title: 'stores.json', sub: ['25 stores'], mono: true },
  { title: 'checklist.json', sub: ['ranked lists, reasons'], mono: true },
  { title: 'series.json', sub: ['120-day evidence'], mono: true },
  { title: 'metrics.json', sub: ['precision, impact'], mono: true },
]

const CLIENT: Box[] = [
  { title: 'Morning list', sub: ['ranking toggle'] },
  { title: 'Evidence drawer', sub: ['chart + breakdown'] },
  { title: 'Walk plan', sub: ['printable'] },
  { title: 'Method, impact', sub: ['formula, sliders'] },
]

function Row({ boxes, x, y, w, h, gap, arrows = false }: { boxes: Box[]; x: number; y: number; w: number; h: number; gap: number; arrows?: boolean }) {
  const bw = (w - gap * (boxes.length - 1)) / boxes.length
  return (
    <g>
      {boxes.map((b, i) => {
        const bx = x + i * (bw + gap)
        const ty = b.step ? y + 38 : y + 24
        return (
          <g key={b.title}>
            <rect x={bx + 0.5} y={y + 0.5} width={bw - 1} height={h - 1}
              fill={b.key ? 'var(--action-weak)' : 'var(--paper)'}
              stroke={b.key ? 'var(--action)' : 'var(--hairline-firm)'} strokeWidth={b.key ? 1.5 : 1} />
            {b.step && (
              <text className="mono" x={bx + 12} y={y + 18} style={{ fill: 'var(--action)', fontWeight: 500 }}>
                {b.step}
              </text>
            )}
            <text className={b.mono ? 'mono' : undefined} x={bx + 12} y={ty}
              style={{ fill: 'var(--ink)', fontSize: 13, fontWeight: b.mono ? 500 : 600 }}>
              {b.title}
            </text>
            {b.sub.map((s, j) => (
              <text key={j} x={bx + 12} y={ty + 17 + j * 15} style={{ fill: 'var(--ink-2)', fontSize: 11.5 }}>
                {s}
              </text>
            ))}
            {arrows && i < boxes.length - 1 && (
              <line x1={bx + bw + 1} x2={bx + bw + gap - 2} y1={y + h / 2} y2={y + h / 2}
                stroke="var(--ink-3)" markerEnd="url(#arch-arrow)" />
            )}
          </g>
        )
      })}
    </g>
  )
}

function Down({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  return <line x1={x} x2={x} y1={y1} y2={y2 - 1} stroke="var(--ink-3)" markerEnd="url(#arch-arrow)" />
}

function Tier({ y, h, title, sub }: { y: number; h: number; title: string; sub: string }) {
  return (
    <g>
      <text x={0} y={y + h / 2 - 2} style={{ fill: 'var(--ink)', fontSize: 13, fontWeight: 600 }}>
        {title}
      </text>
      <text x={0} y={y + h / 2 + 14}>{sub}</text>
    </g>
  )
}

export function ArchitectureDiagram() {
  const srcY = 8, srcH = 64
  const engY = 104, engH = 136
  const fixY = 272, fixH = 60
  const cliY = 364, cliH = 136
  const srcW = (CW - 16 * 4) / 5
  const srcCx = (i: number) => X0 + i * (srcW + 16) + srcW / 2

  return (
    <svg className="chart arch" viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label="Architecture: five data sources feed a six-step offline scoring engine, which writes four JSON artefacts that a static React client renders. Verified checks feed back into the store prior.">
      <defs>
        <marker id="arch-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0L8 4L0 8z" fill="var(--ink-3)" />
        </marker>
        <marker id="arch-arrow-accent" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0L8 4L0 8z" fill="var(--action)" />
        </marker>
      </defs>

      <Tier y={srcY} h={srcH} title="Data in" sub="nightly, per store" />
      <Row boxes={SOURCES} x={X0} y={srcY} w={CW} h={srcH} gap={16} />
      {SOURCES.map((_, i) => (
        <Down key={i} x={srcCx(i)} y1={srcY + srcH} y2={engY} />
      ))}

      <Tier y={engY} h={engH} title="Scoring engine" sub="offline batch" />
      <rect x={X0 + 0.5} y={engY + 0.5} width={CW - 1} height={engH - 1} fill="var(--sunken)" stroke="var(--hairline-firm)" strokeDasharray="4 3" />
      <text x={X0 + 16} y={engY + 22} style={{ fill: 'var(--ink-2)', fontSize: 12, fontWeight: 500 }}>
        Python · NumPy · SciPy — 20,000 SKU-store series scored per run
      </text>
      <Row boxes={ENGINE} x={X0 + 16} y={engY + 36} w={CW - 32} h={84} gap={18} arrows />

      <Down x={X0 + CW / 2} y1={engY + engH} y2={fixY} />

      <Tier y={fixY} h={fixH} title="Artefacts" sub="committed JSON" />
      <Row boxes={FIXTURES} x={X0} y={fixY} w={CW} h={fixH} gap={16} />

      <Down x={X0 + CW / 2} y1={fixY + fixH} y2={cliY} />

      <Tier y={cliY} h={cliH} title="Client" sub="browser, offline" />
      <rect x={X0 + 0.5} y={cliY + 0.5} width={CW - 1} height={cliH - 1} fill="var(--paper)" stroke="var(--action)" />
      <text x={X0 + 16} y={cliY + 22} style={{ fill: 'var(--ink-2)', fontSize: 12, fontWeight: 500 }}>
        React 18 · TypeScript · static on Vercel — no API calls, works offline
      </text>
      <Row boxes={CLIENT} x={X0 + 16} y={cliY + 36} w={CW - 32} h={84} gap={16} />

      {/* feedback: verified checks become next quarter's prior */}
      <path d={`M${X1} ${cliY + cliH / 2} H${W - 14} V${srcY + srcH / 2} H${X1 + 2}`} fill="none"
        stroke="var(--action)" strokeDasharray="4 3" markerEnd="url(#arch-arrow-accent)" />
      <text transform={`translate(${W - 4} ${(srcY + cliY + cliH) / 2}) rotate(-90)`} textAnchor="middle"
        style={{ fill: 'var(--action)', fontSize: 11 }}>
        verify and dismiss outcomes update the store prior
      </text>
    </svg>
  )
}
