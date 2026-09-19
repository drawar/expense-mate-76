-- Add end-of-cycle settlement fields to budget_periods so a closed
-- period freezes its `carry_out`, `closed_out`, `overspend`, and the
-- exact cadence + end_behavior it settled under. Historical periods
-- become immutable — flipping a setting today never rewrites what an
-- already-settled Sept period computed.
--
-- Everything is JSONB {parent_category_id → dollars}. Sibling columns
-- (rather than nested keys under existing `allocations`) so the current
-- single-slot allocations snapshot stays untouched and existing readers
-- keep working — new consumers opt in per column.
--
-- Columns:
--   closed_at              — null = open, non-null = settled; drives
--                            immutability guards everywhere
--   carry_in               — {parent: dollars} inherited from the prior
--                            settled period's carry_out (rollover cats
--                            only). Zero for reset cats.
--   carry_out              — {parent: dollars} computed at settlement;
--                            can be negative for rollover cats that
--                            overspent. Empty {} for a period not yet
--                            settled.
--   closed_out             — {parent: dollars} unused budget on reset
--                            cats at close; feeds the "extra available
--                            to save" UI. Rollover cats stay 0 here.
--   overspend              — {parent: dollars} negative closing balance
--                            per parent; informational for both reset
--                            and rollover. For rollover the same amount
--                            also lives negatively in carry_out.
--   settled_spent          — {parent: dollars} the spend the settlement
--                            was computed against; freezes the "as-of"
--                            number so recomputes are diffable.
--   cadence_snapshot       — {parent: 'per_period'|'monthly'} snapshot
--                            at settle time. Historical UI reads this
--                            (never live budget_allocations) so a
--                            settled period keeps its framing.
--   end_behavior_snapshot  — {parent: 'reset'|'rollover'} same idea;
--                            next-period carry-in reads this to decide
--                            which keys to inherit.
--   settlement_fingerprint — sha256 hex of the settlement input tuple;
--                            guarded UPDATE writes only when this
--                            differs → idempotent re-settle.
--
-- Partial index accelerates the "load prior settled period" lookup that
-- every next-period-open path runs (loadPreviousSettledCarry).

ALTER TABLE public.budget_periods
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS carry_in JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS carry_out JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS closed_out JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS overspend JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS settled_spent JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cadence_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS end_behavior_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS settlement_fingerprint TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_budget_periods_prev_settled
  ON public.budget_periods (user_id, currency, period_end DESC)
  WHERE closed_at IS NOT NULL;
