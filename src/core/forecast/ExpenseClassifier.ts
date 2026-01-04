// src/core/forecast/ExpenseClassifier.ts
import { Transaction } from "@/types";
import { ExpenseClassification, FixedExpense } from "./types";
import {
  FIXED_EXPENSE_PATTERNS,
  FIXED_EXPENSE_MCC_CODES,
  FIXED_EXPENSE_THRESHOLDS,
} from "./constants";

/**
 * Classifies transactions into fixed (recurring) and variable expenses
 * based on merchant patterns, timing consistency, and amount consistency.
 */
export class ExpenseClassifier {
  /**
   * Classify transactions into fixed and variable expenses
   */
  classify(transactions: Transaction[]): ExpenseClassification {
    if (transactions.length === 0) {
      return {
        fixed: [],
        variable: [],
        fixedTotal: 0,
        variableAverage: 0,
      };
    }

    // Group transactions by merchant
    const merchantGroups = this.groupByMerchant(transactions);

    const fixed: FixedExpense[] = [];
    const variableTxs: Transaction[] = [];

    merchantGroups.forEach((txs, merchantName) => {
      const fixedExpense = this.analyzeForFixedExpense(txs, merchantName);
      if (fixedExpense) {
        fixed.push(fixedExpense);
      } else {
        variableTxs.push(...txs);
      }
    });

    // Calculate totals
    const fixedTotal = fixed.reduce((sum, f) => sum + f.expectedAmount, 0);
    const variableTotal = variableTxs.reduce(
      (sum, t) => sum + this.getAmount(t),
      0
    );

    // Calculate monthly variable average (assuming transactions span multiple months)
    const dateRange = this.getDateRange(variableTxs);
    const monthsSpan = Math.max(1, dateRange.months);
    const variableAverage = variableTotal / monthsSpan;

    return {
      fixed,
      variable: variableTxs,
      fixedTotal,
      variableAverage,
    };
  }

  /**
   * Group transactions by merchant name (case-insensitive)
   */
  private groupByMerchant(
    transactions: Transaction[]
  ): Map<string, Transaction[]> {
    const groups = new Map<string, Transaction[]>();

    transactions.forEach((tx) => {
      const key = tx.merchant.name.toLowerCase().trim();
      const existing = groups.get(key) || [];
      existing.push(tx);
      groups.set(key, existing);
    });

    return groups;
  }

  /**
   * Analyze a group of transactions to determine if they represent a fixed expense
   */
  private analyzeForFixedExpense(
    transactions: Transaction[],
    merchantName: string
  ): FixedExpense | null {
    // Check minimum occurrences
    if (transactions.length < FIXED_EXPENSE_THRESHOLDS.MIN_OCCURRENCES) {
      // But check if it matches known fixed patterns
      if (
        this.isKnownFixedExpensePattern(merchantName, transactions[0]?.mccCode)
      ) {
        return this.createFixedExpenseFromSingleOccurrence(
          transactions[0],
          merchantName
        );
      }
      return null;
    }

    // Calculate amount statistics
    const amounts = transactions.map((t) => this.getAmount(t));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = this.calculateStdDev(amounts);
    const coefficientOfVariation = avgAmount > 0 ? stdDev / avgAmount : 1;

    // Check amount consistency
    const amountConsistent =
      coefficientOfVariation <=
      FIXED_EXPENSE_THRESHOLDS.AMOUNT_VARIANCE_THRESHOLD;

    // Calculate timing statistics
    const daysOfMonth = transactions.map((t) => new Date(t.date).getDate());
    const avgDay = daysOfMonth.reduce((a, b) => a + b, 0) / daysOfMonth.length;
    const dayVariance = Math.max(
      ...daysOfMonth.map((d) => Math.abs(d - avgDay))
    );
    const timingConsistent =
      dayVariance <= FIXED_EXPENSE_THRESHOLDS.DAY_TOLERANCE;

    // Check for known patterns
    const isKnownPattern = this.isKnownFixedExpensePattern(
      merchantName,
      transactions[0]?.mccCode
    );

    // Calculate confidence score
    let confidence = 0;
    if (amountConsistent) confidence += 0.35;
    if (timingConsistent) confidence += 0.35;
    if (isKnownPattern) confidence += 0.3;

    // Additional confidence boost for more occurrences
    if (transactions.length >= 3) confidence = Math.min(1, confidence + 0.1);
    if (transactions.length >= 6) confidence = Math.min(1, confidence + 0.1);

    // Must meet minimum confidence
    if (confidence < FIXED_EXPENSE_THRESHOLDS.MIN_CONFIDENCE) {
      // If not confident, but is a known pattern, still include with lower confidence
      if (isKnownPattern && confidence >= 0.3) {
        // Include known patterns even with lower confidence
      } else {
        return null;
      }
    }

    // Get the most recent occurrence
    const sortedByDate = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const mostRecent = sortedByDate[0];

    return {
      merchantName: this.normalizemerchantName(merchantName),
      expectedAmount: avgAmount,
      expectedDay: Math.round(avgDay),
      category: mostRecent.userCategory || mostRecent.category || "Other",
      confidence,
      lastOccurrence: mostRecent.date,
      occurrenceCount: transactions.length,
    };
  }

  /**
   * Create a fixed expense entry from a single occurrence of a known pattern
   */
  private createFixedExpenseFromSingleOccurrence(
    tx: Transaction,
    merchantName: string
  ): FixedExpense | null {
    if (!tx) return null;

    return {
      merchantName: this.normalizemerchantName(merchantName),
      expectedAmount: this.getAmount(tx),
      expectedDay: new Date(tx.date).getDate(),
      category: tx.userCategory || tx.category || "Other",
      confidence: 0.5, // Lower confidence for single occurrence
      lastOccurrence: tx.date,
      occurrenceCount: 1,
    };
  }

  /**
   * Check if merchant name or MCC matches known fixed expense patterns
   */
  private isKnownFixedExpensePattern(
    merchantName: string,
    mccCode?: string
  ): boolean {
    const lowerName = merchantName.toLowerCase();

    // Check merchant name patterns
    const matchesNamePattern = FIXED_EXPENSE_PATTERNS.some((pattern) =>
      lowerName.includes(pattern.toLowerCase())
    );

    if (matchesNamePattern) return true;

    // Check MCC code
    if (mccCode && FIXED_EXPENSE_MCC_CODES.includes(mccCode)) {
      return true;
    }

    return false;
  }

  /**
   * Get the effective amount for a transaction (accounting for reimbursements)
   */
  private getAmount(tx: Transaction): number {
    const base = tx.paymentAmount || tx.amount;
    const reimbursement = tx.reimbursementAmount || 0;
    return base - reimbursement;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map((v) => Math.pow(v - mean, 2));
    const avgSquareDiff =
      squareDiffs.reduce((a, b) => a + b, 0) / values.length;

    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Normalize merchant name for display
   */
  private normalizemerchantName(name: string): string {
    // Capitalize first letter of each word
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Get the date range of transactions in months
   */
  private getDateRange(transactions: Transaction[]): {
    months: number;
    days: number;
  } {
    if (transactions.length === 0) return { months: 0, days: 0 };

    const dates = transactions.map((t) => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const diffMs = maxDate - minDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const diffMonths = diffDays / 30;

    return { months: diffMonths, days: diffDays };
  }
}

// Export singleton instance
export const expenseClassifier = new ExpenseClassifier();
