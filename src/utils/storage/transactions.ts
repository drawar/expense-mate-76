import { Transaction, Currency } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { getCategoryFromMCC } from '../categoryMapping';
import { getMerchantByName, addOrUpdateMerchant } from './merchants';
import { getPaymentMethods } from './paymentMethods';

// LocalStorage key for fallback
const TRANSACTIONS_KEY = 'expenseTracker_transactions';

// Save transactions to Supabase
export const saveTransactions = async (transactions: Transaction[]): Promise<void> => {
  // This is not very efficient, but it ensures data integrity
  // In a real-world application, you would use batch operations
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

// Helper function to save transactions to local storage
const saveTransactionsToLocalStorage = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    console.log('Transactions saved to local storage:', transactions.length);
  } catch (error) {
    console.error('Error saving transactions to local storage:', error);
    throw new Error('Failed to save transaction to local storage');
  }
};

// Helper function to get transactions from local storage
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

// Get transactions from Supabase with local storage fallback
export const getTransactions = async (forceLocalStorage = false): Promise<Transaction[]> => {
  // If we're forcing local storage, skip Supabase attempt
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
      // Fallback to localStorage
      console.log('Falling back to local storage for transactions');
      return getTransactionsFromLocalStorage();
    }
    
    // Transform payment methods
    const paymentMethods = await getPaymentMethods();
    
    // Transform data to match our Transaction type
    const transformedData = data.map(tx => {
      const merchant = tx.merchant as any;
      const paymentMethod = tx.payment_method as any;
      
      // Find the matching payment method from our local cache
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
      
      // Process MCC
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
      
      // Process coordinates
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
    // Fallback to localStorage on any error
    console.log('Falling back to local storage due to exception');
    return getTransactionsFromLocalStorage();
  }
};

// Add a new transaction with local storage fallback
export const addTransaction = async (transaction: Omit<Transaction, 'id'>, forceLocalStorage = false): Promise<Transaction> => {
  console.log('Adding transaction, force local storage:', forceLocalStorage);
  
  // First ensure the merchant exists
  if (!transaction.merchant || !transaction.merchant.name) {
    throw new Error('Merchant information is missing');
  }
  
  if (!transaction.paymentMethod || !transaction.paymentMethod.id) {
    throw new Error('Payment method information is missing');
  }
  
  // If we're forcing local storage, skip Supabase attempt
  if (forceLocalStorage) {
    console.log('Directly using local storage for transaction');
    try {
      // For local storage, we need to handle merchant lookup ourselves
      // to avoid duplicate merchant entries
      const existingMerchant = await getMerchantByName(transaction.merchant.name);
      const merchant = existingMerchant || transaction.merchant;
      
      return saveTransactionToLocalStorage(transaction, merchant);
    } catch (error) {
      console.error('Error saving to local storage:', error);
      throw new Error('Failed to save transaction to local storage');
    }
  }
  
  try {
    // First, try to save to Supabase
    const savedMerchant = await addOrUpdateMerchant(transaction.merchant);
    console.log('Merchant saved:', savedMerchant);
    
    // Prepare the transaction data for Supabase
    const transactionData = {
      date: transaction.date,
      merchant_id: savedMerchant.id,
      amount: transaction.amount,
      currency: transaction.currency,
      payment_method_id: transaction.paymentMethod.id,
      payment_amount: transaction.paymentAmount,
      payment_currency: transaction.paymentCurrency,
      reward_points: transaction.rewardPoints,
      notes: transaction.notes,
      // Add category based on MCC code or use provided category
      category: transaction.category || getCategoryFromMCC(transaction.merchant.mcc?.code),
      is_contactless: transaction.isContactless,
    };
    
    console.log('Sending to Supabase:', transactionData);
    
    // Then add the transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();
      
    if (error) {
      // If Supabase fails, fall back to local storage
      console.error('Error adding transaction to Supabase, using local storage fallback:', error);
      
      return saveTransactionToLocalStorage(transaction, savedMerchant);
    }
    
    console.log('Transaction saved successfully to Supabase:', data);
    
    // Return the newly created transaction
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
      // For fallback, try to get existing merchant to prevent duplicates
      const existingMerchant = await getMerchantByName(transaction.merchant.name);
      return saveTransactionToLocalStorage(transaction, existingMerchant);
    } catch (innerError) {
      console.error('Error in local storage fallback:', innerError);
      throw new Error('Failed to save transaction');
    }
  }
};

