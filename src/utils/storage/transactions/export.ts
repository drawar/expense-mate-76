
import { Transaction } from '@/types';

/**
 * Exports transactions to CSV format
 * @param transactions Array of transactions to export
 * @returns Promise that resolves to a CSV string
 */
export async function exportTransactionsToCSV(transactions: Transaction[]): Promise<string> {
  // Implementation of exporting transactions to CSV
  // For a basic implementation, let's return a CSV string with headers and data
  
  // Create headers
  const headers = [
    'Date',
    'Merchant',
    'Amount',
    'Currency',
    'Payment Method',
    'Category',
    'Points'
  ].join(',');
  
  // Create rows
  const rows = transactions.map(transaction => {
    return [
      transaction.date,
      `"${transaction.merchant.name.replace(/"/g, '""')}"`, // Escape quotes in merchant name
      transaction.amount,
      transaction.currency,
      `"${transaction.paymentMethod.name.replace(/"/g, '""')}"`,
      transaction.category || 'Uncategorized',
      transaction.rewardPoints || 0
    ].join(',');
  });
  
  // Combine headers and rows
  return [headers, ...rows].join('\n');
}
