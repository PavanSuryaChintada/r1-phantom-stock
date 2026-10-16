import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import type { Tone } from './StatusBar'

export interface Column<T> {
  key: string
  header: string
  width?: number
  align?: 'left' | 'right'
  className?: string
  render: (row: T, index: number) => ReactNode
}

interface Props<T> {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  tone: (row: T) => Tone
  onOpen: (row: T) => void
  selected?: string | null
  rowClass?: (row: T) => string | undefined
  label: string
}

/** Tab into the table, arrows move between rows, Enter opens. Leftmost cell is the 3px status ribbon. */
export function Table<T>({ rows, columns, rowKey, tone, onOpen, selected, rowClass, label }: Props<T>) {
  const refs = useRef<(HTMLTableRowElement | null)[]>([])
  const focusRow = (i: number) => refs.current[Math.max(0, Math.min(rows.length - 1, i))]?.focus()
  const selIndex = rows.findIndex((r) => rowKey(r) === selected)
  const tabStop = selIndex >= 0 ? selIndex : 0

  const onKey = (e: KeyboardEvent, i: number, row: T) => {
    if (e.key === 'ArrowDown') focusRow(i + 1)
    else if (e.key === 'ArrowUp') focusRow(i - 1)
    else if (e.key === 'Home') focusRow(0)
    else if (e.key === 'End') focusRow(rows.length - 1)
    else if (e.key === 'Enter' || e.key === ' ') onOpen(row)
    else return
    e.preventDefault()
  }

  return (
    <table className="tbl" aria-label={label}>
      <colgroup>
        <col style={{ width: 3 }} />
        {columns.map((c) => (
          <col key={c.key} style={c.width ? { width: c.width } : undefined} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th aria-label="Status bar" />
          {columns.map((c) => (
            <th key={c.key} className={c.align === 'right' ? 'r' : undefined} scope="col">
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const k = rowKey(row)
          return (
            <tr
              key={k}
              ref={(el) => {
                refs.current[i] = el
              }}
              tabIndex={i === tabStop ? 0 : -1}
              aria-selected={k === selected}
              className={rowClass?.(row)}
              onClick={() => onOpen(row)}
              onKeyDown={(e) => onKey(e, i, row)}
            >
              <td className={`bar tone-${tone(row)}`} aria-hidden="true" />
              {columns.map((c, ci) => (
                <td
                  key={c.key}
                  className={[c.className, c.align === 'right' && 'r', ci === 0 && 'sel'].filter(Boolean).join(' ')}
                >
                  {c.render(row, i)}
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
