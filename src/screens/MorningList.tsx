import { useEffect, useMemo, useState } from 'react'
import { EmptyState, Stat } from '../components/Basics'
import { SegmentedControl } from '../components/SegmentedControl'
import { StatusBar } from '../components/StatusBar'
import { Table, type Column } from '../components/Table'
import { checklists, metrics, storeById, type Check, type IssueType } from '../lib/data'
import { conf, dayLabel, inr } from '../lib/format'
import { statusOf } from '../lib/status'
import { useApp } from '../state'
import { SkuDrawer } from './SkuDrawer'

type Rank = 'money' | 'confidence'
type Filter = 'all' | IssueType
type Row = Check & { rank: number }

export function MorningList() {
  const { storeId, decisions } = useApp()
  const list = checklists[storeId]
  const store = storeById(storeId)
  const [rank, setRank] = useState<Rank>('money')
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    setOpen(null)
    setFilter('all')
  }, [storeId])

  // walkthrough cues
  useEffect(() => {
    const on = (e: Event) => {
      const cue = (e as CustomEvent<string>).detail
      if (cue === 'reset' || cue === 'open-first') {
        setRank('money')
        setFilter('all')
      }
      if (cue === 'open-first') setOpen(list.money[0] ?? null)
      if (cue === 'reset' || cue === 'close') setOpen(null)
    }
    window.addEventListener('phantom:tour', on)
    return () => window.removeEventListener('phantom:tour', on)
  }, [list])

  const ranked: Row[] = useMemo(
    () => (rank === 'money' ? list.money : list.confidence).map((sku, i) => ({ ...list.items[sku], rank: i + 1 })),
    [list, rank],
  )
  const rows = filter === 'all' ? ranked : ranked.filter((r) => r.type === filter)
  const count = (t: IssueType) => ranked.filter((r) => r.type === t).length
  const dec = (sku: string) => decisions[`${storeId}:${sku}`]

  const n = list.money.length
  const verified = Object.values(list.items).filter((c) => dec(c.sku) === 'verified')
  const confirmed = verified.filter((c) => c.truth === 'phantom').length
  const allDismissed = rows.length > 0 && rows.every((r) => dec(r.sku) === 'dismissed')

  const columns: Column<Row>[] = [
    { key: 'rank', header: '#', width: 40, align: 'right', className: 'mono', render: (r) => r.rank },
    { key: 'sku', header: 'SKU', width: 168, className: 'sku', render: (r) => r.sku },
    { key: 'aisle', header: 'Aisle', width: 56, align: 'right', className: 'mono', render: (r) => r.aisle },
    { key: 'conf', header: 'Confidence', width: 88, align: 'right', className: 'mono', render: (r) => conf(r.p) },
    { key: 'ev', header: '₹ at risk', width: 104, align: 'right', className: 'ev', render: (r) => inr(r.ev) },
    { key: 'why', header: 'Why', className: 'why', render: (r) => <span title={r.reason}>{r.reason}</span> },
    {
      key: 'status',
      header: 'Status',
      width: 152,
      render: (r) => {
        const s = statusOf(r, dec(r.sku))
        return <StatusBar tone={s.tone} label={s.label} />
      },
    },
  ]

  const openCheck = open ? list.items[open] : null

  return (
    <div className="page">
      <div className="ml-head">
        <div data-tour="list-head">
          <h1 className="display">Morning check list</h1>
          <p className="meta">
            {store.name} · {store.format}, {store.city} · {dayLabel(metrics.listDate)}
          </p>
        </div>
        <div className="stats" data-tour="stats">
          <Stat value={n} label="checks" />
          <Stat value={list.walks.length} label="aisle walks" />
          <Stat value={inr(list.moneyTotal)} label="recoverable today" accent />
          <Stat value={verified.length ? confirmed : '—'} label={verified.length ? `confirmed phantoms of ${verified.length} checked` : 'confirmed phantoms'} />
        </div>
      </div>

      <div className="ml-controls">
        <span data-tour="filters">
        <SegmentedControl<Filter>
          label="Filter by issue"
          value={filter}
          onChange={setFilter}
          segments={[
            { value: 'all', label: 'All', count: ranked.length },
            { value: 'phantom', label: 'Phantom', count: count('phantom') },
            { value: 'misplaced', label: 'Misplaced', count: count('misplaced') },
            { value: 'delisted', label: 'Delisted', count: count('delisted') },
          ]}
        />
        </span>
        <span className="spacer" />
        <span className="rank-wrap" data-tour="rank">
        <span className="rank-label" id="rank-label">
          Rank by
        </span>
        <SegmentedControl<Rank>
          label="Rank by"
          size="lg"
          value={rank}
          onChange={setRank}
          segments={[
            { value: 'money', label: '₹ recovered' },
            { value: 'confidence', label: 'Confidence' },
          ]}
        />
        </span>
      </div>

      {list.pool < metrics.checks && (
        <p className="abstain">
          Only <span className="mono">{n}</span> checks are confident enough today. Padding the list to{' '}
          <span className="mono">{metrics.checks}</span> would lower precision.
        </p>
      )}

      {allDismissed ? (
        <EmptyState>All checks cleared for today.</EmptyState>
      ) : rows.length === 0 ? (
        <EmptyState>No {filter} flags in today's list.</EmptyState>
      ) : (
        <Table
          label="Morning check list"
          rows={rows}
          columns={columns}
          rowKey={(r) => r.sku}
          tone={(r) => statusOf(r, dec(r.sku)).tone}
          rowClass={(r) => (dec(r.sku) === 'dismissed' ? 'dismissed' : undefined)}
          selected={open}
          onOpen={(r) => setOpen(r.sku)}
        />
      )}

      <p className="caption" aria-live="polite">
        {rank === 'money' ? (
          <>
            Ranked by money recovered — the {n} checks cover <strong className="mono">{inr(list.moneyTotal)}</strong>
          </>
        ) : list.dropped > 0 ? (
          <>
            Ranked by confidence — the same {n} slots cover <strong className="mono">{inr(list.confidenceTotal)}</strong>.{' '}
            <strong className="mono">{inr(list.dropped)}</strong> of value drops out of the top {n}.
          </>
        ) : (
          <>Ranked by confidence — the same {n} checks. Every confident flag already fits, so nothing drops out.</>
        )}
      </p>

      {openCheck && <SkuDrawer check={openCheck} storeId={storeId} onClose={() => setOpen(null)} />}
    </div>
  )
}
