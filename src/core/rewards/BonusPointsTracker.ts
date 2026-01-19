/**
 * BonusPointsTracker
 *
 * Service for tracking bonus points or spend amounts per rule per month to enforce monthly caps.
 * This ensures that rules with monthly caps don't exceed their limits.
 *
 * Supports two cap types:
 * - "bonus_points": Tracks accumulated bonus points (default)
 * - "spend_amount": Tracks accumulated spend amounts
 */

import { supabase } from "@/integrations/supabase/client";
import { SpendingPeriodType, RewardRule } from "./types";
import { getStatementPeriodYearMonth } from "@/utils/dates/formatters";

/** What type of value is being capped */
export type CapType = "bonus_points" | "spend_amount";

interface BonusPointsUsage {
  ruleId: string;
  paymentMethodId: string;
  periodKey: string;
  usedPoints: number;
}

export class BonusPointsTracker {
  private static instance: BonusPointsTracker;
  private usageCache: Map<string, number> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): BonusPointsTracker {
    if (!BonusPointsTracker.instance) {
      BonusPointsTracker.instance = new BonusPointsTracker();
    }
    return BonusPointsTracker.instance;
  }

  /**
   * Get used value (bonus points or spend amount) for a rule in the current period
   * Queries the database for actual usage
   * If capGroupId is provided, tracks against the shared cap group instead of individual rule
   * @param capType - "bonus_points" (default) or "spend_amount"
   * @param promoStartDate - For promotional periods, the date when cap tracking starts
   */
  public async getUsedBonusPoints(
    ruleId: string,
    paymentMethodId: string,
    periodType: SpendingPeriodType = "calendar",
    date: Date = new Date(),
    statementDay: number = 1,
    capGroupId?: string,
    capType: CapType = "bonus_points",
    promoStartDate?: Date
  ): Promise<number> {
    // Use capGroupId if provided, otherwise use ruleId
    // Include capType in tracking ID to separate bonus points from spend amounts
    const baseTrackingId = capGroupId || ruleId;
    const trackingId =
      capType === "spend_amount" ? `${baseTrackingId}:spend` : baseTrackingId;

    // For promotional periods, use the promo start date for period identification
    // This ensures all transactions in the promo period accumulate to the same record
    const periodDate =
      periodType === "promotional" && promoStartDate ? promoStartDate : date;

    const cacheKey = this.createCacheKey(
      trackingId,
      paymentMethodId,
      periodType,
      periodDate,
      statementDay
    );

    // Check cache first
    const cached = this.usageCache.get(cacheKey);
    if (cached !== undefined) {
      console.log("🔶 BonusPointsTracker cache HIT:", { cacheKey, cached });
      return cached;
    }
    console.log("🔶 BonusPointsTracker cache MISS:", { cacheKey });

    // Query database
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        // No user logged in, return 0
        console.log("🔴 BonusPointsTracker: No session, returning 0");
        return 0;
      }

      // Calculate which period the date belongs to
      // For statement_month, this accounts for dates before statementDay belonging to previous month
      const { year, month } = this.getPeriodYearMonth(
        periodDate,
        periodType,
        statementDay
      );

      console.log("🔵 BonusPointsTracker query:", {
        userId: session.user.id,
        trackingId,
        paymentMethodId,
        periodType,
        year,
        month,
        statementDay,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("bonus_points_tracking")
        .select("used_bonus_points")
        .eq("user_id", session.user.id)
        .eq("rule_id", trackingId)
        .eq("payment_method_id", paymentMethodId)
        .eq("period_type", periodType)
        .eq("period_year", year)
        .eq("period_month", month)
        .eq("statement_day", statementDay)
        .maybeSingle();

      if (error) {
        console.error("🔴 BonusPointsTracker error:", error);
        return 0;
      }

      const usedPoints =
        (data as { used_bonus_points?: number } | null)?.used_bonus_points || 0;

      console.log("🟢 BonusPointsTracker result:", { data, usedPoints });

      // Cache the result
      this.usageCache.set(cacheKey, usedPoints);

      return usedPoints;
    } catch (error) {
      console.error("Error in getUsedBonusPoints:", error);
      return 0;
    }
  }

  /**
   * Track usage (bonus points or spend amount) for a transaction
   * This should be called after a transaction is created
   * Persists to database and updates cache
   * If capGroupId is provided, tracks against the shared cap group instead of individual rule
   * @param capType - "bonus_points" (default) or "spend_amount"
   * @param promoStartDate - For promotional periods, the date when cap tracking starts
   */
  public async trackBonusPointsUsage(
    ruleId: string,
    paymentMethodId: string,
    value: number,
    periodType: SpendingPeriodType = "calendar",
    date: Date = new Date(),
    statementDay: number = 1,
    capGroupId?: string,
    capType: CapType = "bonus_points",
    promoStartDate?: Date
  ): Promise<void> {
    if (value <= 0) {
      return; // Nothing to track
    }

    // Use capGroupId if provided, otherwise use ruleId
    // Include capType in tracking ID to separate bonus points from spend amounts
    const baseTrackingId = capGroupId || ruleId;
    const trackingId =
      capType === "spend_amount" ? `${baseTrackingId}:spend` : baseTrackingId;

    // For promotional periods, use the promo start date for period identification
    const periodDate =
      periodType === "promotional" && promoStartDate ? promoStartDate : date;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        console.warn("Cannot track bonus points: user not authenticated");
        return;
      }

      // Calculate which period the date belongs to
      const { year, month } = this.getPeriodYearMonth(
        periodDate,
        periodType,
        statementDay
      );

      // Get current usage
      const currentUsage = await this.getUsedBonusPoints(
        ruleId,
        paymentMethodId,
        periodType,
        date,
        statementDay,
        capGroupId,
        capType,
        promoStartDate
      );

      const newUsage = currentUsage + value;

      // Upsert to database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("bonus_points_tracking")
        .upsert(
          {
            user_id: session.user.id,
            rule_id: trackingId,
            payment_method_id: paymentMethodId,
            period_type: periodType,
            period_year: year,
            period_month: month,
            statement_day: statementDay,
            used_bonus_points: newUsage,
          },
          {
            onConflict:
              "user_id,rule_id,payment_method_id,period_type,period_year,period_month,statement_day",
          }
        );

      if (error) {
        console.error("Error tracking bonus points usage:", error);
        return;
      }

      // Update cache
      const cacheKey = this.createCacheKey(
        trackingId,
        paymentMethodId,
        periodType,
        periodDate,
        statementDay
      );
      this.usageCache.set(cacheKey, newUsage);

      const valueType = capType === "spend_amount" ? "spend" : "bonus points";
      console.log(
        `✅ Tracked ${value} ${valueType} for ${capGroupId ? `cap group ${capGroupId}` : `rule ${ruleId}`}. Total: ${newUsage}`
      );
    } catch (error) {
      console.error("Error in trackBonusPointsUsage:", error);
    }
  }

  /**
   * Decrement usage (bonus points or spend amount) when a transaction is deleted
   * This is the reverse of trackBonusPointsUsage
   * @param capType - "bonus_points" (default) or "spend_amount"
   * @param promoStartDate - For promotional periods, the date when cap tracking starts
   */
  public async decrementBonusPointsUsage(
    ruleId: string,
    paymentMethodId: string,
    value: number,
    periodType: SpendingPeriodType = "calendar",
    date: Date = new Date(),
    statementDay: number = 1,
    capGroupId?: string,
    capType: CapType = "bonus_points",
    promoStartDate?: Date
  ): Promise<void> {
    if (value <= 0) {
      return; // Nothing to decrement
    }

    // Use capGroupId if provided, otherwise use ruleId
    const baseTrackingId = capGroupId || ruleId;
    const trackingId =
      capType === "spend_amount" ? `${baseTrackingId}:spend` : baseTrackingId;

    // For promotional periods, use the promo start date for period identification
    const periodDate =
      periodType === "promotional" && promoStartDate ? promoStartDate : date;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        console.warn("Cannot decrement bonus points: user not authenticated");
        return;
      }

      // Calculate which period the date belongs to
      const { year, month } = this.getPeriodYearMonth(
        periodDate,
        periodType,
        statementDay
      );

      // Get current usage
      const currentUsage = await this.getUsedBonusPoints(
        ruleId,
        paymentMethodId,
        periodType,
        date,
        statementDay,
        capGroupId,
        capType,
        promoStartDate
      );

      const newUsage = Math.max(0, currentUsage - value);

      // Update database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("bonus_points_tracking")
        .upsert(
          {
            user_id: session.user.id,
            rule_id: trackingId,
            payment_method_id: paymentMethodId,
            period_type: periodType,
            period_year: year,
            period_month: month,
            statement_day: statementDay,
            used_bonus_points: newUsage,
          },
          {
            onConflict:
              "user_id,rule_id,payment_method_id,period_type,period_year,period_month,statement_day",
          }
        );

      if (error) {
        console.error("Error decrementing bonus points usage:", error);
        return;
      }

      // Update cache
      const cacheKey = this.createCacheKey(
        trackingId,
        paymentMethodId,
        periodType,
        periodDate,
        statementDay
      );
      this.usageCache.set(cacheKey, newUsage);

      const valueType = capType === "spend_amount" ? "spend" : "bonus points";
      console.log(
        `✅ Decremented ${value} ${valueType} for ${capGroupId ? `cap group ${capGroupId}` : `rule ${ruleId}`}. New total: ${newUsage}`
      );
    } catch (error) {
      console.error("Error in decrementBonusPointsUsage:", error);
    }
  }

  /**
   * Calculate remaining value (bonus points or spend amount) available under the cap
   * If capGroupId is provided, calculates based on the shared cap group
   * @param capType - "bonus_points" (default) or "spend_amount"
   * @param promoStartDate - For promotional periods, the date when cap tracking starts
   */
  public async getRemainingBonusPoints(
    ruleId: string,
    paymentMethodId: string,
    monthlyCap: number,
    periodType: SpendingPeriodType = "calendar",
    date: Date = new Date(),
    statementDay: number = 1,
    capGroupId?: string,
    capType: CapType = "bonus_points",
    promoStartDate?: Date
  ): Promise<number> {
    const usedValue = await this.getUsedBonusPoints(
      ruleId,
      paymentMethodId,
      periodType,
      date,
      statementDay,
      capGroupId,
      capType,
      promoStartDate
    );

    return Math.max(0, monthlyCap - usedValue);
  }

  /**
   * Get cap usage for multiple rules at once (for progress bar display)
   * Groups rules by capGroupId to avoid duplicate queries for shared caps
   * Returns a map of identifier (ruleId or capGroupId) to usage
   */
  public async getCapUsageForRules(
    rules: RewardRule[],
    paymentMethodId: string,
    statementDay: number = 1
  ): Promise<
    Map<
      string,
      {
        used: number;
        cap: number;
        capType: "bonus_points" | "spend_amount";
        periodType: SpendingPeriodType;
        validUntil?: Date;
      }
    >
  > {
    const result = new Map<
      string,
      {
        used: number;
        cap: number;
        capType: "bonus_points" | "spend_amount";
        periodType: SpendingPeriodType;
        validUntil?: Date;
      }
    >();
    const processedCapGroups = new Set<string>();

    console.log("🔵 getCapUsageForRules called with", rules.length, "rules");

    for (const rule of rules) {
      // Skip rules without caps
      if (!rule.reward.monthlyCap) continue;

      const capGroupId = rule.reward.capGroupId;
      const capType = rule.reward.monthlyCapType || "bonus_points";
      const periodType = rule.reward.monthlySpendPeriodType || "calendar";
      // For promotional periods, use validFrom as the period start date
      const promoStartDate =
        periodType === "promotional" ? rule.validFrom : undefined;

      console.log("🔵 Processing rule:", {
        id: rule.id,
        name: rule.name,
        capGroupId,
        capType,
        periodType,
        promoStartDate: promoStartDate?.toISOString(),
        monthlyCap: rule.reward.monthlyCap,
      });

      // For shared caps, only query once per capGroupId
      const identifier = capGroupId || rule.id;
      if (processedCapGroups.has(identifier)) continue;
      processedCapGroups.add(identifier);

      // For calendar and promotional periods, always use statementDay=1 since:
      // - Calendar caps reset on the 1st of each month regardless of statement cycle
      // - Promotional caps track from promo start to promo end
      // Only statement_month period type should use the actual statementDay.
      const effectiveStatementDay =
        periodType === "calendar" || periodType === "promotional"
          ? 1
          : statementDay;

      const used = await this.getUsedBonusPoints(
        rule.id,
        paymentMethodId,
        periodType,
        new Date(),
        effectiveStatementDay,
        capGroupId,
        capType,
        promoStartDate
      );

      result.set(identifier, {
        used,
        cap: rule.reward.monthlyCap,
        capType,
        periodType,
        validUntil: rule.validUntil,
      });
    }

    return result;
  }

  /**
   * Clear cache for a payment method
   */
  public clearCacheForPaymentMethod(paymentMethodId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.usageCache.keys()) {
      if (key.includes(`-${paymentMethodId}-`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.usageCache.delete(key));
  }

  /**
   * Clear cache for a specific rule
   */
  public clearCacheForRule(ruleId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.usageCache.keys()) {
      if (key.startsWith(`${ruleId}-`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.usageCache.delete(key));
  }

  /**
   * Clear all cache
   */
  public clearCache(): void {
    this.usageCache.clear();
  }

  /**
   * Create a cache key
   */
  private createCacheKey(
    ruleId: string,
    paymentMethodId: string,
    periodType: SpendingPeriodType,
    date: Date,
    statementDay: number
  ): string {
    const { year, month } = this.getPeriodYearMonth(
      date,
      periodType,
      statementDay
    );
    return `${ruleId}-${paymentMethodId}-${periodType}-${year}-${month}-${statementDay}`;
  }

  /**
   * Calculate which period (year/month) a date belongs to based on period type
   * For statement_month: if date < statementDay, it belongs to the previous month's period
   */
  private getPeriodYearMonth(
    date: Date,
    periodType: SpendingPeriodType,
    statementDay: number
  ): { year: number; month: number } {
    // For calendar and promotional periods, use the date's actual year/month
    if (periodType === "calendar" || periodType === "promotional") {
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };
    }

    // For statement_month, use the shared utility function
    return getStatementPeriodYearMonth(date, statementDay);
  }

  /**
   * Calculate date range for a period
   */
  private calculateDateRange(
    date: Date,
    periodType: SpendingPeriodType,
    statementDay: number
  ): { startDate: Date; endDate: Date } {
    const year = date.getFullYear();
    const month = date.getMonth();

    if (periodType === "calendar") {
      // Calendar month: 1st day of month to last day of month
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 1);

      return { startDate, endDate };
    } else {
      // Statement month: statementDay of month to statementDay of next month
      let startMonth = month;
      let startYear = year;

      // If the current date is before statement day, use previous month's statement day
      if (date.getDate() < statementDay) {
        startMonth = month - 1;
        if (startMonth < 0) {
          startMonth = 11; // December
          startYear = year - 1;
        }
      }

      const startDate = new Date(startYear, startMonth, statementDay);

      // End date is the next statement day
      let endMonth = startMonth + 1;
      let endYear = startYear;
      if (endMonth > 11) {
        endMonth = 0; // January
        endYear += 1;
      }

      const endDate = new Date(endYear, endMonth, statementDay);

      return { startDate, endDate };
    }
  }

  /**
   * Recalculate and fix tracking for a payment method from transaction data.
   * This is useful when tracking data has become out of sync with actual transactions.
   *
   * @param paymentMethodId - The payment method ID
   * @param rules - The reward rules for this payment method
   * @param statementDay - The statement start day (1-31)
   * @param transactionBonusPoints - Total bonus points from transactions in the current period
   * @param transactionSpendAmount - Optional: Total eligible spend from transactions (for spend_amount caps)
   */
  public async recalculateTracking(
    paymentMethodId: string,
    rules: RewardRule[],
    statementDay: number,
    transactionBonusPoints: number,
    transactionSpendAmount?: number
  ): Promise<void> {
    console.log(
      "🔄 Recalculating tracking for payment method:",
      paymentMethodId
    );

    const processedCapGroups = new Set<string>();

    for (const rule of rules) {
      if (!rule.reward.monthlyCap) continue;

      const capGroupId = rule.reward.capGroupId;
      const capType = rule.reward.monthlyCapType || "bonus_points";
      const periodType = rule.reward.monthlySpendPeriodType || "calendar";
      const promoStartDate =
        periodType === "promotional" ? rule.validFrom : undefined;

      // For shared caps, only update once per capGroupId
      const identifier = capGroupId || rule.id;
      if (processedCapGroups.has(identifier)) continue;
      processedCapGroups.add(identifier);

      // Determine the value to set
      const valueToSet =
        capType === "spend_amount"
          ? (transactionSpendAmount ?? 0)
          : transactionBonusPoints;

      // Use capGroupId if provided, otherwise use ruleId
      const baseTrackingId = capGroupId || rule.id;
      const trackingId =
        capType === "spend_amount" ? `${baseTrackingId}:spend` : baseTrackingId;

      // For calendar and promotional periods, always use statementDay=1
      const effectiveStatementDay =
        periodType === "calendar" || periodType === "promotional"
          ? 1
          : statementDay;

      // For promotional periods, use the promo start date for period identification
      const periodDate =
        periodType === "promotional" && promoStartDate
          ? promoStartDate
          : new Date();

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          console.warn("Cannot recalculate tracking: user not authenticated");
          return;
        }

        // Calculate which period the date belongs to
        const { year, month } = this.getPeriodYearMonth(
          periodDate,
          periodType,
          effectiveStatementDay
        );

        console.log("🔄 Updating tracking:", {
          trackingId,
          paymentMethodId,
          periodType,
          year,
          month,
          effectiveStatementDay,
          valueToSet,
        });

        // Upsert to database
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("bonus_points_tracking")
          .upsert(
            {
              user_id: session.user.id,
              rule_id: trackingId,
              payment_method_id: paymentMethodId,
              period_type: periodType,
              period_year: year,
              period_month: month,
              statement_day: effectiveStatementDay,
              used_bonus_points: valueToSet,
            },
            {
              onConflict:
                "user_id,rule_id,payment_method_id,period_type,period_year,period_month,statement_day",
            }
          );

        if (error) {
          console.error("Error recalculating tracking:", error);
          continue;
        }

        // Update cache
        const cacheKey = this.createCacheKey(
          trackingId,
          paymentMethodId,
          periodType,
          periodDate,
          effectiveStatementDay
        );
        this.usageCache.set(cacheKey, valueToSet);

        console.log(
          `✅ Recalculated tracking for ${capGroupId ? `cap group ${capGroupId}` : `rule ${rule.id}`}. Set to: ${valueToSet}`
        );
      } catch (error) {
        console.error("Error in recalculateTracking:", error);
      }
    }
  }
}

// Export a singleton instance
export const bonusPointsTracker = BonusPointsTracker.getInstance();
