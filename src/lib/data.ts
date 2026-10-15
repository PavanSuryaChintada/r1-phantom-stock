import storesJson from '../data/stores.json'
import checklistJson from '../data/checklist.json'
import seriesJson from '../data/series.json'
import metricsJson from '../data/metrics.json'

export type IssueType = 'phantom' | 'misplaced' | 'delisted'

export interface Check {
  sku: string
  name: string
  aisle: number
  aisleName: string
  type: IssueType
  p: number
  key: number
  pZero: number
  rate: number
  expected: number
  margin: number
  daysLost: number
  ev: number
  zeroDays: number
  stock: number
  daysToCount: number
  lastSale: string | null
  lastReceipt: string | null
  detected: string
  reason: string
  detail: string
  truth: IssueType | null
  truthStart: string | null
  walk: string | null
}

export interface Walk {
  id: string
  aisle: number
  aisleName: string
  skus: string[]
  total: number
}

export interface StoreList {
  pool: number
  money: string[]
  confidence: string[]
  moneyTotal: number
  confidenceTotal: number
  dropped: number
  walks: Walk[]
  items: Record<string, Check>
  prior: number
  precision: number | null
}

export interface Store {
  id: string
  name: string
  area: string
  city: string
  tier: number
  format: string
  sqft: number
  checks: number
  walks: number
  recoverable: number
}

export interface Series {
  sales: number[]
  stock: number[]
}

export interface Metrics {
  listDate: string
  lastDataDay: string
  historyStart: string
  stores: number
  skus: number
  seriesTotal: number
  threshold: number
  checks: number
  cycleDays: number
  precisionAt20: number
  recall: number
  activePhantoms: number
  activeByType: Record<IssueType, number>
  listedByType: Record<IssueType, number>
  medianDetectionLag: number | null
  perAisle: { aisle: number; name: string; active: number; flagged: number; listed: number }[]
  comparison: Record<'rule' | 'model', { alerts: number; caught: number; falsePositives: number; precisionAt20: number }>
  impact: {
    phantomsPerStoreDay: number
    daysHidden: number
    dailyDemand: number
    unitMargin: number
    stores: number
    share: number
    shareAt: Record<string, number>
  }
}

export const stores = storesJson as Store[]
export const checklists = checklistJson as unknown as Record<string, StoreList>
export const metrics = metricsJson as unknown as Metrics
const seriesData = seriesJson as unknown as { start: string; days: number; series: Record<string, Series> }
export const seriesStart = seriesData.start
export const seriesDays = seriesData.days

export const DEFAULT_STORE = '14'

export function getSeries(storeId: string, sku: string): Series | undefined {
  return seriesData.series[`${storeId}:${sku}`]
}

export function storeById(id: string): Store {
  return stores.find((s) => s.id === id) ?? stores[0]
}
