import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../components/Basics'
import { SegmentedControl } from '../components/SegmentedControl'
import { StatusBar } from '../components/StatusBar'
import { Table, type Column } from '../components/Table'
import { DataBar, Meter, Sparkline, StackBar } from '../charts/Mini'
import { checklists, getSeries, metrics, storeById, type Check, type IssueType } from '../lib/data'
import { conf, dayLabel, inr } from '../lib/format'
import { statusOf } from '../lib/status'
import { useApp } from '../state'
import { SkuDrawer } from './SkuDrawer'

type Rank = 'money' | 'confidence'
type Filter = 'all' | IssueType
type Row = Check & { rank: number }

const AISLES = Array.from({ length: 18 }, (_, i) => i + 1)

export function MorningList() {
  const { storeId, decisions } = useApp()
  const list = checklists[storeId]
  const store = storeById(storeId)
  const [rank, setRank] = useState<Rank>('money')
  const [filter, setFilter] = useState<Filter>('all')
  const [aisle, setAisle] = useState<number | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    setOpen(null)
    setFilter('all')
    setAisle(null)
  }, [storeId])

  // walkthrough cues
  useEffect(() => {
    const on = (e: Event) => {
      const cue = (e as CustomEvent<string>).detail
      if (cue === 'reset' || cue === 'open-first') {
        setRank('money')
        setFilter('all')
        setAisle(null)
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
  const rows = ranked.filter((r) => (filter === 'all' || r.type === filter) && (aisle === null || r.aisle === aisle))
  const count = (t: IssueType) => ranked.filter((r) => r.type === t).length
  const dec = (sku: string) => decisions[`${storeId}:${sku}`]
  const maxEv = Math.max(1, ...ranked.map((r) => r.ev))

  const n = list.money.length
  const items = Object.values(list.items)
  const verified = items.filter((c) => dec(c.sku) === 'verified')
  const confirmed = verified.filter((c) => c.truth === 'phantom').length
  const real = verified.filter((c) => c.truth).length
  const dismissed = ranked.filter((r) => dec(r.sku) === 'dismissed').length
  const allDismissed = rows.length > 0 && rows.every((r) => dec(r.sku) === 'dismissed')

  const perAisle = new Map<number, number>()
  ranked.forEach((r) => perAisle.set(r.aisle, (perAisle.get(r.aisle) ?? 0) + r.ev))
  const maxAisle = Math.max(1, ...perAisle.values())
  const bestTotal = Math.max(list.moneyTotal, list.confidenceTotal, 1)

  const columns: Column<Row>[] = [
    { key: 'rank', header: '#', width: 40, align: 'right', className: 'mono', render: (r) => r.rank },
    {
      key: 'sku',
      header: 'Item',
      width: 224,
      render: (r) => (
        <span className="item">
          <span className="item-sku">{r.sku}</span>
          <span className="item-name">{r.name}</span>
        </span>
      ),
    },
    { key: 'aisle', header: 'Aisle', width: 52, align: 'right', className: 'mono', render: (r) => r.aisle },
    {
      key: 'spark',
      header: 'Sales, last 30 days',
      width: 156,
      render: (r) => {
        const s = getSeries(storeId, r.sku)
        if (!s) return null
        const mark = r.type === 'misplaced' ? 14 : Math.min(30, r.zeroDays)
        return <Sparkline values={s.sales.slice(-30)} markDays={mark} tone={statusOf(r, undefined).tone} />
      },
    },
    { key: 'conf', header: 'Confidence', width: 116, render: (r) => <Meter value={r.p} label={conf(r.p)} /> },
    {
      key: 'ev',
      header: '₹ at risk',
      width: 160,
      align: 'right',
      render: (r) => <DataBar value={r.ev} max={maxEv} label={inr(r.ev)} />,
    },
    { key: 'why', header: 'Why', className: 'why', render: (r) => <span title={r.reason}>{r.reason}</span> },
    {
      key: 'status',
      header: 'Status',
      width: 148,
      render: (r) => {
        const s = statusOf(r, dec(r.sku))
        return <StatusBar tone={s.tone} label={s.label} />
      },
    },
  ]

  const openCheck = open ? list.items[open] : null

  return (
    <div className="page">
      <div className="ml-title" data-tour="list-head">
        <h1 className="display">Morning check list</h1>
        <p className="meta">
          {store.name} · {store.format}, {store.city} · {dayLabel(metrics.listDate)}
        </p>
      </div>

      <div className="tiles" data-tour="stats">
        <section className="tile tile-value">
          <p className="tile-label">Recoverable today</p>
          <p className="tile-fig accent">{inr(list.moneyTotal)}</p>
          <div className="cmp">
            {(['money', 'confidence'] as Rank[]).map((k) => {
              const v = k === 'money' ? list.moneyTotal : list.confidenceTotal
              return (
                <div key={k} className={`cmp-row${rank === k ? ' on' : ''}`}>
                  <span>{k === 'money' ? 'Ranked by ₹' : 'By confidence'}</span>
                  <span className="cmp-track">
                    <span className="cmp-fill" style={{ width: `${(v / bestTotal) * 100}%` }} />
                  </span>
                  <span className="mono">{inr(v)}</span>
                </div>
              )
            })}
          </div>
          <p className="meta">
            {list.dropped > 0 ? (
              <>
                <span className="mono">{inr(list.dropped)}</span> more from the same {n} slots
              </>
            ) : (
              'Every confident flag fits; both rankings agree'
            )}
          </p>
        </section>

        <section className="tile">
          <p className="tile-label">Checks today</p>
          <p className="tile-fig">
            {n}
            <span className="tile-of">of {metrics.checks} slots</span>
          </p>
          <StackBar
            total={Math.max(n, ranked.length)}
            segments={[
              { key: 'p', value: count('phantom'), tone: 'critical', label: 'Phantom' },
              { key: 'm', value: count('misplaced'), tone: 'warn', label: 'Misplaced' },
              { key: 'd', value: count('delisted'), tone: 'unknown', label: 'Delisted' },
            ]}
          />
        </section>

        <section className="tile">
          <p className="tile-label">
            Where to walk <span className="ink3">· click an aisle</span>
          </p>
          <p className="tile-fig">
            {list.walks.length}
            <span className="tile-of">aisle walks</span>
          </p>
          <div className="aisles" role="group" aria-label="Rupees at risk by aisle">
            {AISLES.map((a) => {
              const v = perAisle.get(a) ?? 0
              return (
                <button
                  key={a}
                  type="button"
                  className={`aisle-cell${aisle === a ? ' on' : ''}`}
                  disabled={v === 0}
                  onClick={() => setAisle(aisle === a ? null : a)}
                  aria-pressed={aisle === a}
                  aria-label={`Aisle ${a}: ${v ? inr(v) : 'no checks'}`}
                  title={v ? `Aisle ${a} · ${inr(v)}` : `Aisle ${a} · no checks`}
                >
                  <span className="aisle-heat" style={{ opacity: v ? 0.18 + 0.82 * (v / maxAisle) : 0 }} />
                  <span className="aisle-num">{a}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="tile">
          <p className="tile-label">Checked so far</p>
          <p className="tile-fig">
            {verified.length + dismissed}
            <span className="tile-of">of {n}</span>
          </p>
          <StackBar
            total={n}
            segments={[
              { key: 'c', value: real, tone: 'ok', label: 'Found' },
              { key: 'f', value: verified.length - real + dismissed, tone: 'muted', label: 'Cleared' },
              { key: 'r', value: Math.max(0, n - verified.length - dismissed), tone: 'pending', label: 'To check' },
            ]}
          />
          <p className="meta" style={{ marginTop: 4 }}>
            {verified.length ? (
              <>
                <span className="mono">{confirmed}</span> confirmed phantoms
              </>
            ) : (
              'Verify a row to check it against ground truth'
            )}
          </p>
        </section>
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
        {aisle !== null && (
          <button type="button" className="filter-chip" onClick={() => setAisle(null)}>
            Aisle <span className="mono">{aisle}</span> <span aria-hidden="true">×</span>
            <span className="sr-only">clear aisle filter</span>
          </button>
        )}
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
        <EmptyState>No matching flags in today's list.</EmptyState>
      ) : (
        <Table
          label="Morning check list"
          className="roomy"
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
