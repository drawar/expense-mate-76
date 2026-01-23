// utils/dashboard/insightGenerator.ts
/**
 * Generate actionable insights and recommendations based on spending data
 */

import { CategoryBudget, getLargestOverspendCategory } from "./categoryBudgets";

export interface Insight {
  type:
    | "over_budget"
    | "category_overspend"
    | "trending_up"
    | "on_track"
    | "under_budget";
  title: string;
  description: string;
  recommendation?: string;
}

export interface InsightInput {
  currentSpend: number;
  budget: number;
  projectedSpend: number;
  daysRemaining: number;
  daysElapsed: number;
  percentageChange: number; // vs previous period
  categoryBudgets: CategoryBudget[];
  largestExpenseInProblemCategory?: { merchant: string; amount: number } | null;
  formatCurrency: (amount: number) => string;
}

/**
 * Generate the most relevant actionable insight based on current data
 */
export function generateInsight(input: InsightInput): Insight {
  const {
    currentSpend,
    budget,
    projectedSpend,
    daysRemaining,
    daysElapsed,
    percentageChange,
    categoryBudgets,
    largestExpenseInProblemCategory,
    formatCurrency,
  } = input;

  const overBudgetAmount = currentSpend - budget;
  const isOverBudget = overBudgetAmount > 0;
  const projectedOverBudget = projectedSpend - budget;

  // Priority 1: Currently over budget
  if (isOverBudget) {
    const dailyLimit =
      daysRemaining > 0
        ? Math.max(
            0,
            (budget - currentSpend + projectedOverBudget * 0.5) / daysRemaining
          )
        : 0;

    const largestOverspend = getLargestOverspendCategory(categoryBudgets);
    let driverText = "";

    if (largestOverspend && largestExpenseInProblemCategory) {
      driverText = `Biggest driver: ${largestOverspend.name} (+${formatCurrency(largestOverspend.variance)} over)`;
    } else if (largestOverspend) {
      driverText = `Biggest driver: ${largestOverspend.name} (+${formatCurrency(largestOverspend.variance)} over)`;
    }

    return {
      type: "over_budget",
      title: `You're ${formatCurrency(overBudgetAmount)} over budget.`,
      description: driverText,
      recommendation:
        daysRemaining > 0
          ? `To minimize overspend, limit spending to ${formatCurrency(dailyLimit)}/day for the next ${daysRemaining} days.`
          : undefined,
    };
  }

  // Priority 2: On track but a category is significantly overspent (>50% over proportional)
  const largestOverspend = getLargestOverspendCategory(categoryBudgets);
  if (largestOverspend && largestOverspend.proportionalBudget > 0) {
    const overPercentage =
      (largestOverspend.variance / largestOverspend.proportionalBudget) * 100;

    if (overPercentage > 50) {
      // Use plain language instead of percentages
      let driverText = `${formatCurrency(largestOverspend.variance)} above your typical ${largestOverspend.name} spending.`;

      if (largestExpenseInProblemCategory) {
        driverText = `Largest expense: ${largestExpenseInProblemCategory.merchant} (${formatCurrency(largestExpenseInProblemCategory.amount)})`;
      }

      return {
        type: "category_overspend",
        title: `${largestOverspend.name} is +${formatCurrency(largestOverspend.variance)} over typical.`,
        description: driverText,
        recommendation: `Review if this spending is expected.`,
      };
    }
  }

  // Priority 3: Trending up significantly vs last period
  if (percentageChange > 15) {
    return {
      type: "trending_up",
      title: `Spending trending higher than usual.`,
      description: largestOverspend
        ? `Main increase in ${largestOverspend.name}.`
        : `Review categories to identify the driver.`,
      recommendation:
        projectedSpend > budget
          ? `Projected ${formatCurrency(projectedOverBudget)} over budget by month end.`
          : undefined,
    };
  }

  // Priority 4: Under budget and on track
  const expectedSpend = budget * (daysElapsed / (daysElapsed + daysRemaining));
  const underExpected = expectedSpend - currentSpend;

  if (underExpected > 0 && projectedSpend < budget) {
    const projectedSavings = budget - projectedSpend;

    return {
      type: "under_budget",
      title: `On track to save ${formatCurrency(projectedSavings)} this month.`,
      description: `You're ${formatCurrency(underExpected)} under where you'd typically be at this point.`,
      recommendation: `Keep it up to hit your savings goal.`,
    };
  }

  // Default: On track
  return {
    type: "on_track",
    title: `Spending is on track.`,
    description: `You're within budget with ${daysRemaining} days remaining.`,
    recommendation:
      projectedSpend < budget
        ? `Projected to finish ${formatCurrency(budget - projectedSpend)} under budget.`
        : undefined,
  };
}

/**
 * Calculate projected month-end spending based on current pace
 */
export function calculateProjectedSpend(
  currentSpend: number,
  daysElapsed: number,
  daysInPeriod: number
): number {
  if (daysElapsed <= 0) return currentSpend;
  const dailyRate = currentSpend / daysElapsed;
  return dailyRate * daysInPeriod;
}

/**
 * Calculate required daily spending limit to stay on budget
 */
export function calculateDailyLimit(
  budget: number,
  currentSpend: number,
  daysRemaining: number
): number {
  if (daysRemaining <= 0) return 0;
  const remaining = budget - currentSpend;
  return Math.max(0, remaining / daysRemaining);
}
