// src/core/analytics/SpendingTracker.ts

import { DateTime } from "luxon";
import { MonthlySpendingRepository } from "./MonthlySpendingRepository";
import { MonthlyTransactionRow } from "@/core/rewards/types";

/**
 * Tracker that computes spending totals from raw transaction rows
 * fetched via MonthlySpendingRepository.
 */
export class SpendingTracker {
  constructor(private readonly repo: MonthlySpendingRepository) {}

  /**
   * Get total spending (amount) within a month for optional filters
   */
  async getMonthlySpendingTotal(
    startDate: DateTime,
    endDate: DateTime,
    filters?: {
      paymentMethodId?: string;
      merchantId?: string;
      category?: string;
    }
  ): Promise<number> {
    const transactions = await this.repo.getMonthlyTransactions(
      startDate,
      endDate,
      filters
    );
    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
  }

  /**
   * Compute breakdown of spending grouped by merchant_id
   */
  async getSpendingByMerchant(
    startDate: DateTime,
    endDate: DateTime,
    filters?: { category?: string }
  ): Promise<Record<string, number>> {
    const transactions = await this.repo.getMonthlyTransactions(
      startDate,
      endDate,
      filters
    );
    return transactions.reduce(
      (acc, tx) => {
        const key = tx.merchant_id;
        acc[key] = (acc[key] || 0) + tx.amount;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Compute breakdown of spending grouped by payment_method_id
   */
  async getSpendingByPaymentMethod(
    startDate: DateTime,
    endDate: DateTime,
    filters?: { merchantId?: string }
  ): Promise<Record<string, number>> {
    const transactions = await this.repo.getMonthlyTransactions(
      startDate,
      endDate,
      filters
    );
    return transactions.reduce(
      (acc, tx) => {
        const key = tx.payment_method_id;
        acc[key] = (acc[key] || 0) + tx.amount;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Compute breakdown of spending grouped by category
   */
  async getSpendingByCategory(
    startDate: DateTime,
    endDate: DateTime,
    filters?: { paymentMethodId?: string }
  ): Promise<Record<string, number>> {
    const transactions = await this.repo.getMonthlyTransactions(
      startDate,
      endDate,
      filters
    );
    return transactions.reduce(
      (acc, tx) => {
        const key = tx.category || "Uncategorized";
        acc[key] = (acc[key] || 0) + tx.amount;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Returns raw transaction rows (with display fields) if needed elsewhere
   */
  async getRawTransactions(
    startDate: DateTime,
    endDate: DateTime,
    filters?: {
      paymentMethodId?: string;
      merchantId?: string;
      category?: string;
    }
  ): Promise<MonthlyTransactionRow[]> {
    return this.repo.getMonthlyTransactions(startDate, endDate, filters);
  }
}
