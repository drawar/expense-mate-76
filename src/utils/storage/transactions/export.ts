
import { Transaction } from '@/types';
import { CurrencyService } from '@/core/currency';
import { formatDate } from '@/utils/dates/formatters';

export async function exportTransactionsToCSV(transactions: Transaction[]): Promise<string> {
  console.log('Exporting transactions to CSV...');
  
  const headers = [
    'Date',
    'Merchant Name',
    'Amount',
    'Currency',
    'Payment Method',
    'Payment Amount',
    'Payment Currency',
    'Reward Points',
    'Base Points',
    'Bonus Points',
    'Notes',
    'Is Online',
    'Is Contactless',
    'Reimbursement Amount'
  ];

  const csvRows = [headers.join(',')];

  transactions.forEach(transaction => {
    const row = [
      formatDate(transaction.date),
      `"${transaction.merchant.name}"`,
      transaction.amount.toString(),
      transaction.currency,
      `"${transaction.paymentMethod.name}"`,
      transaction.paymentAmount.toString(),
      transaction.paymentCurrency,
      transaction.rewardPoints.toString(),
      transaction.basePoints?.toString() || '0',
      transaction.bonusPoints?.toString() || '0',
      `"${transaction.notes || ''}"`,
      transaction.merchant.isOnline ? 'Yes' : 'No',
      transaction.isContactless ? 'Yes' : 'No',
      transaction.reimbursementAmount?.toString() || '0'
    ];
    csvRows.push(row.join(','));
  });

  const csvContent = csvRows.join('\n');
  console.log('CSV export completed');
  return csvContent;
}
