
import { Transaction } from '@/types';

export type TimeframeTab = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

/**
 * Filter transactions based on the selected timeframe
 */
export function filterTransactionsByTimeframe(
  transactions: Transaction[],
  timeframe: TimeframeTab,
  useStatementMonth: boolean = false,
  statementCycleDay: number = 1
): Transaction[] {
  if (!transactions.length) return [];
  if (timeframe === 'all') return [...transactions];

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Get the start date based on timeframe
  let startDate: Date;
  
  if (useStatementMonth && timeframe === 'month') {
    // Handle statement month logic
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    if (currentDay >= statementCycleDay) {
      // Current statement month starts from statementCycleDay of current month
      startDate = new Date(currentYear, currentMonth, statementCycleDay);
    } else {
      // Current statement month starts from statementCycleDay of previous month
      startDate = new Date(currentYear, currentMonth - 1, statementCycleDay);
    }
  } else {
    // Standard timeframe calculations
    switch (timeframe) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
        startDate = new Date(today.setDate(diff));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterMonth, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // Beginning of time
    }
  }
  
  // Filter transactions based on date
  return transactions.filter(transaction => {
    const txDate = new Date(transaction.date);
    return txDate >= startDate;
  });
}
