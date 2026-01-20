// services/rewards/MonthlySpendingTracker.ts

import { PaymentMethod, Transaction } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { SpendingPeriodType } from "./types";

/**
 * Cache entry with value and timestamp for TTL support
 */
interface CacheEntry {
  value: number;
  timestamp: number;
}

/**
 * Service for tracking monthly spending for reward rules
 */
export class MonthlySpendingTracker {
  private static instance: MonthlySpendingTracker;
  private spendingCache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  /**
   * Check if a cache entry is still valid
   */
  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.CACHE_TTL;
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MonthlySpendingTracker {
    if (!MonthlySpendingTracker.instance) {
      MonthlySpendingTracker.instance = new MonthlySpendingTracker();
    }
    return MonthlySpendingTracker.instance;
  }

  /**
   * Get total monthly spending for a payment method
   */
  public async getMonthlySpending(
    paymentMethodId: string,
    periodType: SpendingPeriodType = "calendar_month",
    date: Date = new Date(),
    statementDay: number = 1
  ): Promise<number> {
    // Create a cache key
    const cacheKey = this.createCacheKey(
      paymentMethodId,
      periodType,
      date,
      statementDay
    );

    // Check cache first (with TTL validation)
    const cached = this.spendingCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached.value;
    }

    try {
      // Calculate date range
      const { startDate, endDate } = this.calculateDateRange(
        date,
        periodType,
        statementDay
      );

      // Query database for transactions in this period
      const { data, error } = await supabase
        .from("transactions")
        .select("amount")
        .eq("payment_method_id", paymentMethodId)
        .gte("date", startDate.toISOString())
        .lt("date", endDate.toISOString())
        .eq("is_deleted", false);

      if (error) {
        console.error("Error fetching monthly spending:", error);
        return 0;
      }

      // Calculate total
      const totalSpending = data.reduce((sum, tx) => sum + (tx.amount || 0), 0);

      // Cache the result with timestamp
      this.spendingCache.set(cacheKey, {
        value: totalSpending,
        timestamp: Date.now(),
      });

      return totalSpending;
    } catch (error) {
      console.error("Error calculating monthly spending:", error);
      return 0;
    }
  }

  /**
   * Calculate monthly spending from an array of transactions
   * Useful when we don't have direct database access
   */
  public calculateMonthlySpendingFromTransactions(
    transactions: Transaction[],
    paymentMethodId: string,
    periodType: SpendingPeriodType = "calendar_month",
    date: Date = new Date(),
    statementDay: number = 1
  ): number {
    try {
      // Calculate date range
      const { startDate, endDate } = this.calculateDateRange(
        date,
        periodType,
        statementDay
      );

      // Filter transactions by date range and payment method
      const relevantTransactions = transactions.filter((tx) => {
        const txDate = new Date(tx.date);
        return (
          tx.paymentMethod.id === paymentMethodId &&
          txDate >= startDate &&
          txDate < endDate
        );
      });

      // Calculate total
      return relevantTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    } catch (error) {
      console.error(
        "Error calculating monthly spending from transactions:",
        error
      );
      return 0;
    }
  }

  /**
   * Update monthly spending when a new transaction is added
   */
  public updateMonthlySpending(transaction: Transaction): void {
    // Clear all cache entries for this payment method
    // This is a simple approach - in a real implementation, you might
    // want to be more selective about which cache entries to invalidate
    this.clearCacheForPaymentMethod(transaction.paymentMethod.id);
  }

  /**
   * Clear cache for a payment method
   */
  public clearCacheForPaymentMethod(paymentMethodId: string): void {
    const keysToDelete: string[] = [];

    // Find all cache keys for this payment method
    for (const key of this.spendingCache.keys()) {
      if (key.startsWith(`${paymentMethodId}-`)) {
        keysToDelete.push(key);
      }
    }

    // Delete from cache
    keysToDelete.forEach((key) => this.spendingCache.delete(key));
  }

  /**
   * Clear all cache
   */
  public clearCache(): void {
    this.spendingCache.clear();
  }

  /**
   * Create a cache key
   */
  private createCacheKey(
    paymentMethodId: string,
    periodType: SpendingPeriodType,
    date: Date,
    statementDay: number
  ): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${paymentMethodId}-${periodType}-${year}-${month}-${statementDay}`;
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

    if (periodType === "calendar_month") {
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
export const monthlySpendingTracker = MonthlySpendingTracker.getInstance();
