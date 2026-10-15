const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parse(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function addDays(iso: string, n: number): string {
  const d = parse(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000)
}

/** Thu 16 Oct */
export function dayLabel(iso: string): string {
  const d = parse(iso)
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

/** 16 Oct */
export function shortDate(iso: string): string {
  const d = parse(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

export function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export function inrPrecise(n: number): string {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** ₹ 2.77 Cr / ₹ 18.4 L */
export function inrShort(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`
  return inr(n)
}

/** Confidence never reads as certainty: shown floored, capped at 0.99. */
export function conf(p: number): string {
  return Math.min(0.99, Math.floor(p * 100) / 100).toFixed(2)
}

export function rate(x: number): string {
  return x < 10 ? x.toFixed(1) : x.toFixed(0)
}

export function pct(x: number, digits = 0): string {
  return `${(x * 100).toFixed(digits)}%`
}

export function int(n: number): string {
  return Math.round(n).toLocaleString('en-IN')
}
