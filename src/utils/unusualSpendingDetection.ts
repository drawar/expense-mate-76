// src/utils/unusualSpendingDetection.ts
import { Transaction } from '@/types';

export interface SpendingAnomaly {
  merchantName: string;
  reason: string;
  amount: number;
  severity: 'low' | 'medium' | 'high';
  date: string;
  transactionId: string;
}

interface MerchantStats {
  transactions: Transaction[];
  avgAmount: number;
  stdDevAmount: number;
  usualFrequency: number; // transactions per week
  lastPurchaseDate?: Date;
}

/**
 * Analyzes transaction history to detect unusual spending patterns
 * @param transactions Recent transactions to analyze
 * @param historicalTransactions Historical transactions for baseline comparison
 * @param lookbackDays Number of days to look back for unusual frequency
 * @param amountThreshold Standard deviation multiplier for amount anomaly detection
 * @returns Array of detected spending anomalies
 */
export function detectUnusualSpending(
  transactions: Transaction[],
  historicalTransactions: Transaction[],
  lookbackDays = 7,
  amountThreshold = 1.5
): SpendingAnomaly[] {
  // Group historical transactions by merchant to build baseline stats
  const merchantStats = buildMerchantStats(historicalTransactions);
  
  // Define the lookback period
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);
  
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
    const stats = merchantStats.get(merchantName);
    if (!stats || stats.transactions.length < 3) continue; // Need enough history
    
    // 1. Check for amount anomaly
    if (transaction.amount > stats.avgAmount + (stats.stdDevAmount * amountThreshold)) {
      const multiplier = Math.round((transaction.amount / stats.avgAmount) * 10) / 10;
      
      anomalies.push({
        merchantName,
        reason: `Amount ${multiplier}x higher than usual`,
        amount: transaction.amount,
        severity: getSeverity(multiplier),
        date: transaction.date,
        transactionId: transaction.id
      });
    }
    
    // 2. Check for frequency anomaly (after processing all transactions in lookback)
    if (currentCount >= 3) { // At least 3 purchases to be considered unusual frequency
      const usualWeeklyFrequency = stats.usualFrequency;
      const currentWeeklyFrequency = currentCount / (lookbackDays / 7);
      
      if (currentWeeklyFrequency > usualWeeklyFrequency * 2) {
        // Only add if we haven't already flagged this merchant for frequency
        const existingFrequencyAnomaly = anomalies.find(
          a => a.merchantName === merchantName && a.reason.includes('purchase')
        );
        
        if (!existingFrequencyAnomaly) {
          anomalies.push({
            merchantName,
            reason: `${currentCount}${getOrdinalSuffix(currentCount)} purchase this week`,
            amount: transaction.amount,
            severity: 'medium',
            date: transaction.date,
            transactionId: transaction.id
          });
        }
      }
    }
  }
  
  return anomalies;
}

/**
 * Build statistical baseline for each merchant from historical transactions
 */
function buildMerchantStats(
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
    // Need at least 2 transactions to establish a pattern
    if (txs.length < 2) continue;
    
    // Sort by date (oldest first) for time-based analysis
    const sortedTxs = [...txs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calculate average amount
    const amounts = sortedTxs.map(tx => tx.amount);
    const avgAmount = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    
    // Calculate standard deviation
    const squareDiffs = amounts.map(val => Math.pow(val - avgAmount, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    const stdDevAmount = Math.sqrt(avgSquareDiff);
    
    // Calculate usual frequency (transactions per week)
    const firstDate = new Date(sortedTxs[0].date);
    const lastDate = new Date(sortedTxs[sortedTxs.length - 1].date);
    const weeksBetween = (lastDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000);
    // Avoid division by zero or very small values
    const usualFrequency = weeksBetween < 0.5 ? txs.length : txs.length / Math.max(1, weeksBetween);
    
    statsMap.set(merchantName, {
      transactions: sortedTxs,
      avgAmount,
      stdDevAmount,
      usualFrequency,
      lastPurchaseDate: lastDate
    });
  }
  
  return statsMap;
}

/**
 * Determine severity level based on the multiplier
 */
function getSeverity(multiplier: number): 'low' | 'medium' | 'high' {
  if (multiplier >= 3) return 'high';
  if (multiplier >= 2) return 'medium';
  return 'low';
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

/**
 * Hook for unusual spending detection
 */
export function useUnusualSpending(
  transactions: Transaction[]
): {
  anomalies: SpendingAnomaly[];
  alertCount: number;
} {
  // Get all transactions for analysis
  const recentTransactions = transactions.filter(
    tx => new Date(tx.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  
  // Get historical transactions for baseline (excluding most recent)
  const historicalTransactions = transactions.filter(
    tx => new Date(tx.date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  
  // Detect anomalies
  const anomalies = detectUnusualSpending(
    recentTransactions,
    historicalTransactions
  );
  
  // Sort anomalies by severity and date
  const sortedAnomalies = [...anomalies].sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  return {
    anomalies: sortedAnomalies,
    alertCount: sortedAnomalies.length
  };
}
