import { Transaction, Currency } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { getCategoryFromMCC, getCategoryFromMerchantName } from '../categoryMapping';
import { getMerchantByName, addOrUpdateMerchant } from './merchants';
import { getPaymentMethods } from './paymentMethods';
import { calculateBasicPoints } from '../rewards/baseCalculations';

const TRANSACTIONS_KEY = 'expenseTracker_transactions';

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

const saveTransactionsToLocalStorage = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    console.log('Transactions saved to local storage:', transactions.length);
  } catch (error) {
    console.error('Error saving transactions to local storage:', error);
    throw new Error('Failed to save transaction to local storage');
  }
};

const getTransactionsFromLocalStorage = (): Transaction[] => {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    if (!stored) return [];
    
    const transactions = JSON.parse(stored);
    console.log('Successfully loaded transactions from local storage:', transactions.length);
    return transactions;
  } catch (error) {
    console.error('Error loading transactions from local storage:', error);
    return [];
  }
};

export const getTransactions = async (forceLocalStorage = false): Promise<Transaction[]> => {
  if (forceLocalStorage) {
    console.log('Forcing local storage for transactions');
    return getTransactionsFromLocalStorage();
  }
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        merchant:merchant_id(*),
        payment_method:payment_method_id(*)
      `);
      
    if (error) {
      console.error('Error fetching transactions from Supabase:', error);
      console.log('Falling back to local storage for transactions');
      return getTransactionsFromLocalStorage();
    }
    
    const paymentMethods = await getPaymentMethods();
    
    const transformedData = data.map(tx => {
      const merchant = tx.merchant as any;
      const paymentMethod = tx.payment_method as any;
      
      const matchedPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethod.id) || {
        id: paymentMethod.id,
        name: paymentMethod.name,
        type: paymentMethod.type,
        currency: paymentMethod.currency as Currency,
        rewardRules: paymentMethod.reward_rules || [],
        active: paymentMethod.active,
        lastFourDigits: paymentMethod.last_four_digits,
        issuer: paymentMethod.issuer,
        statementStartDay: paymentMethod.statement_start_day,
        isMonthlyStatement: paymentMethod.is_monthly_statement,
        icon: paymentMethod.icon,
        color: paymentMethod.color,
      };
      
      let mcc = undefined;
      if (merchant.mcc) {
        try {
          if (typeof merchant.mcc === 'object') {
            mcc = merchant.mcc;
          }
        } catch (e) {
          console.error('Error parsing MCC:', e);
        }
      }
      
      let coordinates = undefined;
      if (merchant.coordinates) {
        try {
          if (typeof merchant.coordinates === 'object') {
            coordinates = merchant.coordinates as { latitude: number; longitude: number };
          }
        } catch (e) {
          console.error('Error parsing coordinates:', e);
        }
      }
      
      return {
        id: tx.id,
        date: tx.date,
        merchant: {
          id: merchant.id,
          name: merchant.name,
          address: merchant.address,
          mcc,
          coordinates,
          isOnline: merchant.is_online,
        },
        amount: Number(tx.amount),
        currency: tx.currency as Currency,
        paymentMethod: matchedPaymentMethod,
        paymentAmount: Number(tx.payment_amount),
        paymentCurrency: tx.payment_currency as Currency,
        rewardPoints: tx.reward_points,
        notes: tx.notes,
        category: tx.category,
        isContactless: tx.is_contactless,
      };
    });
    
    return transformedData;
  } catch (error) {
    console.error('Exception in getTransactions:', error);
    console.log('Falling back to local storage due to exception');
    return getTransactionsFromLocalStorage();
  }
};

const calculatePoints = (transaction: Omit<Transaction, 'id'>): number => {
  if (transaction.paymentMethod.type === 'cash') {
    return 0;
  }
  
  if (transaction.paymentMethod.type === 'credit_card') {
    const basePoints = Math.round(transaction.amount * 0.4);
    
    if (transaction.paymentMethod.issuer === 'UOB' && transaction.isContactless) {
      return Math.round(basePoints * 1.2);
    }
    
    const isDining = transaction.category === 'Food & Drinks' || 
                    (transaction.merchant.mcc?.code && ['5811', '5812', '5813', '5814'].includes(transaction.merchant.mcc.code));
    
    if (isDining && ['UOB', 'Citibank'].includes(transaction.paymentMethod.issuer || '')) {
      return Math.round(basePoints * 2);
    }
    
    return basePoints;
  }
  
  return 0;
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>, forceLocalStorage = false): Promise<Transaction> => {
  console.log('Adding transaction, force local storage:', forceLocalStorage);
  
  if (!transaction.merchant || !transaction.merchant.name) {
    throw new Error('Merchant information is missing');
  }
  
  if (!transaction.paymentMethod || !transaction.paymentMethod.id) {
    throw new Error('Payment method information is missing');
  }
  
  let category = transaction.category;
  if (!category || category === 'Uncategorized') {
    if (transaction.merchant.mcc?.code) {
      category = getCategoryFromMCC(transaction.merchant.mcc.code);
    } else if (transaction.merchant.name) {
      category = getCategoryFromMerchantName(transaction.merchant.name) || 'Uncategorized';
    }
  }
  
  let rewardPoints = transaction.rewardPoints;
  if (!rewardPoints || rewardPoints <= 0) {
    const transactionWithCategory = {
      ...transaction,
      category,
    };
    rewardPoints = calculatePoints(transactionWithCategory);
  }
  
  if (forceLocalStorage) {
    console.log('Directly using local storage for transaction');
    try {
      const existingMerchant = await getMerchantByName(transaction.merchant.name);
      const merchant = existingMerchant || transaction.merchant;
      
      const transactionWithUpdates = {
        ...transaction,
        category,
        rewardPoints,
        merchant
      };
      
      if (merchant.mcc) {
        try {
          const { incrementMerchantOccurrence } = await import('../storage/merchantTracking');
          await incrementMerchantOccurrence(merchant.name, merchant.mcc);
        } catch (error) {
          console.error('Error updating merchant mapping:', error);
        }
      }
      
      return saveTransactionToLocalStorage(transactionWithUpdates, merchant);
    } catch (error) {
      console.error('Error saving to local storage:', error);
      throw new Error('Failed to save transaction to local storage');
    }
  }
  
  try {
    const savedMerchant = await addOrUpdateMerchant(transaction.merchant);
    console.log('Merchant saved:', savedMerchant);
    
    if (savedMerchant.mcc) {
      try {
        const { incrementMerchantOccurrence } = await import('../storage/merchantTracking');
        await incrementMerchantOccurrence(savedMerchant.name, savedMerchant.mcc);
      } catch (error) {
        console.error('Error updating merchant mapping:', error);
      }
    }
    
    const transactionData = {
      date: transaction.date,
      merchant_id: savedMerchant.id,
      amount: transaction.amount,
      currency: transaction.currency,
      payment_method_id: transaction.paymentMethod.id,
      payment_amount: transaction.paymentAmount,
      payment_currency: transaction.paymentCurrency,
      reward_points: rewardPoints,
      notes: transaction.notes,
      category: category,
      is_contactless: transaction.isContactless,
    };
    
    console.log('Sending to Supabase:', transactionData);
    
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();
      
    if (error) {
      console.error('Error adding transaction to Supabase, using local storage fallback:', error);
      
      const transactionWithUpdates = {
        ...transaction,
        category,
        rewardPoints,
        merchant: savedMerchant
      };
      
      return saveTransactionToLocalStorage(transactionWithUpdates, savedMerchant);
    }
    
    console.log('Transaction saved successfully to Supabase:', data);
    
    return {
      id: data.id,
      date: data.date,
      merchant: savedMerchant,
      amount: Number(data.amount),
      currency: data.currency as Currency,
      paymentMethod: transaction.paymentMethod,
      paymentAmount: Number(data.payment_amount),
      paymentCurrency: data.payment_currency as Currency,
      rewardPoints: data.reward_points,
      notes: data.notes,
      category: data.category,
      isContactless: data.is_contactless,
    };
  } catch (error) {
    console.error('Exception in addTransaction, using local storage fallback:', error);
    
    try {
      const existingMerchant = await getMerchantByName(transaction.merchant.name);
      
      const transactionWithUpdates = {
        ...transaction,
        category,
        rewardPoints,
        merchant: existingMerchant || transaction.merchant
      };
      
      return saveTransactionToLocalStorage(transactionWithUpdates, existingMerchant);
    } catch (innerError) {
      console.error('Error in local storage fallback:', innerError);
      throw new Error('Failed to save transaction');
    }
  }
};

const saveTransactionToLocalStorage = async (
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
        category = getCategoryFromMCC(merchant.mcc.code);
      } else {
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
    
    console.log('Transaction saved to local storage:', newTransaction);
    
    return newTransaction;
  } catch (error) {
    console.error('Error in saveTransactionToLocalStorage:', error);
    throw new Error('Failed to save transaction to local storage');
  }
};

export const editTransaction = async (id: string, updatedTransaction: Omit<Transaction, 'id'>): Promise<Transaction | null> => {
  const existingTransactions = getTransactionsFromLocalStorage();
  const transaction = existingTransactions.find(t => t.id === id);
  
  if (transaction) {
    try {
      const updatedTransactions = existingTransactions.map(t => {
        if (t.id === id) {
          return {
            id,
            ...updatedTransaction,
          };
        }
        return t;
      });
      
      saveTransactionsToLocalStorage(updatedTransactions);
      
      const updated = updatedTransactions.find(t => t.id === id);
      return updated || null;
    } catch (error) {
      console.error('Error updating transaction in local storage:', error);
      return null;
    }
  }
  
  try {
    const savedMerchant = await addOrUpdateMerchant(updatedTransaction.merchant);
    
    const { data, error } = await supabase
      .from('transactions')
      .update({
        date: updatedTransaction.date,
        merchant_id: savedMerchant.id,
        amount: updatedTransaction.amount,
        currency: updatedTransaction.currency,
        payment_method_id: updatedTransaction.paymentMethod.id,
        payment_amount: updatedTransaction.paymentAmount,
        payment_currency: updatedTransaction.paymentCurrency,
        reward_points: updatedTransaction.rewardPoints,
        notes: updatedTransaction.notes,
        category: updatedTransaction.category || getCategoryFromMCC(updatedTransaction.merchant.mcc?.code),
        is_contactless: updatedTransaction.isContactless,
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating transaction:', error);
      return null;
    }
    
    return {
      id: data.id,
      date: data.date,
      merchant: savedMerchant,
      amount: Number(data.amount),
      currency: data.currency as Currency,
      paymentMethod: updatedTransaction.paymentMethod,
      paymentAmount: Number(data.payment_amount),
      paymentCurrency: data.payment_currency as Currency,
      rewardPoints: data.reward_points,
      notes: data.notes,
      category: data.category,
      isContactless: data.is_contactless,
    };
  } catch (error) {
    console.error('Error in editTransaction:', error);
    return null;
  }
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  let deletedTransactionMerchant = null;
  
  const existingTransactions = getTransactionsFromLocalStorage();
  const transaction = existingTransactions.find(t => t.id === id);
  
  if (transaction) {
    deletedTransactionMerchant = transaction.merchant;
  } else {
    try {
      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          merchant:merchant_id(*)
        `)
        .eq('id', id)
        .maybeSingle();
        
      if (data) {
        deletedTransactionMerchant = data.merchant;
      }
    } catch (error) {
      console.error('Error getting transaction before delete:', error);
    }
  }
  
  if (transaction) {
    try {
      const updatedTransactions = existingTransactions.filter(t => t.id !== id);
      saveTransactionsToLocalStorage(updatedTransactions);
      
      if (deletedTransactionMerchant && deletedTransactionMerchant.mcc) {
        try {
          const { decrementMerchantOccurrence } = await import('../storage/merchantTracking');
          await decrementMerchantOccurrence(deletedTransactionMerchant.name);
        } catch (error) {
          console.error('Error updating merchant mapping after delete:', error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting transaction from local storage:', error);
      return false;
    }
  }
  
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
  
  if (deletedTransactionMerchant && deletedTransactionMerchant.mcc) {
    try {
      const { decrementMerchantOccurrence } = await import('../storage/merchantTracking');
      await decrementMerchantOccurrence(deletedTransactionMerchant.name);
    } catch (error) {
      console.error('Error updating merchant mapping after delete:', error);
    }
  }
  
  return true;
};

export const exportTransactionsToCSV = (transactions: Transaction[]): string => {
  if (transactions.length === 0) {
    return '';
  }
  
  const headers = [
    'ID',
    'Date',
    'Merchant',
    'Category',
    'Amount',
    'Currency',
    'Payment Method',
    'Payment Amount',
    'Payment Currency',
    'Reward Points',
    'Notes',
    'Contactless',
  ].join(',');
  
  const rows = transactions.map(tx => [
    tx.id,
    tx.date,
    tx.merchant.name,
    tx.category || tx.merchant.mcc?.description || 'Uncategorized',
    tx.amount,
    tx.currency,
    tx.paymentMethod.name,
    tx.paymentAmount,
    tx.paymentCurrency,
    tx.rewardPoints,
    tx.notes ? `"${tx.notes.replace(/"/g, '""')}"` : '',
    tx.isContactless ? 'Yes' : 'No',
  ].join(','));
  
  return [headers, ...rows].join('\n');
};
