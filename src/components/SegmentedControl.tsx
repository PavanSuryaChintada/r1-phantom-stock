import { useRef, type KeyboardEvent } from 'react'

export interface Segment<T extends string> {
  value: T
  label: string
  count?: number
}

interface Props<T extends string> {
  segments: Segment<T>[]
  value: T
  onChange: (v: T) => void
  label: string
  size?: 'md' | 'lg'
}

export function SegmentedControl<T extends string>({ segments, value, onChange, label, size = 'md' }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const j = (i + d + segments.length) % segments.length
    onChange(segments[j].value)
    refs.current[j]?.focus()
  }
  return (
    <div className={`seg${size === 'lg' ? ' lg' : ''}`} role="radiogroup" aria-label={label}>
      {segments.map((s, i) => (
        <button
          key={s.value}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={s.value === value}
          tabIndex={s.value === value ? 0 : -1}
          onClick={() => onChange(s.value)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {s.label}
          {s.count !== undefined && <span className="seg-count">{s.count}</span>}
        </button>
      ))}
    </div>
  )
}