// Helper function to save a transaction to local storage
const saveTransactionToLocalStorage = async (
  transaction: Omit<Transaction, 'id'>, 
  savedMerchant?: any
): Promise<Transaction> => {
  try {
    // Generate a random UUID for the transaction
    const id = crypto.randomUUID();
    
    // If we don't have a saved merchant, create one with a unique ID
    let merchant;
    if (!savedMerchant) {
      // Try to find an existing merchant with the same name to prevent duplicates
      const existingMerchants = JSON.parse(localStorage.getItem('expenseTracker_merchants') || '[]');
      merchant = existingMerchants.find((m: any) => 
        m.name.toLowerCase() === transaction.merchant.name.toLowerCase()
      );
      
      if (!merchant) {
        // Create a new merchant if none exists
        merchant = {
          ...transaction.merchant,
          id: crypto.randomUUID(),
        };
        
        // Save the new merchant to localStorage
        existingMerchants.push(merchant);
        localStorage.setItem('expenseTracker_merchants', JSON.stringify(existingMerchants));
        console.log('New merchant saved to local storage:', merchant);
      } else {
        console.log('Using existing merchant from local storage:', merchant);
      }
    } else {
      merchant = savedMerchant;
    }
    
    // Import here to avoid circular dependencies
    const { getCategoryFromMCC } = await import('../categoryMapping');
    const { isFoodMerchant } = await import('../categoryMapping');
    
    // Determine category - use multiple approaches for better categorization
    let category = transaction.category;
    
    if (!category || category === 'Uncategorized') {
      // Try to get category from MCC code
      if (merchant.mcc?.code) {
        category = getCategoryFromMCC(merchant.mcc.code);
      }
      
      // If still uncategorized, try to infer from merchant name
      if (!category || category === 'Uncategorized') {
        if (isFoodMerchant(merchant.name)) {
          category = 'Food & Drinks';
        }
      }
      
      // Still no category, default to a general one
      if (!category || category === 'Uncategorized') {
        category = 'Uncategorized';
      }
    }
    
    // Calculate points if not already set
    let rewardPoints = transaction.rewardPoints || 0;
    if (rewardPoints === 0 && transaction.paymentMethod.type === 'credit_card') {
      // Simple point calculation if none was provided
      const basePointRate = 0.4; // Default rate for basic points
      rewardPoints = Math.round(transaction.amount * basePointRate);
      
      // Extra points for UOB cards
      if (transaction.paymentMethod.issuer === 'UOB' && 
          transaction.paymentMethod.name.includes('Platinum') && 
          transaction.isContactless) {
        const bonusPointRate = 3.6; // UOB bonus rate
        const bonusPoints = Math.round(transaction.amount * bonusPointRate);
        rewardPoints += bonusPoints;
      }
    }
    
    // Create the transaction object
    const newTransaction: Transaction = {
      id,
      date: transaction.date,
      merchant,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      paymentMethod: transaction.paymentMethod,
      paymentAmount: Number(transaction.paymentAmount || transaction.amount),
      paymentCurrency: transaction.paymentCurrency || transaction.currency,
      rewardPoints: rewardPoints,
      notes: transaction.notes || '',
      category: category,
      isContactless: transaction.isContactless || false,
    };
    
    // Get existing transactions from local storage
    const transactions = getTransactionsFromLocalStorage();
    
    // Add the new transaction
    transactions.push(newTransaction);
    
    // Save to local storage
    saveTransactionsToLocalStorage(transactions);
    
    console.log('Transaction saved to local storage:', newTransaction);
    
    return newTransaction;
  } catch (error) {
    console.error('Error in saveTransactionToLocalStorage:', error);
    throw new Error('Failed to save transaction to local storage');
  }
};

// Edit an existing transaction
export const editTransaction = async (id: string, updatedTransaction: Omit<Transaction, 'id'>): Promise<Transaction | null> => {
  // Get existing transactions to check if we're in local storage mode
  const existingTransactions = getTransactionsFromLocalStorage();
  const transaction = existingTransactions.find(t => t.id === id);
  
  // If transaction exists in local storage, update it there
  if (transaction) {
    try {
      // Update in local storage
      const updatedTransactions = existingTransactions.map(t => {
        if (t.id === id) {
          // For local storage, we need to handle merchant lookup ourselves
          // to avoid duplicate merchant entries
          return {
            id,
            ...updatedTransaction,
          };
        }
        return t;
      });
      
      saveTransactionsToLocalStorage(updatedTransactions);
      
      // Find and return the updated transaction
      const updated = updatedTransactions.find(t => t.id === id);
      return updated || null;
    } catch (error) {
      console.error('Error updating transaction in local storage:', error);
      return null;
    }
  }
  
  // Otherwise try Supabase
  try {
    // First ensure the merchant exists
    const savedMerchant = await addOrUpdateMerchant(updatedTransaction.merchant);
    
    // Then update the transaction
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
        // Add category based on MCC code or use provided category
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
    
    // Return the updated transaction
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

// Delete a transaction
export const deleteTransaction = async (id: string): Promise<boolean> => {
  // Get existing transactions to check if we're in local storage mode
  const existingTransactions = getTransactionsFromLocalStorage();
  const transaction = existingTransactions.find(t => t.id === id);
  
  // If transaction exists in local storage, delete it there
  if (transaction) {
    try {
      const updatedTransactions = existingTransactions.filter(t => t.id !== id);
      saveTransactionsToLocalStorage(updatedTransactions);
      return true;
    } catch (error) {
      console.error('Error deleting transaction from local storage:', error);
      return false;
    }
  }
  
  // Otherwise try Supabase
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
  
  return true;
};

// Export a transactions list as CSV
export const exportTransactionsToCSV = (transactions: Transaction[]): string => {
  if (transactions.length === 0) {
    return '';
  }
  
  // CSV header
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
  
  // CSV rows
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
