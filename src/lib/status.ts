import type { Tone } from '../components/StatusBar'
import type { Decision } from '../state'
import type { Check, IssueType } from './data'

const BY_TYPE: Record<IssueType, { tone: Tone; label: string }> = {
  phantom: { tone: 'critical', label: 'Likely phantom' },
  misplaced: { tone: 'warn', label: 'Possibly misplaced' },
  delisted: { tone: 'unknown', label: 'Possibly delisted' },
}

export function statusOf(c: Check, d: Decision | undefined): { tone: Tone; label: string } {
  if (d === 'verified') return { tone: 'ok', label: 'Confirmed' }
  if (d === 'dismissed') return { tone: 'muted', label: 'Dismissed' }
  return BY_TYPE[c.type]
}

export const TYPE_LABEL: Record<IssueType, string> = {
  phantom: 'Phantom',
  misplaced: 'Misplaced',
  delisted: 'Delisted',
}
