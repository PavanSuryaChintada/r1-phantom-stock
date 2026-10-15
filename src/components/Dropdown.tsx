import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

export interface Option {
  value: string
  label: string
  meta?: ReactNode
}

interface Props {
  options: Option[]
  value: string
  onChange: (v: string) => void
  label: string
}

/** Custom listbox: arrows, Enter, Esc, Home/End and type-ahead. */
export function Dropdown({ options, value, onChange, label }: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const typed = useRef({ text: '', at: 0 })
  const id = useId()
  const current = options.find((o) => o.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    list.current?.focus()
    const close = (e: MouseEvent) => {
      if (!list.current?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const openList = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }
  const choose = (i: number) => {
    onChange(options[i].value)
    setOpen(false)
    trigger.current?.focus()
  }

  const onListKey = (e: KeyboardEvent) => {
    const last = options.length - 1
    if (e.key === 'ArrowDown') setActive((a) => Math.min(last, a + 1))
    else if (e.key === 'ArrowUp') setActive((a) => Math.max(0, a - 1))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(last)
    else if (e.key === 'Enter' || e.key === ' ') choose(active)
    else if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') e.preventDefault()
      setOpen(false)
      trigger.current?.focus()
      return
    } else if (e.key.length === 1) {
      const now = Date.now()
      typed.current.text = (now - typed.current.at > 600 ? '' : typed.current.text) + e.key.toLowerCase()
      typed.current.at = now
      const q = typed.current.text
      const hit = options.findIndex((o) => o.label.toLowerCase().includes(q))
      if (hit >= 0) setActive(hit)
      return
    } else return
    e.preventDefault()
  }

  return (
    <div className="dd">
      <button
        ref={trigger}
        type="button"
        className="dd-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${label}: ${current.label}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            openList()
          }
        }}
      >
        {current.label}
        <span className="dd-caret" aria-hidden="true" />
      </button>
      {open && (
        <ul
          ref={list}
          id={id}
          className="dd-list"
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onListKey}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={o.value === value}
              className={i === active ? 'active' : undefined}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
            >
              <span className="dd-label">{o.label}</span>
              {o.meta && <span className="meta">{o.meta}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
