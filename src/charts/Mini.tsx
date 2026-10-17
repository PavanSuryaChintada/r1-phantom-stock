import type { Tone } from '../components/StatusBar'

const TONE_VAR: Record<Tone, string> = {
  critical: 'var(--critical)',
  warn: 'var(--warn)',
  unknown: 'var(--unknown)',
  ok: 'var(--ok)',
  muted: 'var(--muted-fail)',
}

/** Daily sales as bars; the tail being flagged is underlined in its status colour. */
export function Sparkline({
  values,
  markDays = 0,
  tone = 'critical',
  width = 132,
  height = 28,
}: {
  values: number[]
  markDays?: number
  tone?: Tone
  width?: number
  height?: number
}) {
  const n = values.length
  const max = Math.max(1, ...values)
  const bw = width / n
  const ph = height - 5
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {values.map((v, i) =>
        v > 0 ? (
          <rect key={i} x={i * bw + 0.25} y={ph - (v / max) * ph} width={Math.max(1, bw - 1)} height={(v / max) * ph}
            fill={i >= n - markDays ? 'var(--hairline-firm)' : 'var(--action)'} />
        ) : null,
      )}
      <line x1={0} x2={width} y1={ph + 0.5} y2={ph + 0.5} stroke="var(--hairline)" />
      {markDays > 0 && (
        <rect x={(n - Math.min(n, markDays)) * bw} y={ph + 1} width={Math.min(n, markDays) * bw} height={3} fill={TONE_VAR[tone]} />
      )}
    </svg>
  )
}

/** 0..1 meter with the value beside it. */
export function Meter({ value, label }: { value: number; label: string }) {
  return (
    <span className="meter">
      <span className="meter-track" aria-hidden="true">
        <span className="meter-fill" style={{ width: `${Math.max(2, Math.min(1, value) * 100)}%` }} />
      </span>
      <span className="mono">{label}</span>
    </span>
  )
}

/** Number with an in-cell bar scaled to the column maximum. */
export function DataBar({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <span className="databar">
      <span className="databar-track" aria-hidden="true">
        <span className="databar-fill" style={{ width: `${Math.max(2, (value / Math.max(1, max)) * 100)}%` }} />
      </span>
      <span className="databar-val">{label}</span>
    </span>
  )
}

export interface Segment {
  key: string
  value: number
  tone: Tone | 'pending'
  label: string
}

/** One stacked bar plus a legend; every segment is labelled, so colour is never the only cue. */
export function StackBar({ segments, total }: { segments: Segment[]; total?: number }) {
  const t = total ?? segments.reduce((a, s) => a + s.value, 0)
  return (
    <div>
      <div className="stack" role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(', ')}>
        {segments.map((s) =>
          s.value > 0 ? (
            <span key={s.key} style={{ width: `${(s.value / Math.max(1, t)) * 100}%`, background: s.tone === 'pending' ? 'var(--sunken)' : TONE_VAR[s.tone] }} />
          ) : null,
        )}
      </div>
      <div className="stack-legend">
        {segments.map((s) => (
          <span key={s.key} className={s.value === 0 ? 'ink3' : undefined}>
            <span className="status-sq" style={{ background: s.tone === 'pending' ? 'var(--hairline-firm)' : TONE_VAR[s.tone] }} />
            {s.label} <span className="mono">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
