
import { Transaction } from '@/types';
import { addTransaction } from './add';

export const saveTransactions = async (transactions: Transaction[]): Promise<void> => {
  for (const transaction of transactions) {
    await addTransaction({
      date: transaction.date,
      merchant: transaction.merchant,
      amount: transaction.amount,
      currency: transaction.currency,
      paymentMethod: transaction.paymentMethod,
      paymentAmount: transaction.paymentAmount,
      paymentCurrency: transaction.paymentCurrency,
      rewardPoints: transaction.rewardPoints,
      notes: transaction.notes,
      category: transaction.category,
      isContactless: transaction.isContactless,
    });
  }
};
