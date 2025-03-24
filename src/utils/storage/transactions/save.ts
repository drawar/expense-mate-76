
import { Transaction } from '@/types';
import { addTransaction } from './add';

export const saveTransactions = async (transactions: Transaction[]): Promise<void> => {
  // Process transactions in batches to avoid blocking the main thread
  const batchSize = 10;
  const totalBatches = Math.ceil(transactions.length / batchSize);
  
  console.log(`Saving ${transactions.length} transactions in ${totalBatches} batches`);
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize, transactions.length);
    const batch = transactions.slice(start, end);
    
    console.log(`Processing batch ${batchIndex + 1}/${totalBatches}, size: ${batch.length}`);
    
    // Process batch
    await Promise.all(batch.map(transaction => 
      addTransaction({
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
      })
    ));
    
    // Small delay between batches to allow UI to breathe
    if (batchIndex < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('All transactions saved successfully');
};
