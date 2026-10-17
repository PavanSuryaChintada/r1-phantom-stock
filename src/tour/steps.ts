import { checklists, metrics } from '../lib/data'
import { inr, inrShort, int, pct } from '../lib/format'

export interface TourStep {
  route: string
  target: string
  title: string
  body: string
  /** event broadcast to the page when the step opens */
  event?: 'reset' | 'open-first' | 'close'
  place?: 'below' | 'left'
  /** hidden for accounts locked to one store */
  needsStoreSwitch?: boolean
}

const s14 = checklists['14']
const im = metrics.impact
const annual = im.phantomsPerStoreDay * im.daysHidden * im.dailyDemand * im.unitMargin * im.stores * 365 * im.share
const { rule, model } = metrics.comparison

export const TOUR_STEPS: TourStep[] = [
  {
    route: '/app',
    target: '[data-tour="list-head"]',
    event: 'reset',
    title: 'This is the 7am worklist',
    body: 'Every morning the manager gets at most twenty shelf checks, ranked by the rupees each check would recover. It is built only from sales and stock data the store already has.',
  },
  {
    route: '/app',
    target: '[data-tour="stats"]',
    title: 'Today at a glance',
    body: `${s14.money.length} checks in ${s14.walks.length} aisle walks, worth ${inr(s14.moneyTotal)}. The last figure fills in as checks are verified against ground truth.`,
  },
  {
    route: '/app',
    target: '[data-tour="rank"]',
    title: 'The one-click argument',
    body: `Click Confidence now. The list reshuffles: old, cheap phantoms rise to the top and ${inr(s14.dropped)} of value drops out of the top twenty. Ranking by money is the product.`,
  },
  {
    route: '/app',
    target: '.tbl tbody tr:first-child',
    title: 'Read a row',
    body: 'Severity ribbon on the left, then SKU, aisle, confidence, rupees at risk and a plain-English reason. Status is always a square plus words, never colour alone.',
  },
  {
    route: '/app',
    target: '.drawer',
    event: 'open-first',
    place: 'left',
    title: 'The evidence behind a check',
    body: 'Sales stopped while system stock stayed frozen, so nothing reordered. The red mark is the silent run. The four bars multiply to the rupee figure. Verify reveals the ground truth.',
  },
  {
    route: '/app',
    target: '[data-tour="filters"]',
    event: 'close',
    title: 'Not every silence is a phantom',
    body: 'Misplaced stock still sells slowly; a delisted line fades out over weeks. Each gets its own test and its own label, so the manager knows what to look for on the shelf.',
  },
  {
    route: '/app',
    target: '[data-tour="store"]',
    needsStoreSwitch: true,
    title: 'Every store, its own evidence bar',
    body: 'Switch stores here. Store 23, Baner, has only 11 confident flags, so its list stops at 11 instead of padding with noise. Abstaining keeps precision honest.',
  },
  {
    route: '/app/walks',
    target: '[data-tour="walks"]',
    title: 'The artefact a manager carries',
    body: 'The same checks, grouped by aisle, richest aisle first, with checkboxes. Print it and walk it.',
  },
  {
    route: '/app/method',
    target: '[data-tour="compare"]',
    title: 'Why not a simple rule?',
    body: `On the same morning a fixed 7-day rule fires ${int(rule.alerts)} alerts at ${pct(rule.precisionAt20)} precision. Per-SKU probability fires ${int(model.alerts)} at ${pct(model.precisionAt20)}.`,
  },
  {
    route: '/app/impact',
    target: '[data-tour="total"]',
    title: 'What it is worth',
    body: `Every input is a slider, measured from the data. At twenty checks a day across ${im.stores} stores that is about ${inrShort(annual)} of margin a year. Drag any slider to test the assumptions.`,
  },
]
