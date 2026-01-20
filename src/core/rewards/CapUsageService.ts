/**
 * CapUsageService
 *
 * Computes cap usage on-demand from transactions.
 * Single source of truth - no separate tracking table needed.
 *
 * This replaces the BonusPointsTracker which maintained a separate
 * bonus_points_tracking table that could get out of sync.
 */

import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { RewardRule, SpendingPeriodType } from "./types";
import { PaymentMethod, Transaction } from "@/types";
import { getStatementPeriod } from "@/utils/dates/formatters";

export interface CapUsageResult {
  /** Unique identifier - ruleId or capGroupId for shared caps */
  identifier: string;
  /** Display name for the cap */
  ruleName: string;
  /** Current usage in the period */
  used: number;
  /** Cap limit */
  cap: number;
  /** What is being tracked: bonus points or spend amount */
  capType: "bonus_points" | "spend_amount";
  /** Period type determining reset behavior */
  periodType: SpendingPeriodType;
  /** Start of current period */
  periodStart: Date;
  /** End of current period */
  periodEnd: Date;
  /** For promotional periods, when the promotion ends */
  validUntil?: Date;
  /** Percentage used (0-100) */
  percentage: number;
}

/**
 * Get period boundaries based on period type
 */
function getPeriodBoundaries(
  periodType: SpendingPeriodType,
  paymentMethod: PaymentMethod,
  referenceDate: Date,
  rule?: RewardRule
): { start: Date; end: Date } | null {
  switch (periodType) {
    case "calendar_month": {
      // Calendar month: 1st to last day of month
      return {
        start: startOfMonth(referenceDate),
        end: endOfMonth(referenceDate),
      };
    }

    case "statement":
    case "statement_month": {
      // Statement month: use getStatementPeriod from formatters
      return getStatementPeriod(paymentMethod, referenceDate);
    }

    case "promotional_period": {
      // Promotional period: validFrom to validUntil
      if (!rule?.validFrom || !rule?.validUntil) {
        return null;
      }
      return {
        start: rule.validFrom,
        end: rule.validUntil,
      };
    }

    default:
      return null;
  }
}

/**
 * Check if a promotional period has expired
 */
function isPromotionalPeriodExpired(
  rule: RewardRule,
  referenceDate: Date
): boolean {
  if (rule.reward.capDuration !== "promotional_period") {
    return false;
  }
  if (!rule.validUntil) {
    return false;
  }
  return referenceDate > rule.validUntil;
}

/**
 * Calculate cap usage from transactions
 */
export function calculateCapUsage(
  transactions: Transaction[],
  rules: RewardRule[],
  paymentMethod: PaymentMethod,
  referenceDate: Date = new Date()
): CapUsageResult[] {
  const results: CapUsageResult[] = [];
  const processedIdentifiers = new Set<string>();

  // Filter to only rules with non-null capDuration and monthlyCap
  const cappedRules = rules.filter(
    (r) => r.reward.capDuration != null && r.reward.monthlyCap != null
  );

  for (const rule of cappedRules) {
    // Use capGroupId if present, otherwise ruleId
    const identifier = rule.reward.capGroupId || rule.id;

    // Skip if we already processed this cap group
    if (processedIdentifiers.has(identifier)) continue;
    processedIdentifiers.add(identifier);

    // Skip expired promotional periods
    if (isPromotionalPeriodExpired(rule, referenceDate)) {
      continue;
    }

    const periodType = rule.reward.capDuration!;
    const capType = rule.reward.monthlyCapType || "bonus_points";
    const cap = rule.reward.monthlyCap!;

    // Get period boundaries
    const period = getPeriodBoundaries(
      periodType,
      paymentMethod,
      referenceDate,
      rule
    );

    if (!period) continue;

    // Find all rules in this cap group (for shared caps)
    const groupRules = rule.reward.capGroupId
      ? cappedRules.filter(
          (r) => r.reward.capGroupId === rule.reward.capGroupId
        )
      : [rule];

    // Get display name
    let ruleName = rule.name;
    if (groupRules.length > 1) {
      const isPromo = periodType === "promotional_period";
      ruleName = isPromo
        ? "Promotional Bonus Cap"
        : `${groupRules.length} Rules Shared Cap`;
    }

    // Filter transactions in the period
    const periodTransactions = transactions.filter((tx) => {
      const txDate = parseISO(tx.date);
      return isWithinInterval(txDate, { start: period.start, end: period.end });
    });

    // Calculate usage based on cap type
    let used: number;
    if (capType === "spend_amount") {
      // Sum transaction amounts (use paymentAmount, fallback to amount)
      used = periodTransactions.reduce(
        (sum, tx) => sum + (tx.paymentAmount || tx.amount),
        0
      );
    } else {
      // Sum bonus points
      used = periodTransactions.reduce(
        (sum, tx) => sum + (tx.bonusPoints || 0),
        0
      );
    }

    const percentage = Math.min(100, (used / cap) * 100);

    results.push({
      identifier,
      ruleName,
      used,
      cap,
      capType,
      periodType,
      periodStart: period.start,
      periodEnd: period.end,
      validUntil: rule.validUntil,
      percentage,
    });
  }

  return results;
}

/**
 * Singleton service instance
 */
class CapUsageServiceClass {
  /**
   * Get cap usage for a payment method
   *
   * @param transactions - All transactions for the payment method
   * @param rules - Reward rules for the payment method's card type
   * @param paymentMethod - The payment method (needed for statement period calculation)
   * @param referenceDate - Date to calculate period for (defaults to now)
   */
  getCapUsage(
    transactions: Transaction[],
    rules: RewardRule[],
    paymentMethod: PaymentMethod,
    referenceDate: Date = new Date()
  ): CapUsageResult[] {
    return calculateCapUsage(transactions, rules, paymentMethod, referenceDate);
  }
}

export const capUsageService = new CapUsageServiceClass();
export default capUsageService;
