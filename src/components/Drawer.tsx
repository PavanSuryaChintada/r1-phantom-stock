import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  label: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/** Right drawer, 480px. Esc closes, focus is trapped inside and returned to the opener on close. */
export function Drawer({ label, onClose, children, footer }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLElement | null>(null)

  useEffect(() => {
    opener.current = document.activeElement as HTMLElement
    ref.current?.focus()
    return () => opener.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.querySelector('.dd-list')) return
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const items = ref.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])',
      )
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className="drawer" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </div>
    </>
  )
}
