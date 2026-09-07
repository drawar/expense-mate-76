/**
 * Default budget allocation percentages per parent category.
 *
 * Values are midpoints of the advisory PARENT_CATEGORIES[i].budgetPercentage
 * strings in src/utils/constants/categories.ts. Categories marked "varies" get
 * a small fixed default so the six values sum to 100. A user with no
 * budget_allocations rows falls through to these defaults; only edited rows
 * are persisted.
 *
 * PARENT_CATEGORY_IDS is duplicated (not imported from categories.ts) so this
 * module stays free of unrelated type-check baggage in ts-jest. Keep in sync
 * with the PARENT_CATEGORIES id list in src/utils/constants/categories.ts.
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

export const DEFAULT_ALLOCATIONS: Record<ParentCategoryId, number> = {
  essentials: 55,
  lifestyle: 25,
  home_living: 10,
  personal_care: 5,
  work_education: 3,
  financial_other: 2,
};
