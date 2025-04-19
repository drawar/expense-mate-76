// utils/dashboard/unusualSpendingUtils.ts
import { Transaction } from "@/types";
import { safelyParseNumber } from "../errorHandling";

/**
 * Types of anomalies that can be detected
 */
export enum AnomalyType {
  AMOUNT = "amount",
  FREQUENCY = "frequency",
  RECENCY = "recency",
}

/**
 * Severity levels for anomalies
 */
export type Severity = "low" | "medium" | "high";

/**
 * Represents a detected spending anomaly
 */
export interface SpendingAnomaly {
  merchantName: string;
  reason: string;
  amount: number;
  severity: Severity;
  date: string;
  transactionId: string;
  type: AnomalyType;
}

/**
 * Statistical information about a merchant's spending patterns
 */
interface MerchantStats {
  transactions: Transaction[];
  avgAmount: number;
  stdDevAmount: number;
  usualFrequency: number; // transactions per week
  lastPurchaseDate?: Date;
  firstDate?: Date;
  lastDate?: Date;
}

/**
 * Configuration options for anomaly detection
 */
export interface AnomalyDetectionOptions {
  lookbackDays?: number;
  amountThreshold?: number;
  minTransactionsForPattern?: number;
  frequencyMultiplierThreshold?: number;
}

// Default configuration values
const DEFAULT_OPTIONS: AnomalyDetectionOptions = {
  lookbackDays: 7,
  amountThreshold: 1.5,
  minTransactionsForPattern: 3,
  frequencyMultiplierThreshold: 2,
};

/**
 * Core anomaly detection class that encapsulates the detection logic
 */
class AnomalyDetector {
  private merchantStats: Map<string, MerchantStats>;
  private options: Required<AnomalyDetectionOptions>;

  /**
   * Initialize the detector with historical transaction data
   * @param historicalTransactions Historical transactions for baseline comparison
   * @param options Configuration options
   */
  constructor(
    historicalTransactions: Transaction[],
    options: AnomalyDetectionOptions = {}
  ) {
    // Merge provided options with defaults
    this.options = {
      lookbackDays: options.lookbackDays ?? DEFAULT_OPTIONS.lookbackDays!,
      amountThreshold:
        options.amountThreshold ?? DEFAULT_OPTIONS.amountThreshold!,
      minTransactionsForPattern:
        options.minTransactionsForPattern ??
        DEFAULT_OPTIONS.minTransactionsForPattern!,
      frequencyMultiplierThreshold:
        options.frequencyMultiplierThreshold ??
        DEFAULT_OPTIONS.frequencyMultiplierThreshold!,
    };

    // Build statistical baseline
    this.merchantStats = this.buildMerchantStats(historicalTransactions);
  }

  /**
   * Detect anomalies in the provided transactions
   * @param transactions Transactions to analyze
   * @returns Array of detected anomalies
   */
  public detectAnomalies(transactions: Transaction[]): SpendingAnomaly[] {
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - this.options.lookbackDays);

    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const anomalies: SpendingAnomaly[] = [];
    const merchantFrequencyMap = new Map<string, number>();

    // Process each transaction to detect anomalies
    for (const transaction of sortedTransactions) {
      const merchantName = transaction.merchant.name;
      const txDate = new Date(transaction.date);

      // Skip transactions outside lookback period
      if (txDate < lookbackDate) continue;

      // Track frequency of merchant within lookback period
      const currentCount = merchantFrequencyMap.get(merchantName) || 0;
      merchantFrequencyMap.set(merchantName, currentCount + 1);

      // Check if we have baseline stats for this merchant
      const stats = this.merchantStats.get(merchantName);
      if (
        !stats ||
        stats.transactions.length < this.options.minTransactionsForPattern
      )
        continue;

      // Detect amount anomalies
      this.detectAmountAnomaly(transaction, stats, anomalies);
    }

    // After processing all transactions, check for frequency anomalies
    this.detectFrequencyAnomalies(
      merchantFrequencyMap,
      sortedTransactions,
      anomalies
    );

