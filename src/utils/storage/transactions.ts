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
  }
};

// Get transactions from Supabase with local storage fallback
export const getTransactions = async (): Promise<Transaction[]> => {
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
      const stored = localStorage.getItem(TRANSACTIONS_KEY);
      console.log('Falling back to local storage for transactions');
      return stored ? JSON.parse(stored) : [];
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
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    console.log('Falling back to local storage due to exception');
    return stored ? JSON.parse(stored) : [];
  }
};

// Add a new transaction with local storage fallback
export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  console.log('Adding transaction to database:', transaction);
  
  // First ensure the merchant exists
  if (!transaction.merchant || !transaction.merchant.name) {
    throw new Error('Merchant information is missing');
  }
  
  if (!transaction.paymentMethod || !transaction.paymentMethod.id) {
    throw new Error('Payment method information is missing');
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
      
      // Generate a random UUID for the transaction
      const id = crypto.randomUUID();
      
      // Create the transaction object
      const newTransaction: Transaction = {
        id,
        date: transaction.date,
        merchant: savedMerchant,
        amount: Number(transaction.amount),
        currency: transaction.currency,
        paymentMethod: transaction.paymentMethod,
        paymentAmount: Number(transaction.paymentAmount),
        paymentCurrency: transaction.paymentCurrency,
        rewardPoints: transaction.rewardPoints,
        notes: transaction.notes,
        category: transaction.category || getCategoryFromMCC(transaction.merchant.mcc?.code),
        isContactless: transaction.isContactless,
      };
      
      // Get existing transactions from local storage
      const existingTransactions = localStorage.getItem(TRANSACTIONS_KEY);
      const transactions: Transaction[] = existingTransactions ? JSON.parse(existingTransactions) : [];
      
      // Add the new transaction
      transactions.push(newTransaction);
      
      // Save to local storage
      saveTransactionsToLocalStorage(transactions);
      
      console.log('Transaction saved to local storage:', newTransaction);
      
      return newTransaction;
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
    
    // Generate a random UUID for the transaction
    const id = crypto.randomUUID();
    
    // Create the transaction object
    const newTransaction: Transaction = {
      id,
      date: transaction.date,
      merchant: {
        ...transaction.merchant,
        id: crypto.randomUUID(),
      },
      amount: Number(transaction.amount),
      currency: transaction.currency,
      paymentMethod: transaction.paymentMethod,
      paymentAmount: Number(transaction.paymentAmount),
      paymentCurrency: transaction.paymentCurrency,
      rewardPoints: transaction.rewardPoints,
      notes: transaction.notes,
      category: transaction.category || getCategoryFromMCC(transaction.merchant.mcc?.code),
      isContactless: transaction.isContactless,
    };
    
    // Get existing transactions from local storage
    const existingTransactions = localStorage.getItem(TRANSACTIONS_KEY);
    const transactions: Transaction[] = existingTransactions ? JSON.parse(existingTransactions) : [];
    
    // Add the new transaction
    transactions.push(newTransaction);
    
    // Save to local storage
    saveTransactionsToLocalStorage(transactions);
    
    console.log('Transaction saved to local storage due to exception:', newTransaction);
    
    return newTransaction;
  }
};

// Edit an existing transaction
export const editTransaction = async (id: string, updatedTransaction: Omit<Transaction, 'id'>): Promise<Transaction | null> => {
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
};

// Delete a transaction
export const deleteTransaction = async (id: string): Promise<boolean> => {
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
