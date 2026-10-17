import { Link } from 'react-router-dom'

export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect width="16" height="16" fill="var(--action)" />
      <rect x="3" y="3" width="3" height="10" fill="#fff" />
      <rect x="8" y="3" width="5" height="4" fill="#fff" />
    </svg>
  )
}

export function Brand({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="brand" aria-label="Phantom, back to overview">
      <BrandMark />
      <span>
        <strong>Phantom</strong>
        <span className="meta">Stock-out detector</span>
      </span>
    </Link>
  )
}
