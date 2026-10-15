import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Stat({ value, label, accent = false }: { value: ReactNode; label: string; accent?: boolean }) {
  return (
    <div>
      <div className={`stat-fig${accent ? ' accent' : ''}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  icon?: boolean
}

export function Button({ variant = 'secondary', icon = false, className = '', type = 'button', ...rest }: ButtonProps) {
  const cls = ['btn', variant !== 'secondary' && variant, icon && 'icon', className].filter(Boolean).join(' ')
  return <button type={type} className={cls} {...rest} />
}
