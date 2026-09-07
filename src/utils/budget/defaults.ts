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
