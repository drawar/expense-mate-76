
import { Transaction } from '@/types';

const TRANSACTIONS_KEY = 'expenseTracker_transactions';

export const saveTransactionsToLocalStorage = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    console.log('Transactions saved to local storage:', transactions.length);
    
    // Invalidate cache when saving transactions
    cachedTransactions = transactions;
    lastCacheTime = Date.now();
  } catch (error) {
    console.error('Error saving transactions to local storage:', error);
    throw new Error('Failed to save transaction to local storage');
  }
};

// Cache the transactions to avoid multiple JSON.parse operations
let cachedTransactions: Transaction[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 5000; // 5 seconds cache lifetime

export const getTransactionsFromLocalStorage = (): Transaction[] => {
  try {
    const now = Date.now();
    
    // Use cached transactions if available and not expired
    if (cachedTransactions && (now - lastCacheTime) < CACHE_TTL) {
      console.log('Using cached transactions from memory:', cachedTransactions.length);
      return cachedTransactions;
    }
    
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    if (!stored) return [];
    
    const transactions = JSON.parse(stored);
    console.log('Successfully loaded transactions from local storage:', transactions.length);
    
    // Update cache
    cachedTransactions = transactions;
    lastCacheTime = now;
    
    return transactions;
  } catch (error) {
    console.error('Error loading transactions from local storage:', error);
    return [];
  }
};

// Clear the cache when a new transaction is saved
export const saveTransactionToLocalStorage = async (
  transaction: Omit<Transaction, 'id'>, 
  savedMerchant?: any
): Promise<Transaction> => {
  try {
    const id = crypto.randomUUID();
    
    let merchant;
    if (!savedMerchant) {
      const existingMerchants = JSON.parse(localStorage.getItem('expenseTracker_merchants') || '[]');
      merchant = existingMerchants.find((m: any) => 
        m.name.toLowerCase() === transaction.merchant.name.toLowerCase()
      );
      
      if (!merchant) {
        merchant = {
          ...transaction.merchant,
          id: crypto.randomUUID(),
        };
        
        existingMerchants.push(merchant);
        localStorage.setItem('expenseTracker_merchants', JSON.stringify(existingMerchants));
        console.log('New merchant saved to local storage:', merchant);
      } else {
        console.log('Using existing merchant from local storage:', merchant);
      }
    } else {
      merchant = savedMerchant;
    }
    
    let category = transaction.category;
    if (!category || category === 'Uncategorized') {
      if (merchant.mcc?.code) {
        const { getCategoryFromMCC } = await import('../../categoryMapping');
        category = getCategoryFromMCC(merchant.mcc.code);
      } else {
        const { getCategoryFromMerchantName } = await import('../../categoryMapping');
        category = getCategoryFromMerchantName(merchant.name) || 'Uncategorized';
      }
    }
    
    let rewardPoints = transaction.rewardPoints;
    if (!rewardPoints || rewardPoints <= 0) {
      if (transaction.paymentMethod.type === 'credit_card') {
        rewardPoints = Math.round(transaction.amount * 0.4);
        
        if (transaction.paymentMethod.issuer === 'UOB' && transaction.isContactless) {
          rewardPoints = Math.round(rewardPoints * 1.2);
        }
        
        const isDining = category === 'Food & Drinks' || 
                      (merchant.mcc?.code && ['5811', '5812', '5813', '5814'].includes(merchant.mcc.code));
        
        if (isDining && ['UOB', 'Citibank'].includes(transaction.paymentMethod.issuer || '')) {
          rewardPoints = Math.round(rewardPoints * 2);
        }
      } else {
        rewardPoints = 0;
      }
    }
    
    const newTransaction: Transaction = {
      id,
      date: transaction.date,
      merchant,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      paymentMethod: transaction.paymentMethod,
      paymentAmount: Number(transaction.paymentAmount || transaction.amount),
      paymentCurrency: transaction.paymentCurrency || transaction.currency,
      rewardPoints,
      notes: transaction.notes || '',
      category,
      isContactless: transaction.isContactless || false,
    };
    
    const transactions = getTransactionsFromLocalStorage();
    transactions.push(newTransaction);
    saveTransactionsToLocalStorage(transactions);
    
    // Invalidate cache
    cachedTransactions = null;
    
    console.log('Transaction saved to local storage:', newTransaction);
    
    return newTransaction;
  } catch (error) {
    console.error('Error in saveTransactionToLocalStorage:', error);
    throw new Error('Failed to save transaction to local storage');
  }
};
