# Budget Rollover & End-of-Cycle Settlement

## What it does

Every parent category in your budget carries **two independent knobs**:

| Knob             | Values                   | Meaning                                                                                    |
| ---------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| **Cadence**      | `Monthly` / `Per Period` | Which window the budget renews on. Monthly = calendar month; Per Period = your pay period. |
| **End behavior** | `Rollover` / `Reset`     | What happens to leftover budget when the cycle ends.                                       |

The four combinations:

- **Monthly + Reset** — Groceries every month; leftover closes out.
- **Monthly + Rollover** — Car maintenance accumulates until used.
- **Per Period + Reset** — Dining envelope; unused allowance expires each
  paycheck.
- **Per Period + Rollover** — Travel accrues per paycheck.

Both toggles live in **Settings → Budget Allocations** and take effect on your
next salary event (settled periods stay frozen at the values they were computed
with).

## Settlement — what "closing a cycle" means

When a period's `period_end` passes, the app **settles** it: every category's
`remaining = base + carry_in − spent` is computed, then one of two things
happens per category:

- **Reset** → `remaining > 0` becomes **closed_out** ("extra available to
  save"); `remaining < 0` becomes **overspend** (informational only — no debt
  carried).
- **Rollover** → `remaining` becomes `carry_out` (positive = surplus carries;
  negative = overspend follows you into the next cycle).

The next period's `carry_in` seeds from the prior settled period's `carry_out`,
but **only for rollover categories** — reset categories always open at their
base.

### Money conservation

For every parent category, this identity holds:

```
base + carry_in = spent + closed_out + carry_out − overspend
```

Reset categories zero `carry_out`; rollover categories zero `overspend`. Both
branches balance the identity, and settling twice with the same input always
produces the same output (idempotency guaranteed by the `settlement_fingerprint`
column).

## When settlement fires

Two paths, both idempotent (races resolve via the fingerprint-guarded UPDATE):

1. **Nightly cron** at 00:15 UTC —
   `supabase/functions/settle-due-budget-periods` scans every user, settles
   anything due. Fires whether or not you opened the app.
2. **Lazy client trigger** — first Dashboard mount per session runs the same
   pipeline against your due periods, so if the cron hasn't caught up yet (or
   you're offline for a while), the settlement happens the moment you open the
   app.

**Historical corrections**: editing a transaction or income row that falls
inside a closed period fires a debounced (100ms) forward walker. It re-runs the
pure settlement for every closed period from that date forward, stopping the
first time a period comes back with an identical fingerprint (chain is
guaranteed stable downstream).

## Cadence × settlement window

Per-period categories always settle against the pay-period window. Monthly
categories settle against the **full calendar month**, but only on the
**month-closing period** (the last pay-period whose `period_end` falls in that
calendar month). Mid-month pay-periods pass through monthly categories with zero
spend/close-out — the month owner picks up everything.

## Savings

The savings slot is always `reset` behavior in application code, regardless of
what's stored. Savings is set aside **at open**, not settled at close — there is
no "unused savings budget to sweep" and no "overspent savings" concept.
`carry_out['savings']`, `closed_out['savings']`, and `overspend['savings']` are
always 0.

## UI surfaces

- **Settings → Budget Allocations** — Monthly toggle + Rollover toggle per
  parent.
- **Dashboard → Budget & Spending** — each row shows a small `+$30 rolled` or
  `−$15 rolled` caption when carry_in ≠ 0. Progress bar denominator uses
  `available = base + carry_in`, not `base`.
- **Dashboard → Last period settled tile** — visible for 7 days after
  settlement. Shows rolled forward, extra available to save, and over budget
  (rollover deficits + reset overspend).
- **Dashboard → Savings tile** — extra green line
  `+$X extra available to save from last period` when RESET-category
  leftover > 0. Never uses the word "saved".

## Copy discipline

Enforced in code review:

- **"Rolled forward"** — carry_out on rollover cats.
- **"Extra available to save"** — closed_out on reset cats. **Never "saved"**.
- **"You've saved"** / **"You saved"** — reserved for actual savings-slot
  behavior.
- **"$X over budget"** — text label. Progress bar visually caps at 100% and
  switches to destructive color.

## Manual E2E test

1. In **Settings → Budget Allocations**, set Lifestyle to **22%, Rollover on**.
   Save.
2. In **Income**, add a biweekly Salary starting 2 weeks ago for $2000 CAD.
3. Add a single $200 Dining transaction dated within period 1.
4. Wait for period_end to pass (or reload after a manual date change in
   Supabase). Load the dashboard.
5. **Verify**:
   - The `Last period settled` tile shows `Rolled forward: Lifestyle +$240`.
   - The next period's Lifestyle row shows `+$240.00 rolled` caption; progress
     bar denominator = base + $240.
6. Flip Lifestyle to **Reset** and repeat. Instead of the rolled caption, the
   savings tile should show `+$240.00 extra available to save`.

## What's deferred (intentionally not in MVP)

- Pending / posted transaction lifecycle (the DB has no `is_pending` column
  yet).
- Adjustment event log (PROVISIONAL_CLOSED state). Replaced by
  recompute-on-write walker.
- Per-user timezone. Cron runs at UTC; lazy path uses browser-local. See design
  doc §33 for the trade-off.
- Manual reallocation between categories (transfer surplus from Dining to
  Travel).
- Subcategory-level rollover (would need a new subcategory-budget table).
- Integer-minor-unit money migration (BIGINT cents). Kept NUMERIC dollars with
  `round2` guards at settlement boundaries.
- Notification on settlement (design doc §52).

## Troubleshooting

**"My Rolled Forward is wrong"** — the walker recomputes on transaction save,
but only for closed periods from the edit's date forward. A very old edit may
need a manual re-run. In the Supabase SQL editor:

```sql
UPDATE budget_periods
SET settlement_fingerprint = NULL
WHERE user_id = 'YOUR_UUID' AND period_end >= 'YYYY-MM-DD';
-- then trigger the Edge Function or reload the Dashboard
```

**"Nothing settled overnight"** — check
`SELECT * FROM cron.job WHERE jobname = 'settle-due-budget-periods';`. The
schedule must be added manually once in the SQL editor (pg_cron insert requires
superuser):

```sql
SELECT cron.schedule(
  'settle-due-budget-periods',
  '15 0 * * *',
  'SELECT call_settle_due_budget_periods();'
);
```

**"I flipped Rollover after the period ended and nothing changed"** — expected.
Closed periods keep the `end_behavior` they were settled under. New setting
takes effect from the next period.
