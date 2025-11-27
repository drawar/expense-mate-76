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
   *
   * Note: This currently uses an in-memory cache. In a production implementation,
   * you would query a database table that tracks bonus points usage per rule per period.
   * For now, this relies on trackBonusPointsUsage being called after each transaction.
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

    // Return cached value or 0
    return this.usageCache.get(cacheKey) || 0;
  }

  /**
   * Track bonus points usage for a transaction
   * This should be called after a transaction is created
   */
  public async trackBonusPointsUsage(
    ruleId: string,
    paymentMethodId: string,
    bonusPoints: number,
    periodType: SpendingPeriodType = "calendar",
    date: Date = new Date(),
    statementDay: number = 1
  ): Promise<void> {
    const cacheKey = this.createCacheKey(
      ruleId,
      paymentMethodId,
      periodType,
      date,
      statementDay
    );

    // Update cache
    const currentUsage = this.usageCache.get(cacheKey) || 0;
    this.usageCache.set(cacheKey, currentUsage + bonusPoints);
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
