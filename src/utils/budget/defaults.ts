/**
 * Default budget allocation percentages.
 *
 * Pay-yourself-first framing: `SAVINGS_ID` is a first-class slot that lives
 * alongside the six spending parent categories. All seven percentages must
 * sum to ≤ 100 (100 = fully allocated, < 100 = extra implicit savings on
 * top of the explicit savings row). Historical periods keep whatever %s
 * they were snapshotted with — edits to these defaults only affect the
 * NEXT salary event.
 *
 * PARENT_CATEGORY_IDS is duplicated (not imported from categories.ts) so
 * this module stays free of unrelated type-check baggage in ts-jest. Keep
 * in sync with the PARENT_CATEGORIES id list in
 * src/utils/constants/categories.ts.
 */

export type ParentCategoryId =
  | "essentials"
  | "lifestyle"
  | "home_living"
  | "personal_care"
  | "work_education"
  | "financial_other";

export const PARENT_CATEGORY_IDS: readonly ParentCategoryId[] = [
  "essentials",
  "lifestyle",
  "home_living",
  "personal_care",
  "work_education",
  "financial_other",
];

/**
 * Reserved allocation slot for pay-yourself-first savings. Not a spending
 * parent-category — never appears in dashboard aggregations. Stored in the
 * same budget_allocations table with parent_category_id = "savings".
 */
export const SAVINGS_ID = "savings" as const;
export type SavingsId = typeof SAVINGS_ID;

/** Default savings rate (nudges the user toward at least *some* savings). */
export const DEFAULT_SAVINGS_PCT = 10;

/**
 * Default per-parent-category spending percentages. Chosen so that
 * savings (10) + sum(spending) = 100 exactly.
 */
export const DEFAULT_ALLOCATIONS: Record<ParentCategoryId, number> = {
  essentials: 50,
  lifestyle: 22,
  home_living: 9,
  personal_care: 4,
  work_education: 3,
  financial_other: 2,
};

/**
 * Per-category cadence for budget display:
 *   `per_period` — budget/spent scoped to the active pay period
 *   `monthly`    — budget summed across the calendar month; spend accumulated
 *                  across the whole month. Use for lumpy monthly bills that
 *                  don't respect pay-period boundaries (rent, mortgage,
 *                  utilities, car loan, insurance).
 */
export type Cadence = "per_period" | "monthly";

/**
 * Default cadence per parent category. Essentials + Home & Living carry the
 * big lumpy monthly bills so they default to monthly; discretionary
 * categories stay on per-period so pay-yourself-first per paycheck still
 * feels tangible.
 */
export const DEFAULT_CADENCE: Record<ParentCategoryId, Cadence> = {
  essentials: "monthly",
  lifestyle: "per_period",
  home_living: "monthly",
  personal_care: "per_period",
  work_education: "per_period",
  financial_other: "per_period",
};

/**
 * End-of-cycle behavior for a category budget.
 *   `reset`    — unused budget closes out at cycle end; the remainder
 *                becomes "extra available to save" (never silently
 *                increases the next cycle's budget). Overspend is
 *                reported but does not carry as a debt.
 *   `rollover` — unused budget carries forward as carry_in on the next
 *                budget_periods row. Negative balances (overspend) also
 *                carry as negative carry_in so a next-cycle boundary
 *                cannot silently forgive overspending.
 *
 * Independent from `Cadence` — every category is one of four
 * combinations: monthly|reset, monthly|rollover, per_period|reset,
 * per_period|rollover.
 */
export type EndBehavior = "reset" | "rollover";

/**
 * Default end-behavior per parent category. All spending parents default
 * to `reset` — the safest choice for existing users during rollout, and
 * matches the design-doc migration rule "all existing categories retain
 * RESET behavior unless the user explicitly opts in".
 *
 * The `savings` slot is always `reset` in application code regardless of
 * what's stored — savings is set aside at open, not settled at close, so
 * it has no carry_out to roll.
 */
export const DEFAULT_END_BEHAVIOR: Record<ParentCategoryId, EndBehavior> = {
  essentials: "reset",
  lifestyle: "reset",
  home_living: "reset",
  personal_care: "reset",
  work_education: "reset",
  financial_other: "reset",
};
