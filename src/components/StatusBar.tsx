export type Tone = 'critical' | 'warn' | 'unknown' | 'ok' | 'muted'

/** Status is always bar + square + text, so it still reads with the colour removed. */
export function StatusBar({ tone, label, bar = false }: { tone: Tone; label: string; bar?: boolean }) {
  return (
    <span className={`status tone-${tone}${bar ? ' with-bar' : ''}`}>
      <span className="status-sq" aria-hidden="true" />
      <span className="status-label">{label}</span>
    </span>
  )
}