    return anomalies;
  }

  /**
   * Detect amount anomalies for a single transaction
   */
  private detectAmountAnomaly(
    transaction: Transaction,
    stats: MerchantStats,
    anomalies: SpendingAnomaly[]
  ): void {
    const threshold =
      stats.avgAmount + stats.stdDevAmount * this.options.amountThreshold;

    if (transaction.amount > threshold) {
      const multiplier =
        Math.round((transaction.amount / stats.avgAmount) * 10) / 10;

      anomalies.push({
        merchantName: transaction.merchant.name,
        reason: `Amount ${multiplier}x higher than usual`,
        amount: transaction.amount,
        severity: this.getSeverity(multiplier),
        date: transaction.date,
        transactionId: transaction.id,
        type: AnomalyType.AMOUNT,
      });
    }
  }

  /**
   * Detect frequency anomalies across all merchants
   */
  private detectFrequencyAnomalies(
    merchantFrequencyMap: Map<string, number>,
    transactions: Transaction[],
    anomalies: SpendingAnomaly[]
  ): void {
    for (const [merchantName, currentCount] of merchantFrequencyMap.entries()) {
      // Only consider merchants with enough transactions
      if (currentCount < this.options.minTransactionsForPattern) continue;

      const stats = this.merchantStats.get(merchantName);
      if (!stats) continue;

      const usualWeeklyFrequency = stats.usualFrequency;
      const currentWeeklyFrequency =
        currentCount / (this.options.lookbackDays / 7);

      if (
        currentWeeklyFrequency >
        usualWeeklyFrequency * this.options.frequencyMultiplierThreshold
      ) {
        // Find the most recent transaction for this merchant
        const merchantTx = transactions.find(
          (tx) => tx.merchant.name === merchantName
        );
        if (!merchantTx) continue;

        // Only add if we haven't already flagged this merchant for frequency
        const existingFrequencyAnomaly = anomalies.find(
          (a) =>
            a.merchantName === merchantName && a.type === AnomalyType.FREQUENCY
        );

        if (!existingFrequencyAnomaly) {
          anomalies.push({
            merchantName,
            reason: `${currentCount}${getOrdinalSuffix(currentCount)} purchase this week`,
            amount: merchantTx.amount,
            severity: "medium",
            date: merchantTx.date,
            transactionId: merchantTx.id,
            type: AnomalyType.FREQUENCY,
          });
        }
      }
    }
  }

  /**
   * Build statistical baseline for each merchant from historical transactions
   */
  private buildMerchantStats(
    transactions: Transaction[]
  ): Map<string, MerchantStats> {
    const merchantMap = new Map<string, Transaction[]>();

    // Group transactions by merchant
    for (const tx of transactions) {
      const merchantName = tx.merchant.name;
      if (!merchantMap.has(merchantName)) {
        merchantMap.set(merchantName, []);
      }
      merchantMap.get(merchantName)?.push(tx);
    }

    // Calculate statistics for each merchant
    const statsMap = new Map<string, MerchantStats>();

    for (const [merchantName, txs] of merchantMap.entries()) {
      // Need enough transactions to establish a pattern
      if (txs.length < this.options.minTransactionsForPattern - 1) continue;

      // Sort by date (oldest first) for time-based analysis
      const sortedTxs = [...txs].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Calculate statistics
      const stats = this.calculateMerchantStatistics(sortedTxs);
      statsMap.set(merchantName, stats);
    }

    return statsMap;
  }

  /**
   * Calculate statistical metrics for a merchant's transactions
   */
  private calculateMerchantStatistics(
    transactions: Transaction[]
  ): MerchantStats {
    // Calculate average amount
    const amounts = transactions.map((tx) => safelyParseNumber(tx.amount, 0));
    const avgAmount =
      amounts.reduce((sum, val) => sum + val, 0) / amounts.length;

    // Calculate standard deviation
    const squareDiffs = amounts.map((val) => Math.pow(val - avgAmount, 2));
    const avgSquareDiff =
      squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    const stdDevAmount = Math.sqrt(avgSquareDiff);

    // Calculate usual frequency (transactions per week)
    const firstDate = new Date(transactions[0].date);
    const lastDate = new Date(transactions[transactions.length - 1].date);
    const weeksBetween =
      (lastDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000);

    // Avoid division by zero or very small values
    const usualFrequency =
      weeksBetween < 0.5
        ? transactions.length
        : transactions.length / Math.max(1, weeksBetween);

    return {
      transactions,
      avgAmount,
      stdDevAmount,
      usualFrequency,
      lastPurchaseDate: lastDate,
      firstDate,
      lastDate,
    };
  }

  /**
   * Determine severity level based on the multiplier
   */
  private getSeverity(multiplier: number): Severity {
    if (multiplier >= 3) return "high";
    if (multiplier >= 2) return "medium";
    return "low";
  }
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

/**
 * Public API: Analyzes transaction history to detect unusual spending patterns
 * @param transactions Recent transactions to analyze
 * @param historicalTransactions Historical transactions for baseline comparison
 * @param options Configuration options
 * @returns Array of detected spending anomalies
 */
export function detectUnusualSpending(
  transactions: Transaction[],
  historicalTransactions: Transaction[],
  options?: AnomalyDetectionOptions
): SpendingAnomaly[] {
  const detector = new AnomalyDetector(historicalTransactions, options);
  return detector.detectAnomalies(transactions);
}

/**
 * Public API: Analyzes all transactions for unusual spending patterns
 * Automatically separates recent vs historical transactions
 * @param transactions All transactions to analyze
 * @param recentDays Number of days to consider recent (default: 30)
 * @param excludeDays Number of days to exclude from historical baseline (default: 7)
 * @returns Object containing anomalies and count
 */
export function analyzeUnusualSpending(
  transactions: Transaction[],
  recentDays = 30,
  excludeDays = 7,
  options?: AnomalyDetectionOptions
): {
  anomalies: SpendingAnomaly[];
  alertCount: number;
} {
  const recentDate = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
  const excludeDate = new Date(Date.now() - excludeDays * 24 * 60 * 60 * 1000);

  // Get recent transactions for analysis
  const recentTransactions = transactions.filter(
    (tx) => new Date(tx.date) >= recentDate
  );

  // Get historical transactions for baseline (excluding recent transactions)
  const historicalTransactions = transactions.filter(
    (tx) => new Date(tx.date) < excludeDate
  );

  // Detect anomalies
  const anomalies = detectUnusualSpending(
    recentTransactions,
    historicalTransactions,
    options
  );

  // Sort anomalies by severity and date
  const sortedAnomalies = sortAnomaliesByPriority(anomalies);

  return {
    anomalies: sortedAnomalies,
    alertCount: sortedAnomalies.length,
  };
}

/**
 * Sort anomalies by severity (high to low) and then by date (newest first)
 */
export function sortAnomaliesByPriority(
  anomalies: SpendingAnomaly[]
): SpendingAnomaly[] {
  return [...anomalies].sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

// Export a singleton instance with all public functions
export const unusualSpendingUtils = {
  detectUnusualSpending,
  analyzeUnusualSpending,
  sortAnomaliesByPriority,
};
