/**
 * BonusPointsTracker
 *
 * Service for tracking bonus points used per rule per month to enforce monthly caps.
 * This ensures that rules with monthly bonus caps don't exceed their limits.
 */

import { supabase } from "@/integrations/supabase/client";
import { SpendingPeriodType } from "./types";

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
   * Get used bonus points for a rule in the current period
   * Queries the database for actual usage
   */
  public async getUsedBonusPoints(
    ruleId: string,
    paymentMethodId: string,
    periodType: SpendingPeriodType = "calendar",
    date: Date = new Date(),
    statementDay: number = 1
  ): Promise<number> {
    const cacheKey = this.createCacheKey(
      ruleId,
      paymentMethodId,
      periodType,
      date,
      statementDay
    );

    // Check cache first
    const cached = this.usageCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // Query database
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // No user logged in, return 0
        return 0;
      }

      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const { data, error } = await (supabase as any)
        .from("bonus_points_tracking")
        .select("used_bonus_points")
        .eq("user_id", session.user.id)
        .eq("rule_id", ruleId)
        .eq("payment_method_id", paymentMethodId)
        .eq("period_type", periodType)
        .eq("period_year", year)
        .eq("period_month", month)
        .eq("statement_day", statementDay)
        .maybeSingle();

      if (error) {
        console.error("Error fetching bonus points usage:", error);
        return 0;
      }

      const usedPoints = (data as any)?.used_bonus_points || 0;
      
      // Cache the result
      this.usageCache.set(cacheKey, usedPoints);
      
      return usedPoints;
    } catch (error) {
      console.error("Error in getUsedBonusPoints:", error);
      return 0;
    }
  }

  /**
   * Track bonus points usage for a transaction
   * This should be called after a transaction is created
   * Persists to database and updates cache
   */
  public async trackBonusPointsUsage(
    ruleId: string,
    paymentMethodId: string,
    bonusPoints: number,
    periodType: SpendingPeriodType = "calendar",
    date: Date = new Date(),
    statementDay: number = 1
  ): Promise<void> {
    if (bonusPoints <= 0) {
      return; // Nothing to track
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.warn("Cannot track bonus points: user not authenticated");
        return;
      }

      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      // Get current usage
      const currentUsage = await this.getUsedBonusPoints(
        ruleId,
        paymentMethodId,
        periodType,
        date,
        statementDay
      );

      const newUsage = currentUsage + bonusPoints;

      // Upsert to database
      const { error } = await (supabase as any)
        .from("bonus_points_tracking")
        .upsert({
          user_id: session.user.id,
          rule_id: ruleId,
          payment_method_id: paymentMethodId,
          period_type: periodType,
          period_year: year,
          period_month: month,
          statement_day: statementDay,
          used_bonus_points: newUsage,
        }, {
          onConflict: "user_id,rule_id,payment_method_id,period_type,period_year,period_month,statement_day"
        });

      if (error) {
        console.error("Error tracking bonus points usage:", error);
        return;
      }

      // Update cache
      const cacheKey = this.createCacheKey(
        ruleId,
        paymentMethodId,
        periodType,
        date,
        statementDay
      );
      this.usageCache.set(cacheKey, newUsage);

      console.log(`✅ Tracked ${bonusPoints} bonus points for rule ${ruleId}. Total: ${newUsage}`);
    } catch (error) {
      console.error("Error in trackBonusPointsUsage:", error);
    }
  }

  /**
   * Calculate remaining bonus points available under the cap
   */
  public async getRemainingBonusPoints(
    ruleId: string,
    paymentMethodId: string,
    monthlyCap: number,
    periodType: SpendingPeriodType = "calendar",
    date: Date = new Date(),
    statementDay: number = 1
  ): Promise<number> {
    const usedPoints = await this.getUsedBonusPoints(
      ruleId,
      paymentMethodId,
      periodType,
      date,
      statementDay
    );

    return Math.max(0, monthlyCap - usedPoints);
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
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${ruleId}-${paymentMethodId}-${periodType}-${year}-${month}-${statementDay}`;
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
}

// Export a singleton instance
export const bonusPointsTracker = BonusPointsTracker.getInstance();
