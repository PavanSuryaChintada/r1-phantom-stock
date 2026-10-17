# Phantom stock-out detector

A morning worklist for store managers: **which twenty shelves should I check today?**

A phantom stock-out is a shelf that is empty while the system says it is not. Nothing reorders, because the books
show stock; the only trace is that sales stop. This app ranks every SKU-store by the rupees a check would recover,
not by how confident the model is, and groups the checks into aisle walks a manager can carry.

> Prototype · simulated dataset. No retailer data was used.

## The one-click argument

On the Checks screen, switch **Rank by** from `₹ recovered` to `Confidence`. In Store 14 the list reshuffles: old,
cheap phantoms climb to the top and **₹29,859 of value drops out of the top 20**. Ranking by money is the product.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/
```

No backend, no API calls, no network at runtime. Fonts are bundled. State resets on refresh by design, so a demo
can be re-run cleanly.

## Screens

| Route | What it shows |
|---|---|
| `/` | Morning check list: 20 ranked checks, issue filters, ranking toggle, SKU drawer with sales vs stock chart and score breakdown |
| `/walks` | The same checks grouped into aisle walks, printable |
| `/method` | The four-step method, the formula, a worked example, fixed 7-day rule vs per-SKU probability |
| `/impact` | Annual rupees recovered, every input on a slider, diminishing returns at 5 / 10 / 20 / 40 checks |

## Method

```
expected_rate  = base × weekday × season × promo
p_zero_run     = P(k zero-sale days in a row | NegBin(expected_rate))
p_phantom      = prior / (prior + (1 − prior) × p_zero_run)
days_lost      = expected days until it would surface otherwise   (cap 30)
expected_value = p_phantom × expected_rate × unit_margin × days_lost
```

- `base` is estimated per SKU-store from 90 days of uncensored history before the current silence.
- `prior` is each store's share of SKU-days spent as a phantom over the last year, from cycle-count findings.
- `days_lost` runs to the aisle's next cycle count, shortened by the chance a shopper or picker reports the gap.
- Misplaced stock is a separate test: two-week sales far below expectation while stock still moves.
- A store with fewer than 20 confident flags gets a shorter list rather than padded noise.

Measured against injected ground truth across 25 stores: **precision@20 of 66%**, against 4% for a fixed
"7 days without a sale" rule that fires 3,434 alerts.

## Data

`tools/generate.py` simulates 18 months of daily sales and system stock for 25 stores × 800 SKUs (negative binomial
demand, weekday, festive-season and promo multipliers, reorder-point replenishment), injects phantoms, misplaced and
delisted items, scores the morning list and writes static JSON to `src/data/`. The app imports that JSON directly and
never runs the script.

```bash
python tools/generate.py   # needs numpy and scipy
```

**Real:** the demand model, the probability calculation, the expected-value ranking, the aisle grouping, and the
precision@20 figure measured against injected ground truth.
**Simulated:** the sales and inventory history, generated to the brief's stated shape.
**Precomputed:** scoring runs offline; the app replays committed results.

## Stack

Vite · React 18 · TypeScript · react-router-dom · plain CSS with custom properties · hand-written SVG charts ·
IBM Plex Sans and Mono.
